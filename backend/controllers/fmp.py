def fetch_dividend_profile(ticker):
    """
    Fetch dividend profile for a given ticker using FMP profile endpoint.
    Returns a dictionary with relevant dividend fields, if available.
    """
    try:
        url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        profile_data = response.json()
        if isinstance(profile_data, list) and profile_data:
            profile = profile_data[0]
            return {
                "lastDiv": profile.get("lastDiv") or profile.get("lastDividend"),
                "lastDividend": profile.get("lastDividend"),
                "dividendYield": profile.get("dividendYield"),
                "dividendDate": profile.get("dividendDate"),
                "symbol": profile.get("symbol"),
                "companyName": profile.get("companyName"),
            }
        else:
            return {"error": f"No profile data found for {ticker}"}
    except requests.exceptions.RequestException as err:
        return {"error": str(err)}
import requests
import json
import os
API_KEY = os.getenv("FMP_API_KEY", "KbZqIumPoV2pkLZk2V4XUmXRef5czO5Q")

# Base URL for FMP API
BASE_URL = "https://financialmodelingprep.com/api/v3"


def fetch_etf_data(ticker):
    """
    Fetch ETF data and quote from FMP for the given ticker.
    Returns a dict with 'etf' and 'quote' keys or error details.
    """
    try:
        etf_list_url = f"{BASE_URL}/etf/list?apikey={API_KEY}"
        etf_response = requests.get(etf_list_url)
        etf_response.raise_for_status()
        try:
            etf_list = etf_response.json()
        except ValueError:
            print(f"[⚠️] Failed to parse ETF list JSON for {ticker}. Response: {etf_response.text}")
            return {"error": f"Invalid JSON for ETF list of {ticker}", "raw_etf_response": etf_response.text}

        if not etf_list or not isinstance(etf_list, list):
            return {"error": f"Invalid ETF list data structure for {ticker}", "raw_etf_response": etf_response.text}

        matching_etfs = [etf for etf in etf_list if etf.get('symbol') == ticker]

        quote_url = f"{BASE_URL}/quote/{ticker}?apikey={API_KEY}"
        quote_response = requests.get(quote_url)
        quote_response.raise_for_status()
        try:
            quote_data = quote_response.json()
        except ValueError:
            print(f"[⚠️] Failed to parse quote JSON for {ticker}. Response: {quote_response.text}")
            return {"error": f"Invalid JSON for quote of {ticker}", "raw_quote_response": quote_response.text}

        if not quote_data or not isinstance(quote_data, list):
            return {"error": f"Invalid quote data structure for {ticker}", "raw_quote_response": quote_response.text}

        return {
            "etf": matching_etfs[0] if matching_etfs else None,
            "quote": quote_data[0] if quote_data else None,
        }

    except requests.exceptions.RequestException as err:
        return {"error": str(err)}

# --- New functions for ETF holdings and info ---
def fetch_etf_holdings(ticker):
    """
    Fetch ETF holdings details from FMP for the given ticker.
    """
    try:
        url = f"https://financialmodelingprep.com/stable/etf/holdings?symbol={ticker}&apikey={API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as err:
        return {"error": str(err)}

def fetch_etf_info(ticker):
    """
    Fetch ETF detailed information from FMP for the given ticker.
    """
    try:
        url = f"https://financialmodelingprep.com/stable/etf/info?symbol={ticker}&apikey={API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as err:
        return {"error": str(err)}

import sys

# --- Reusable function for external scripts (e.g., Node.js) ---
def run_fmp_for_ticker(ticker):
    """
    Fetch ETF info from FMP for external scripts.
    Returns a dictionary with fields: fund_name, price, yield_percent, dividend_rate, distribution_frequency
    """
    result = {
        "ticker": ticker,
        "fund_name": None,
        "price": None,
        "yield_percent": "undefined",
        "dividend_rate": "undefined",
        "distribution_frequency": "undefined"
    }

    try:
        info = fetch_etf_info(ticker)
        quote = fetch_etf_data(ticker).get("quote", {})

        if isinstance(info, list) and len(info) > 0:
            result["fund_name"] = info[0].get("name")
            result["expense_ratio"] = info[0].get("expenseRatio", None)
            result["distribution_frequency"] = info[0].get("frequency", "undefined")

        if isinstance(quote, dict):
            result["price"] = quote.get("price", None)
            result["yield_percent"] = quote.get("yield", quote.get("yieldPercent", "undefined"))
            result["dividend_rate"] = quote.get("lastDiv", "undefined")

        # Graceful error fallback if both fund_name and price are missing
        if result["fund_name"] is None and result["price"] is None:
            result["error"] = "Failed to fetch ETF data from FMP. Please try again."

    except Exception as e:
        result["error"] = str(e)

    return result

