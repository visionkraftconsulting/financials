import uuid
from datetime import datetime
import argparse

def calculate_ticker_estimates(ticker, starting_price, asset_type="stock", years=(2025, 2075),
                              cagr_conservative=(0.0925, 0.05), cagr_base=(0.20, 0.10), cagr_bullish=(0.34, 0.15)):
    """
    Calculate price estimates for a given ticker and generate a SQL script to store them.
    
    Parameters:
    - ticker (str): Ticker/symbol (e.g., 'BTC', 'MSTR', 'MSTY').
    - starting_price (float): Starting price in USD for the first year (2025).
    - asset_type (str): 'crypto', 'stock', or 'etf' to set default CAGRs.
    - years (tuple): (start_year, end_year) for the estimation period.
    - cagr_conservative (tuple): (CAGR until 2035, CAGR after 2035) for Conservative scenario.
    - cagr_base (tuple): (CAGR until 2035, CAGR after 2035) for Base scenario.
    - cagr_bullish (tuple): (CAGR until 2035, CAGR after 2035) for Bullish scenario.
    
    Returns:
    - Tuple of (SQL script as a string, estimates list).
    """
    # Sanitize ticker for table name (remove invalid characters)
    ticker = ticker.replace("-", "_").replace(".", "_").lower()
    
    # Set default CAGRs based on asset type if not provided
    if asset_type == "crypto":
        cagr_conservative = (0.0925, 0.05)  # S&P 500-like, then slower
        cagr_base = (0.20, 0.10)           # Moderate BTC growth
        cagr_bullish = (0.34, 0.15)        # High BTC growth
    elif asset_type == "stock":
        cagr_conservative = (0.05, 0.03)   # Below S&P 500
        cagr_base = (0.15, 0.08)           # Moderate stock growth
        cagr_bullish = (0.25, 0.12)        # High stock growth
    elif asset_type == "etf":
        cagr_conservative = (0.03, 0.02)   # Low growth due to options
        cagr_base = (0.10, 0.05)           # Moderate ETF growth
        cagr_bullish = (0.15, 0.08)        # High ETF growth
    
    # Initialize estimates
    estimates = []
    start_year, end_year = years
    
    # Calculate estimates for each year
    for year in range(start_year, end_year + 1):
        years_elapsed = year - start_year
        cagr_c = cagr_conservative[0] if year <= 2035 else cagr_conservative[1]
        cagr_b = cagr_base[0] if year <= 2035 else cagr_base[1]
        cagr_bu = cagr_bullish[0] if year <= 2035 else cagr_bullish[1]
        
        # Compound growth formula: P = P0 * (1 + CAGR)^t
        conservative = round(starting_price * (1 + cagr_c) ** years_elapsed)
        base = round(starting_price * (1 + cagr_b) ** years_elapsed)
        bullish = round(starting_price * (1 + cagr_bu) ** years_elapsed)
        
        estimates.append((year, conservative, base, bullish))
    
    # Generate SQL script
    sql_script = f"""-- Creating table to store {ticker.upper()} price estimates
CREATE TABLE {ticker}_estimates (
    year INT PRIMARY KEY,
    conservative_usd BIGINT,
    base_usd BIGINT,
    bullish_usd BIGINT
);

-- Inserting {ticker.upper()} price estimates from {start_year} to {end_year}
INSERT INTO {ticker}_estimates (year, conservative_usd, base_usd, bullish_usd) VALUES
"""
    
    # Add estimates as SQL INSERT values
    for i, (year, conservative, base, bullish) in enumerate(estimates):
        sql_script += f"({year}, {conservative}, {base}, {bullish})"
        sql_script += "," if i < len(estimates) - 1 else ";"
        sql_script += "\n"
    
    return sql_script, estimates

def main():
    parser = argparse.ArgumentParser(description="Generate SQL price estimates for a given ticker.")
    parser.add_argument("--ticker", type=str, help="Ticker symbol (e.g., BTC, MSTR, MSTY)")
    parser.add_argument("--price", type=float, help="Starting price for 2025 (USD)")
    parser.add_argument("--type", type=str, choices=["crypto", "stock", "etf"], help="Asset type (crypto, stock, etf)")
    args = parser.parse_args()

    # Use CLI arguments if provided, else prompt user
    if args.ticker:
        ticker = args.ticker.strip()
    else:
        ticker = input("Enter the ticker/symbol (e.g., BTC, MSTR, MSTY): ").strip()
    
    if args.price is not None:
        starting_price = args.price
    else:
        starting_price = float(input("Enter the starting price for 2025 (USD): "))
    
    if args.type:
        asset_type = args.type.strip().lower()
    else:
        asset_type = input("Enter asset type (crypto, stock, etf): ").strip().lower()
    
    # Validate asset type
    if asset_type not in ["crypto", "stock", "etf"]:
        asset_type = "stock"
        print("Invalid asset type. Defaulting to 'stock'.")
    
    # Generate SQL script and get estimates
    sql_content, estimates = calculate_ticker_estimates(ticker, starting_price, asset_type)
    
    # Save SQL script to a file
    artifact_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = "valueEstimate.sql"
    
    with open(filename, "w") as f:
        f.write(sql_content)
    
    print(f"SQL script generated: {filename}")
    print("\nSQL Content Preview:")
    print(sql_content[:500] + "..." if len(sql_content) > 500 else sql_content)

    # Print formatted preview of the estimates
    print("\nPrice Estimates Preview:")
    print(f"{'Year':<6} {'Conservative':>15} {'Base':>15} {'Bullish':>15}")
    print("-" * 55)
    for year, conservative, base, bullish in estimates:
        print(f"{year:<6} {conservative:>15,} {base:>15,} {bullish:>15,}")

if __name__ == "__main__":
    main()