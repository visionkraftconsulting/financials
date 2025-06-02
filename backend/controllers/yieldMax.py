from bs4 import BeautifulSoup
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

import requests

from flask import Flask, request, jsonify

app = Flask(__name__)


SCRAPER_API_KEY = '3f675a316e5747b7833ae6161ecfa1c8'
TARGET_URL = 'https://www.yieldmaxetfs.com/our-etfs/'
SCRAPER_API_URL = 'https://api.scraperapi.com/'

def fetch_yieldmax_html():
    print("[INFO] Fetching HTML content from YieldMax...")
    try:
        response = requests.get(TARGET_URL, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"[ERROR] Failed to fetch HTML from YieldMax: {e}")
        return None

def parse_etf_data_from_html(html):
    etf_data = []
    try:
        soup = BeautifulSoup(html, 'html.parser')
        tables = soup.find_all('table')
        print("[DEBUG] Detected table headers:")
        for table in tables:
            headers = [th.get_text(strip=True) for th in table.find_all('th')]
            print(f" - {headers}")
        for table in tables:
            headers = [th.get_text(strip=True) for th in table.find_all('th')]
            headers = [h.lower() for h in headers]
            if 'ticker' in headers and 'distribution rate' in ''.join(headers):
                rows = table.find_all('tr')[1:]
                for row in rows:
                    cols = [td.get_text(strip=True) for td in row.find_all('td')]
                    if len(cols) >= 7:
                        try:
                            # Skip wdt_ID (cols[0])
                            ticker = cols[1].strip()
                            fund_name = cols[2].strip()
                            reference_asset = cols[3].strip()
                            distribution_rate_raw = cols[4].strip()
                            sec_yield_raw = cols[5].strip()
                            print(f"[DEBUG] Raw Data - Ticker: {ticker}, Distribution Rate: '{distribution_rate_raw}', SEC Yield: '{sec_yield_raw}'")
                            distribution_rate = distribution_rate_raw.replace('[', '').replace(']', '')
                            sec_yield = sec_yield_raw.replace('[', '').replace(']', '')
                            expense_ratio = cols[6].strip().replace('[', '').replace(']', '')

                            # Normalize missing values, preserving percentage symbols
                            distribution_rate = '0.00%' if distribution_rate in ('', '-', '—') else distribution_rate
                            sec_yield = '0.00%' if sec_yield in ('', '-', '—') else sec_yield
                            expense_ratio = '0.00%' if expense_ratio in ('', '-', '—') else expense_ratio

                            etf_data.append({
                                "ticker": ticker,
                                "fund_name": fund_name,
                                "reference_asset": reference_asset,
                                "distribution_rate": distribution_rate,
                                "sec_yield": sec_yield,
                                "expense_ratio": expense_ratio
                            })
                        except Exception as parse_error:
                            print(f"[WARN] Skipping malformed row: {cols} | Error: {parse_error}")
                    else:
                        print(f"[WARN] Row skipped due to insufficient columns: {cols}")
        print(f"[INFO] Parsed {len(etf_data)} ETF records from HTML.")
    except Exception as ex:
        print(f"[ERROR] Failed to parse ETF data from HTML: {ex}")
    return etf_data

def insert_into_database(etfs):
    connection = None
    try:
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            port=int(os.getenv("DB_PORT", 3306))
        )
        if not connection.is_connected():
            raise Error("Connection failed. Please ensure MySQL server is running and reachable on host '{host}:{port}'.".format(
                host=os.getenv("DB_HOST", "localhost"),
                port=os.getenv("DB_PORT", 3306)
            ))

        cursor = connection.cursor()
        create_table_query = """
        CREATE TABLE IF NOT EXISTS fallback_etf_data (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ticker VARCHAR(20) UNIQUE,
            fund_name VARCHAR(255),
            reference_asset VARCHAR(255)
        );
        """
        cursor.execute(create_table_query)

        # Ensure required columns exist
        required_columns = {
            'fund_name': "VARCHAR(255)",
            'reference_asset': "VARCHAR(255)",
            'distribution_rate': "VARCHAR(50)",
            'sec_yield': "VARCHAR(50)",
            'expense_ratio': "VARCHAR(50)"
        }

        cursor.execute("SHOW COLUMNS FROM fallback_etf_data")
        existing_columns = {row[0] for row in cursor.fetchall()}

        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                alter_query = f"ALTER TABLE fallback_etf_data ADD COLUMN {column_name} {column_type}"
                print(f"[INFO] Adding missing column: {column_name}")
                cursor.execute(alter_query)

        insert_query = """
        INSERT INTO fallback_etf_data 
        (ticker, fund_name, reference_asset, distribution_rate, sec_yield, expense_ratio) 
        VALUES (%s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            fund_name = VALUES(fund_name),
            reference_asset = VALUES(reference_asset),
            distribution_rate = VALUES(distribution_rate),
            sec_yield = VALUES(sec_yield),
            expense_ratio = VALUES(expense_ratio)
        """
        print("[DEBUG] ETF records to insert:")
        for etf in etfs:
            print(etf)
        for etf in etfs:
            cursor.execute(insert_query, (
                etf['ticker'], etf['fund_name'], etf['reference_asset'],
                etf['distribution_rate'], etf['sec_yield'], etf['expense_ratio']
            ))
            print(f"Inserted ETF {etf['ticker']} with dist_rate: {etf.get('distribution_rate')} | sec_yield: {etf.get('sec_yield')}")

        connection.commit()
        print(f"[INFO] Inserted {len(etfs)} ETF records.")
    except Error as e:
        print(f"[ERROR] MySQL error: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("[INFO] MySQL connection closed.")



# Flask route for API
@app.route('/api/fetch-etfs', methods=['POST'])
def fetch_and_store_etfs():
    html_content = fetch_yieldmax_html()
    if not html_content:
        return jsonify({"success": False, "message": "Failed to fetch HTML"}), 500

    etfs = parse_etf_data_from_html(html_content)
    if not etfs:
        return jsonify({"success": False, "message": "Failed to parse ETF data"}), 500

    insert_into_database(etfs)
    return jsonify({"success": True, "message": f"Inserted {len(etfs)} ETF records."})


# Standalone function for cron or CLI usage
def run_etf_scraper():
    html_content = fetch_yieldmax_html()
    if not html_content:
        print("[ERROR] No HTML fetched.")
        return
    etfs = parse_etf_data_from_html(html_content)
    if not etfs:
        print("[ERROR] No ETF data parsed.")
        return
    insert_into_database(etfs)

if __name__ == '__main__':
    import sys
    if '--cron' in sys.argv:
        run_etf_scraper()
    else:
        app.run(host='0.0.0.0', port=5005, debug=True)