def fetch_financial_ratios(ticker, limit=5, period=None):
    """
    Fetch financial ratios for a company using FMP API.
    :param ticker: Stock symbol (e.g., AAPL)
    :param limit: Number of records to return
    :param period: Optional period (e.g., Q1, FY)
    :return: List of ratios or error
    """
    try:
        url = f"https://financialmodelingprep.com/stable/ratios?symbol={ticker}&limit={limit}&apikey={API_KEY}"
        if period:
            url += f"&period={period}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as err:
        return {"error": str(err)}

def fetch_ttm_key_metrics(ticker):
    """
    Fetch trailing twelve-month (TTM) key performance metrics from FMP for the given ticker.
    """
    try:
        url = f"https://financialmodelingprep.com/stable/key-metrics-ttm?symbol={ticker}&apikey={API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as err:
        return {"error": str(err)}

# --- Helper function to fetch dividend calendar frequency ---
from datetime import datetime, timedelta

def fetch_dividend_calendar_frequency(ticker):
    """
    Fetch distribution frequency using dividend calendar if not available in profile or info.
    """
    try:
        to_date = datetime.today().date()
        from_date = to_date - timedelta(days=90)
        url = (
            f"https://financialmodelingprep.com/stable/dividends-calendar?"
            f"from={from_date}&to={to_date}&apikey={API_KEY}"
        )
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        for item in data:
            if item.get("symbol") == ticker and item.get("frequency"):
                return item["frequency"]
        return None
    except requests.exceptions.RequestException:
        return None

