import os
import requests
from dotenv import load_dotenv
import webbrowser
import tempfile
from html import escape
import argparse
import sys
import mysql.connector
from mysql.connector import Error
import time

# Load environment variables from .env file
load_dotenv(dotenv_path="/home/bitnami/scripts/financial/investment-tracker/backend/.env")

FMP_API_KEY = os.getenv("FMP_API_KEY")
BASE_URL = "https://financialmodelingprep.com/stable/financial-reports-dates"

def fetch_financial_report_dates(symbol: str):
    """
    Fetches the financial report dates for a given symbol using the Financial Modeling Prep API.

    Args:
        symbol (str): The stock symbol (e.g., 'AAPL').

    Returns:
        list: A list of dictionaries containing report date info, or None on failure.
    """
    if not FMP_API_KEY:
        raise EnvironmentError("FMP_API_KEY not set in environment variables.")

    try:
        url = f"{BASE_URL}?symbol={symbol}&apikey={FMP_API_KEY}"
        print(f"[DEBUG] Fetching URL: {url.replace(FMP_API_KEY, '****')}")
        response = requests.get(url, timeout=10)
        print(f"[DEBUG] HTTP Status: {response.status_code}")
        response.raise_for_status()

        data = response.json()
        print(f"[DEBUG] API Response: {data}")
        if not isinstance(data, list):
            raise ValueError("Unexpected response format")

        return data

    except requests.HTTPError as e:
        if response.status_code == 429:
            print("[ERROR] API rate limit exceeded.")
        else:
            print(f"[ERROR] HTTP request failed: {e}")
    except ValueError as e:
        print(f"[ERROR] JSON parsing failed: {e}")
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
    return None

def fetch_report_data(url):
    """
    Fetches financial report data from the given URL.

    Args:
        url (str): The API URL to fetch the report.

    Returns:
        dict: The report data, or None on failure.
    """
    try:
        print(f"[DEBUG] Fetching report URL: {url.replace(FMP_API_KEY, '****')}")
        response = requests.get(url, timeout=10)
        print(f"[DEBUG] Report HTTP Status: {response.status_code}")
        response.raise_for_status()
        data = response.json()
        print(f"[DEBUG] Report Data: {data}")
        return data
    except Exception as e:
        print(f"[ERROR] Could not fetch report: {e}")
        return None

def flatten_dict(d, parent_key='', sep='_'):
    """
    Flattens a nested dictionary into a single-level dictionary.

    Args:
        d: The dictionary to flatten.
        parent_key: The parent key for nested items.
        sep: Separator for nested keys.

    Returns:
        dict: Flattened dictionary.
    """
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep).items())
        elif isinstance(v, list):
            for i, val in enumerate(v):
                if isinstance(val, dict):
                    items.extend(flatten_dict(val, f"{new_key}_{i}", sep).items())
                else:
                    items.append((f"{new_key}_{i}", str(val)))
        else:
            items.append((new_key, str(v)))
    return dict(items)

def open_html_preview(html_content):
    """
    Opens HTML content in a browser for preview.

    Args:
        html_content (str): The HTML content to display.
    """
    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.html') as f:
        f.write(html_content)
        print(f"[SAVED] Preview HTML written to: file://{f.name}")
        webbrowser.open(f"file://{f.name}")

