import os
from dotenv import load_dotenv
import pandas as pd
import mysql.connector
import yfinance as yf
from datetime import datetime
import logging

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
    df = pd.read_sql("SELECT ticker, distribution_frequency, dividend_rate FROM high_yield_etfs", conn)
    logger.info("Loaded ETF data from database.")
    conn.close()
except Exception as e:
    logger.error(f"Failed to load ETF data from database: {e}")
    df = pd.DataFrame(columns=['ticker', 'distribution_frequency', 'dividend_rate'])

# Function to scrape dividend data from Yahoo Finance for missing tickers
def scrape_yahoo_finance(ticker):
    try:
        logger.info(f"Scraping dividend data for {ticker}")
        stock = yf.Ticker(ticker)
        dividends = stock.dividends
        if not dividends.empty:
            latest_dividend = dividends[-1] if len(dividends) > 0 else None
            frequency = stock.info.get('dividendRate', None)
            # Estimate frequency if possible
            if frequency:
                frequency = 'monthly' if stock.info.get('exDividendDate') else 'quarterly'
            else:
                frequency = 'unknown'
            return latest_dividend, frequency
        else:
            logger.warning(f"No dividend data found for {ticker}")
            return None, 'unknown'
    except Exception as e:
        logger.error(f"Error scraping {ticker}: {str(e)}")
        return None, 'unknown'


# Fill missing data
for index, row in df.iterrows():
    if row['dividend_rate'] is None or row['distribution_frequency'] == 'unknown':
        dividend, frequency = scrape_yahoo_finance(row['ticker'])
        if dividend:
            df.at[index, 'dividend_rate'] = dividend
        if frequency != 'unknown':
            df.at[index, 'distribution_frequency'] = frequency

# Replace NaN values with None for safe MySQL insertion
df = df.where(pd.notnull(df), None)

# Log the full scraped DataFrame
logger.info("Scraped ETF Data:\n%s", df.to_string(index=False))

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
                SET dividend_rate = %s, distribution_frequency = %s
                WHERE ticker = %s
                """
                values = (
                    dividend_rate if dividend_rate is not None else None,
                    distribution_frequency,
                    ticker
                )
            else:
                # Insert new record
                query = """
                INSERT INTO high_yield_etfs (ticker, dividend_rate, distribution_frequency)
                VALUES (%s, %s, %s)
                """
                values = (
                    ticker,
                    dividend_rate if dividend_rate is not None else None,
                    distribution_frequency
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