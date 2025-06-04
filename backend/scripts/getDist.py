import yfinance as yf
import argparse
import pandas as pd

# CLI setup
parser = argparse.ArgumentParser(description='Fetch dividend history for a ticker.')
parser.add_argument('--symbol', type=str, default='MSTY', help='Ticker symbol (default: MSTY)')
args = parser.parse_args()

# Load ticker from CLI
ticker = yf.Ticker(args.symbol)

# Get historical dividends
dividends = ticker.dividends
print(dividends.tail())  # Latest dividends

# Infer distribution frequency
if len(dividends) >= 2:
    dividend_dates = dividends.index.to_series().sort_values()
    intervals = dividend_dates.diff().dropna().dt.days
    avg_days = intervals.mean()

    if avg_days < 45:
        frequency = "Monthly"
    elif avg_days < 100:
        frequency = "Quarterly"
    elif avg_days < 200:
        frequency = "Semi-Annual"
    else:
        frequency = "Annual"
else:
    frequency = "Unknown"

print(f"Estimated Distribution Frequency: {frequency}")