def insert_report_to_db(symbol, year, period, data):
    """
    Inserts report data into the MySQL database.

    Args:
        symbol (str): Stock symbol.
        year (int): Fiscal year.
        period (str): Report period (e.g., 'Q1').
        data (dict): Report data to insert.
    """
    try:
        print(f"[DEBUG] DB Config: host={os.getenv('DB_HOST')}, user={os.getenv('DB_USER')}, db={os.getenv('DB_NAME')}, port={os.getenv('DB_PORT')}")
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        if connection.is_connected():
            print("[DB] Connected to database.")
            cursor = connection.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS financial_reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    symbol VARCHAR(10),
                    year INT,
                    period VARCHAR(20),
                    key_name VARCHAR(255),
                    value TEXT
                )
            """)
            print("[DB] Table 'financial_reports' is ready.")

            # If this is metadata from the list of reports
            if all(key in data for key in ("symbol", "fiscalYear", "period", "linkJson", "linkXlsx")):
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS financial_reports_meta (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        symbol VARCHAR(10),
                        fiscal_year INT,
                        period VARCHAR(10),
                        link_json TEXT,
                        link_xlsx TEXT
                    )
                """)
                print("[DB] Table 'financial_reports_meta' is ready.")

                link_json = f"https://financialmodelingprep.com/stable/financial-reports-json?symbol={data['symbol']}&year={data['fiscalYear']}&period={data['period']}&apikey={FMP_API_KEY}"
                link_xlsx = f"https://financialmodelingprep.com/stable/financial-reports-xlsx?symbol={data['symbol']}&year={data['fiscalYear']}&period={data['period']}&apikey={FMP_API_KEY}"

                cursor.execute("""
                    INSERT INTO financial_reports_meta (symbol, fiscal_year, period, link_json, link_xlsx)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    data["symbol"],
                    int(data["fiscalYear"]),
                    data["period"],
                    link_json,
                    link_xlsx
                ))
                connection.commit()
                print(f"[DB] Inserted metadata for {data['symbol']} {data['fiscalYear']} {data['period']}")
                return

            if not isinstance(data, dict):
                print(f"[ERROR] Data is not a dictionary: {data}")
                return

            # Flatten the data
            flattened_data = flatten_dict(data)
            print(f"[DEBUG] Flattened data: {flattened_data}")

            for k, v in flattened_data.items():
                cursor.execute("""
                    INSERT INTO financial_reports (symbol, year, period, key_name, value)
                    VALUES (%s, %s, %s, %s, %s)
                """, (symbol, int(year), period, k[:255], v))
                print(f"[DEBUG] Executed INSERT: symbol={symbol}, year={year}, period={period}, key={k}, value={v}")

            connection.commit()
            print(f"[DB] Inserted {len(flattened_data)} entries for {symbol} {year} {period}")

    except mysql.connector.Error as e:
        print(f"[DB ERROR] Failed to insert data: {e}")
        if 'connection' in locals():
            connection.rollback()
    except Exception as e:
        print(f"[ERROR] Unexpected error in insert_report_to_db: {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("[DB] Connection closed.")

def initialize_database():
    """
    Initializes the database schema.
    """
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        if connection.is_connected():
            print("[DB] Initializing database schema...")
            cursor = connection.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS financial_reports (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    symbol VARCHAR(10),
                    year INT,
                    period VARCHAR(20),
                    key_name VARCHAR(255),
                    value TEXT
                )
            """)
            print("[DB] Table 'financial_reports' is ready.")
    except Error as e:
        print(f"[DB ERROR] {e}")
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("[DB] Connection closed.")

def main():
    parser = argparse.ArgumentParser(description="Fetch and display financial reports.")
    parser.add_argument("--symbol", type=str, default="AAPL", help="Stock symbol (default: AAPL)")
    parser.add_argument("--year", type=int, default=2025, help="Target fiscal year (default: 2025)")
    parser.add_argument("--init-db", action="store_true", help="Initialize database tables only")

    args = parser.parse_args()

    if args.init_db:
        initialize_database()
        sys.exit(0)

    symbol = args.symbol
    target_year = args.year

    reports = fetch_financial_report_dates(symbol)
    if reports:
        for report in reports:
            year = report.get("fiscalYear")
            if year != target_year:
                print(f"[INFO] Skipping report for year {year} (target: {target_year})")
                continue
            period = report.get("period")
            url = f"https://financialmodelingprep.com/api/v3/financial-reports-json?symbol={symbol}&year={year}&period={period}&apikey={FMP_API_KEY}"
            masked_url = url.replace(FMP_API_KEY, "****")
            print(f"[INFO] Processing {year} {period}: {masked_url}")
            
            insert_report_to_db(symbol, year, period, report)
            data = fetch_report_data(url)
            if data and isinstance(data, dict):
                print(f"[INFO] Inserting report data for {symbol} {year} {period} into database...")
                insert_report_to_db(symbol, year, period, data)
            else:
                print(f"[ERROR] Invalid or no financial data found for {year} {period}")
                print(f"[DEBUG] Raw response: {data}")
            time.sleep(1)  # Avoid API rate limits
    else:
        print("[ERROR] No data found or an error occurred.")

if __name__ == "__main__":
    main()