# --- ETF Summary Data Function ---
def fetch_etf_summary_data(ticker):
    """
    Fetch ETF summary data including price, 52W high/low, yield, dividend rate, dividend yield, expense ratio, and distribution frequency.
    """
    result = {
        "ticker": ticker,
        "price": None,
        "high_52w": None,
        "low_52w": None,
        "yield_percent": None,
        "dividend_rate": None,
        "dividend_yield": None,
        "expense_ratio": None,
        "distribution_frequency": None,
        "market_cap": None,
        "beta": None,
        "volume": None,
        "avg_volume": None,
        "ipo_date": None,
        "asset_class": None,
        "etf_company": None,
        "website": None,
        "description": None,
        "earnings_yield_ttm": None,
        "dividends_per_share_growth": None,
        "holdings_top": None,
        "exchange": None,
    }

    try:
        quote_url = f"{BASE_URL}/quote/{ticker}?apikey={API_KEY}"
        profile_url = f"https://financialmodelingprep.com/stable/profile?symbol={ticker}&apikey={API_KEY}"
        info_url = f"https://financialmodelingprep.com/stable/etf/info?symbol={ticker}&apikey={API_KEY}"

        quote = requests.get(quote_url)
        quote.raise_for_status()
        quote_data = quote.json()[0] if isinstance(quote.json(), list) else {}

        profile = requests.get(profile_url)
        profile.raise_for_status()
        profile_data = profile.json()[0] if isinstance(profile.json(), list) else {}

        info = requests.get(info_url)
        info.raise_for_status()
        info_json = info.json()
        info_data = info_json[0] if isinstance(info_json, list) and len(info_json) > 0 else {}
        result["fund_name"] = info_data.get("name")

        # Fallback: fetch symbol metadata (name, exchange) from /search-symbol
        try:
            search_url = f"https://financialmodelingprep.com/stable/search-symbol?query={ticker}&apikey={API_KEY}"
            search_response = requests.get(search_url)
            search_response.raise_for_status()
            search_results = search_response.json()
            if isinstance(search_results, list) and len(search_results) > 0:
                result["fund_name"] = result["fund_name"] or search_results[0].get("name")
                result["exchange"] = search_results[0].get("exchangeFullName")
        except Exception:
            result["exchange"] = None

        # Fetch TTM key metrics for earningsYieldTTM
        ttm_url = f"https://financialmodelingprep.com/stable/key-metrics-ttm?symbol={ticker}&apikey={API_KEY}"
        try:
            ttm_response = requests.get(ttm_url)
            ttm_response.raise_for_status()
            ttm_json = ttm_response.json()
            ttm_data = ttm_json[0] if isinstance(ttm_json, list) and len(ttm_json) > 0 else {}
            # Try both camelCase and snake_case for earnings yield TTM
            result["earnings_yield_ttm"] = (
                ttm_data.get("earningsYieldTTM")
                or ttm_data.get("earnings_yield_ttm")
                or None
            )
        except Exception as e:
            # Log or fallback if TTM data is empty or request fails
            result["earnings_yield_ttm"] = None

        # Fetch Financial Growth data for dividendsPerShareGrowth
        growth_url = f"https://financialmodelingprep.com/stable/financial-growth?symbol={ticker}&apikey={API_KEY}"
        try:
            growth_response = requests.get(growth_url)
            growth_response.raise_for_status()
            growth_json = growth_response.json()
            growth_data = growth_json[0] if isinstance(growth_json, list) and len(growth_json) > 0 else {}
            result["dividends_per_share_growth"] = growth_data.get("dividendsPerShareGrowth", None)
        except Exception:
            result["dividends_per_share_growth"] = None

        result["price"] = quote_data.get("price")
        result["high_52w"] = quote_data.get("yearHigh")
        result["low_52w"] = quote_data.get("yearLow")
        result["yield_percent"] = quote_data.get("yield") or quote_data.get("yieldPercent")
        # Update dividend_rate fallback to prioritize known fields, including search-symbol result if available
        result["dividend_rate"] = (
            profile_data.get("lastDividend")
            or profile_data.get("lastDiv")
            or quote_data.get("lastDiv")
            or None
        )
        result["dividend_yield"] = profile_data.get("dividendYield")
        if result["dividend_yield"] is None:
            result["dividend_yield"] = quote_data.get("dividendYield") or quote_data.get("dividendYieldPercent")
        result["expense_ratio"] = info_data.get("expenseRatio")
        result["distribution_frequency"] = info_data.get("frequency")
        if result["distribution_frequency"] is None:
            result["distribution_frequency"] = profile_data.get("distributionFrequency")

        if result["distribution_frequency"] is None:
            result["distribution_frequency"] = fetch_dividend_calendar_frequency(ticker)

        result["market_cap"] = profile_data.get("marketCap")
        result["beta"] = profile_data.get("beta")
        result["volume"] = profile_data.get("volume")
        result["avg_volume"] = profile_data.get("averageVolume")
        result["ipo_date"] = profile_data.get("ipoDate")
        result["website"] = profile_data.get("website")
        result["description"] = profile_data.get("description")
        result["asset_class"] = info_data.get("assetClass")
        result["etf_company"] = info_data.get("etfCompany")

        # Fetch ETF holdings and include top 5 by weightPercentage
        try:
            holdings_data = fetch_etf_holdings(ticker)
            if isinstance(holdings_data, list):
                sorted_holdings = sorted(holdings_data, key=lambda h: h.get("weightPercentage", 0), reverse=True)
                result["holdings_top"] = sorted_holdings[:5]
        except Exception:
            result["holdings_top"] = None

    except requests.exceptions.RequestException as err:
        result["error"] = str(err)

    return result

if __name__ == "__main__":
    data = {}
    if len(sys.argv) > 2:
        mode = sys.argv[1]
        ticker = sys.argv[2]
        if mode == "data":
            data = fetch_etf_data(ticker)
        elif mode == "holdings":
            data = fetch_etf_holdings(ticker)
        elif mode == "info":
            data = fetch_etf_info(ticker)
        elif mode == "runTicker":
            data = run_fmp_for_ticker(ticker)
        elif mode == "ratios":
            data = fetch_financial_ratios(ticker)
        elif mode == "dividend":
            data = fetch_dividend_profile(ticker)
        elif mode == "summary":
            data = fetch_etf_summary_data(ticker)
        elif mode == "ttm":
            data = fetch_ttm_key_metrics(ticker)
        else:
            data = {"error": f"Unknown mode '{mode}'"}
    else:
        data = {
            "error": "Invalid usage. Required: python3 fmp.py <MODE> <TICKER>",
            "modes": ["data", "holdings", "info", "runTicker", "ratios", "dividend", "summary", "ttm"]
        }

    print(json.dumps(data, indent=2))