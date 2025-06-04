import os
from dotenv import load_dotenv
import pandas as pd
import mysql.connector
from twelvedata import TDClient
from datetime import datetime
import logging
import argparse

# Load environment variables from .env file
load_dotenv('/home/bitnami/scripts/financial/investment-tracker/backend/.env')

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MySQL connection configuration loaded from environment variables
db_config = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_NAME')
}

# Fetch ETF data from the database
try:
    conn = mysql.connector.connect(**db_config)
    df = pd.read_sql("SELECT ticker, distribution_frequency, dividend_rate, latest_dividend_date FROM high_yield_etfs", conn)
    logger.info("Loaded ETF data from database.")
    conn.close()
except Exception as e:
    logger.error(f"Failed to load ETF data from database: {e}")
    df = pd.DataFrame(columns=['ticker', 'distribution_frequency', 'dividend_rate', 'latest_dividend_date'])


# Initialize Twelve Data client
td = TDClient(apikey=os.getenv("TWELVE_DATA_API_KEY"))

def fetch_earnings_calendar(symbol):
    td_local = TDClient(apikey=os.getenv("TWELVE_DATA_API_KEY"))
    try:
        data = td_local.get_earnings_calendar(symbol=symbol).as_json()
        # Filter for entries where entry['symbol'] == symbol
        filtered = [entry for entry in data if entry.get('symbol') == symbol] if isinstance(data, list) else []
        logger.info(f"Earnings calendar for {symbol} (filtered): {filtered}")
        return filtered
    except Exception as e:
        logger.error(f"Failed to fetch earnings calendar for {symbol} from Twelve Data: {e}")
        return None

# Fill missing data using Twelve Data API
for index, row in df.iterrows():
    if row['dividend_rate'] is None or row['distribution_frequency'] == 'unknown':
        symbol = row['ticker']
        try:
            data = td.get_dividends(symbol=symbol).as_json()
            if data and isinstance(data, dict) and 'values' in data and len(data['values']) > 0:
                values = data['values']
                latest = values[0]
                latest_amount = float(latest['dividend'])
                latest_date = latest['date']
                df.at[index, 'dividend_rate'] = latest_amount
                df.at[index, 'latest_dividend_date'] = latest_date

                # Estimate frequency
                if len(values) >= 2:
                    date1 = datetime.strptime(values[0]['date'], '%Y-%m-%d')
                    date2 = datetime.strptime(values[1]['date'], '%Y-%m-%d')
                    delta = (date1 - date2).days
                    if delta < 10:
                        freq = 'weekly'
                    elif delta < 40:
                        freq = 'monthly'
                    elif delta < 100:
                        freq = 'quarterly'
                    elif delta < 400:
                        freq = 'yearly'
                    else:
                        freq = 'unknown'
                    df.at[index, 'distribution_frequency'] = freq
        except Exception as e:
            logger.error(f"Failed to fetch data for {symbol} from Twelve Data: {e}")

# Replace NaN values with None for safe MySQL insertion
df = df.where(pd.notnull(df), None)


# Function to update MySQL table
def update_mysql_table(df, db_config):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Update or insert data
        for _, row in df.iterrows():
            ticker = str(row['ticker']) if not pd.isna(row['ticker']) else None
            dividend_rate = float(row['dividend_rate']) if not pd.isna(row['dividend_rate']) else None
            distribution_frequency = str(row['distribution_frequency']) if not pd.isna(row['distribution_frequency']) else None
            
            # Check if ticker exists
            cursor.execute("SELECT COUNT(*) FROM high_yield_etfs WHERE ticker = %s", (ticker,))
            exists = cursor.fetchone()[0] > 0
            
            if exists:
                # Update existing record
                query = """
                UPDATE high_yield_etfs
                SET dividend_rate = %s, distribution_frequency = %s, latest_dividend_date = %s
                WHERE ticker = %s
                """
                values = (
                    dividend_rate if dividend_rate is not None else None,
                    distribution_frequency,
                    row['latest_dividend_date'],
                    ticker
                )
            else:
                # Insert new record
                query = """
                INSERT INTO high_yield_etfs (ticker, dividend_rate, distribution_frequency, latest_dividend_date)
                VALUES (%s, %s, %s, %s)
                """
                values = (
                    ticker,
                    dividend_rate if dividend_rate is not None else None,
                    distribution_frequency,
                    row['latest_dividend_date']
                )
            
            cursor.execute(query, values)
            logger.info(f"Updated/Inserted {ticker} with dividend {dividend_rate}, frequency {distribution_frequency}")
        
        conn.commit()
        logger.info("Database updated successfully")
        
    except mysql.connector.Error as e:
        logger.error(f"Database error: {str(e)}")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Execute update
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Update ETF dividends or fetch earnings calendar.')
    parser.add_argument('--earnings-calendar', action='store_true', help='Fetch earnings calendar for a symbol')
    parser.add_argument('--symbol', type=str, help='Stock ticker symbol')
    args = parser.parse_args()

    if args.earnings_calendar and args.symbol:
        fetch_earnings_calendar(args.symbol)
        exit(0)
    else:
        try:
            update_mysql_table(df, db_config)
        except Exception as e:
            logger.error(f"MySQL update failed. Proceeding with CSV only. Error: {e}")

        # Save DataFrame to CSV for backup
        try:
            df.to_csv('etf_dividend_data.csv', index=False)
            logger.info("Data saved to etf_dividend_data.csv")
        except Exception as e:
            logger.error(f"Failed to save CSV backup: {e}")