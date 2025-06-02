import requests
import logging

import mysql.connector
import os

from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Connect to MySQL using environment variables
connection = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    port=int(os.getenv("DB_PORT", 3306))
)
cursor = connection.cursor()

create_table_query = """
CREATE TABLE IF NOT EXISTS usa_etfs (
    symbol VARCHAR(20) NOT NULL,
    country VARCHAR(100),
    weight_percentage VARCHAR(10),
    name VARCHAR(255),
    description TEXT,
    isin VARCHAR(50),
    asset_class VARCHAR(100),
    security_cusip VARCHAR(50),
    domicile VARCHAR(10),
    website TEXT,
    etf_company VARCHAR(100),
    expense_ratio DECIMAL(10,6),
    assets_under_management BIGINT,
    avg_volume BIGINT,
    inception_date DATE,
    nav DECIMAL(12,2),
    nav_currency VARCHAR(10),
    holdings_count INT,
    updated_at DATETIME,
    PRIMARY KEY (symbol, country)
)
"""
cursor.execute(create_table_query)
connection.commit()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Replace 'YOUR_API_KEY' with your actual Financial Modeling Prep API key
api_key = 'KbZqIumPoV2pkLZk2V4XUmXRef5czO5Q'


url = f"https://financialmodelingprep.com/api/v3/stock-screener?apikey={api_key}&isEtf=true&country=US"

# Make the GET request
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    if isinstance(data, list) and len(data) > 0:
        logging.info(f"Retrieved {len(data)} US ETFs. Fetching country weightings...")
        for etf in data:
            symbol = etf.get('symbol')
            if symbol:
                # Check if ETF already exists
                cursor.execute("SELECT 1 FROM usa_etfs WHERE symbol = %s LIMIT 1", (symbol,))
                if cursor.fetchone():
                    logging.info(f"ETF {symbol} already exists in database. Skipping.")
                    continue
                
                cw_url = f"https://financialmodelingprep.com/api/v3/etf/country-weightings?apikey={api_key}&symbol={symbol}"
                cw_response = requests.get(cw_url)
                insert_query = """
                    INSERT INTO usa_etfs (symbol, country, weight_percentage)
                    VALUES (%s, %s, %s)
                """
                if cw_response.status_code == 200:
                    cw_data = cw_response.json()
                    logging.info(f"Country weightings for {symbol}:")
                    if isinstance(cw_data, list):
                        for allocation in cw_data:
                            country = allocation.get('country', 'N/A')
                            weight = allocation.get('weightPercentage', 'N/A')
                            logging.info(f"  Country: {country}, Weight: {weight}")
                            cursor.execute(insert_query, (symbol, country, weight))
                            connection.commit()
                        # Fetch additional ETF info
                        info_url = f"https://financialmodelingprep.com/api/v3/etf/info?apikey={api_key}&symbol={symbol}"
                        info_response = requests.get(info_url)
                        if info_response.status_code == 200:
                            info_data = info_response.json()
                            if isinstance(info_data, list) and len(info_data) > 0:
                                etf_info = info_data[0]
                                update_query = """
                                    UPDATE usa_etfs
                                    SET name = %s,
                                        description = %s,
                                        isin = %s,
                                        asset_class = %s,
                                        security_cusip = %s,
                                        domicile = %s,
                                        website = %s,
                                        etf_company = %s,
                                        expense_ratio = %s,
                                        assets_under_management = %s,
                                        avg_volume = %s,
                                        inception_date = %s,
                                        nav = %s,
                                        nav_currency = %s,
                                        holdings_count = %s,
                                        updated_at = %s
                                    WHERE symbol = %s
                                """
                                cursor.execute(update_query, (
                                    etf_info.get('name'),
                                    etf_info.get('description'),
                                    etf_info.get('isin'),
                                    etf_info.get('assetClass'),
                                    etf_info.get('securityCusip'),
                                    etf_info.get('domicile'),
                                    etf_info.get('website'),
                                    etf_info.get('etfCompany'),
                                    etf_info.get('expenseRatio'),
                                    etf_info.get('assetsUnderManagement'),
                                    etf_info.get('avgVolume'),
                                    etf_info.get('inceptionDate'),
                                    etf_info.get('nav'),
                                    etf_info.get('navCurrency'),
                                    etf_info.get('holdingsCount'),
                                    etf_info.get('updatedAt'),
                                    symbol
                                ))
                                connection.commit()
                            else:
                                logging.warning(f"No detailed ETF info found for {symbol}")
                        else:
                            logging.error(f"Failed to fetch ETF info for {symbol}: {info_response.status_code}")
                    else:
                        logging.warning(f"No allocation data for {symbol}")
                else:
                    logging.error(f"Failed to fetch allocation for {symbol}: {cw_response.status_code}")
    else:
        logging.warning("Unexpected screener response format or empty data.")
else:
    logging.error(f"Failed to retrieve ETF list. Status code: {response.status_code}")

cursor.close()
connection.close()