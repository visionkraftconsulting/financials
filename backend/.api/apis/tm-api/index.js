"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var oas_1 = __importDefault(require("oas"));
var core_1 = __importDefault(require("api/dist/core"));
var openapi_json_1 = __importDefault(require("./openapi.json"));
var SDK = /** @class */ (function () {
    function SDK() {
        this.spec = oas_1.default.init(openapi_json_1.default);
        this.core = new core_1.default(this.spec, 'tm-api/unknown (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    SDK.prototype.config = function (config) {
        this.core.setConfig(config);
    };
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    SDK.prototype.auth = function () {
        var _a;
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        (_a = this.core).setAuth.apply(_a, values);
        return this;
    };
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    SDK.prototype.server = function (url, variables) {
        if (variables === void 0) { variables = {}; }
        this.core.setServer(url, variables);
    };
    /**
     * Get the short term grades, including the 24h percent change for the TM Trader Grade
     *
     * @summary Trader Grades
     * @throws FetchError<400, types.TraderGradesResponse400> 400
     */
    SDK.prototype.traderGrades = function (metadata) {
        return this.core.fetch('/v2/trader-grades', 'get', metadata);
    };
    /**
     * Get the long term grades, including Technology and Fundamental metrics
     *
     * @summary Investor Grades
     * @throws FetchError<400, types.InvestorGradesResponse400> 400
     */
    SDK.prototype.investorGrades = function (metadata) {
        return this.core.fetch('/v2/investor-grades', 'get', metadata);
    };
    /**
     * Get the AI generated trading signals for long and short positions for all tokens
     *
     * @summary Trading Signals
     * @throws FetchError<400, types.TradingSignalsResponse400> 400
     */
    SDK.prototype.tradingSignals = function (metadata) {
        return this.core.fetch('/v2/trading-signals', 'get', metadata);
    };
    /**
     * Get the latest AI weekly price prediction
     *
     * @summary Price Prediction
     * @throws FetchError<400, types.PricePredictionResponse400> 400
     */
    SDK.prototype.pricePrediction = function (metadata) {
        return this.core.fetch('/v2/price-prediction', 'get', metadata);
    };
    /**
     * Get the historical levels of resistance and support for each token
     *
     * @summary Resistance & Support
     * @throws FetchError<400, types.ResistanceSupportResponse400> 400
     */
    SDK.prototype.resistanceSupport = function (metadata) {
        return this.core.fetch('/v2/resistance-support', 'get', metadata);
    };
    /**
     * Get the latest quantitative metrics for tokens. Note that Token Metrics pricing data
     * starts on 2019-01-01 for most tokens. More historical data will be available soon.
     *
     * @summary Quantmetrics
     * @throws FetchError<400, types.QuantmetricsResponse400> 400
     */
    SDK.prototype.quantmetrics = function (metadata) {
        return this.core.fetch('/v2/quantmetrics', 'get', metadata);
    };
    /**
     * Get the hourly sentiment score for Twitter, Reddit, and all the News, including quick
     * summary of what happened
     *
     * @summary Sentiment
     * @throws FetchError<400, types.SentimentsResponse400> 400
     */
    SDK.prototype.sentiments = function (metadata) {
        return this.core.fetch('/v2/sentiments', 'get', metadata);
    };
    /**
     * Get the price prediction based on different Crypto Market scenario
     *
     * @summary Scenario Analysis
     * @throws FetchError<400, types.ScenarioAnalysisResponse400> 400
     */
    SDK.prototype.scenarioAnalysis = function (metadata) {
        return this.core.fetch('/v2/scenario-analysis', 'get', metadata);
    };
    /**
     * Get the Top 10 and Bottom 10 correlation of tokens with the top 100 market cap tokens
     *
     * @summary Correlation
     * @throws FetchError<400, types.CorrelationResponse400> 400
     */
    SDK.prototype.correlation = function (metadata) {
        return this.core.fetch('/v2/correlation', 'get', metadata);
    };
    /**
     * Get the list of coins and their associated TOKEN_ID supported by Token Metrics. If ID or
     * symbol alone isn’t enough to identify a token, use this reference to clarify → [Click
     * Here](https://api.tokenmetrics.com/api-docs/#/Tokens/get_v2_tokens)
     *
     * @summary Tokens
     * @throws FetchError<400, types.TokensResponse400> 400
     */
    SDK.prototype.tokens = function (metadata) {
        return this.core.fetch('/v2/tokens', 'get', metadata);
    };
    /**
     * Retrieve AI-generated reports providing comprehensive analyses of cryptocurrency tokens,
     * including deep dives, investment analyses, and code reviews.
     *
     * @summary AI Reports
     * @throws FetchError<400, types.AiReportsResponse400> 400
     */
    SDK.prototype.aiReports = function (metadata) {
        return this.core.fetch('/v2/ai-reports', 'get', metadata);
    };
    /**
     * Get the trends from more than 20 technical indicators
     *
     * @summary All Trend Indicators
     * @throws FetchError<400, types.AllTrendIndicatorsResponse400> 400
     */
    SDK.prototype.allTrendIndicators = function (metadata) {
        return this.core.fetch('/v2/all-trend-indicators', 'get', metadata);
    };
    /**
     * Get the latest list of crypto investors and their scores
     *
     * @summary Crypto Investors
     * @throws FetchError<400, types.CryptoInvestorsResponse400> 400
     */
    SDK.prototype.cryptoInvestors = function (metadata) {
        return this.core.fetch('/v2/crypto-investors', 'get', metadata);
    };
    /**
     * Token Metrics AI
     *
     * @throws FetchError<400, types.TmaiResponse400> 400
     */
    SDK.prototype.tmai = function (body, metadata) {
        return this.core.fetch('/v2/tmai', 'post', body, metadata);
    };
    /**
     * Get the AI generated portfolio for Traders, updated Daily
     *
     * @summary Trader Indices
     * @throws FetchError<400, types.TraderIndicesResponse400> 400
     */
    SDK.prototype.traderIndices = function (metadata) {
        return this.core.fetch('/v2/trader-indices', 'get', metadata);
    };
    /**
     * Get the AI generated portfolio for Investors, updated Quarterly
     *
     * @summary Investor Indices
     * @throws FetchError<400, types.InvestorIndicesResponse400> 400
     */
    SDK.prototype.investorIndices = function (metadata) {
        return this.core.fetch('/v2/investor-indices', 'get', metadata);
    };
    /**
     * Get the Market Analytics from Token Metrics. They provide insight into the full Crypto
     * Market, including the Bullish/Bearish Market indicator.
     *
     * @summary Market Metrics
     * @throws FetchError<400, types.MarketMetricsResponse400> 400
     */
    SDK.prototype.marketMetrics = function (metadata) {
        return this.core.fetch('/v2/market-metrics', 'get', metadata);
    };
    /**
     * Retrieve real-time price charts with bull and bear signals, overlaid with Token Metrics'
     * Trader Grade for each asset.
     *
     * @summary Token Details Price Charts
     * @throws FetchError<400, types.TokenDetailsPriceChartsResponse400> 400
     */
    SDK.prototype.tokenDetailsPriceCharts = function (metadata) {
        return this.core.fetch('/v2/token-details-price-charts', 'get', metadata);
    };
    /**
     * View a real-time, pie chart visualization of the AI-driven index's current crypto asset
     * allocations.
     *
     * @summary Indices Index Allocation Charts
     * @throws FetchError<400, types.IndicesIndexAllocationChartsResponse400> 400
     */
    SDK.prototype.indicesIndexAllocationCharts = function (metadata) {
        return this.core.fetch('/v2/indices-index-allocation-charts', 'get', metadata);
    };
    /**
     * Access historical and real-time returns of the Trader Index, highlighting performance
     * with backtested data (in red) and post-launch data (in yellow).
     *
     * @summary Trader Index ROI
     * @throws FetchError<400, types.IndicesRoiChartsResponse400> 400
     */
    SDK.prototype.indicesRoiCharts = function (metadata) {
        return this.core.fetch('/v2/indices-roi-charts', 'get', metadata);
    };
    /**
     * Analyze the market's sentiment with a chart displaying the percentage of
     * cryptocurrencies deemed bullish versus bearish by Token Metrics AI, reflecting overall
     * market conditions.
     *
     * @summary Market Percent of Bullish vs Bearish Charts
     * @throws FetchError<400, types.MarketPercentOfBullishVsBearishChartsResponse400> 400
     */
    SDK.prototype.marketPercentOfBullishVsBearishCharts = function (metadata) {
        return this.core.fetch('/v2/market-percent-of-bullish-vs-bearish-charts', 'get', metadata);
    };
    /**
     * Gauge the current market sentiment with a 0-100 scale chart, indicating the level of
     * bullishness or bearishness in the cryptocurrency market.
     *
     * @summary Market Bull and Bear Chart
     * @throws FetchError<400, types.MarketBullAndBearChartsResponse400> 400
     */
    SDK.prototype.marketBullAndBearCharts = function (metadata) {
        return this.core.fetch('/v2/market-bull-and-bear-charts', 'get', metadata);
    };
    /**
     * Track the percentage of bullish Token Metrics (TM) grades against the total
     * cryptocurrency market capitalization, visualized with a yellow line overlay on a black
     * line representing market cap.
     *
     * @summary Market Percent of Bullish TM Grades
     * @throws FetchError<400, types.MarketPercentOfBullishTmGradesResponse400> 400
     */
    SDK.prototype.marketPercentOfBullishTmGrades = function (metadata) {
        return this.core.fetch('/v2/market-percent-of-bullish-tm-grades', 'get', metadata);
    };
    /**
     * Discover current market trends with a chart indicating Bitcoin vs Altcoin season, where
     * green signifies Altcoin season and red denotes Bitcoin dominance
     *
     * @summary Market TM Grade Signal
     * @throws FetchError<400, types.MarketTmGradeSignalResponse400> 400
     */
    SDK.prototype.marketTmGradeSignal = function (metadata) {
        return this.core.fetch('/v2/market-tm-grade-signal', 'get', metadata);
    };
    /**
     * Discover current market trends with a chart indicating Bitcoin vs Altcoin season, where
     * green signifies Altcoin season and red denotes Bitcoin dominance.
     *
     * @summary Market Bitcoin vs Altcoin season
     * @throws FetchError<400, types.BitcoinVsAltcoinSeasonChartsResponse400> 400
     */
    SDK.prototype.bitcoinVsAltcoinSeasonCharts = function (metadata) {
        return this.core.fetch('/v2/bitcoin-vs-altcoin-season-charts', 'get', metadata);
    };
    /**
     * Examine the state of the cryptocurrency market's volatility with a chart that overlays
     * the total market cap, our volatility index, and the 90th and 10th percentile markers.
     *
     * @summary Market Annualized Historical Volatility
     * @throws FetchError<400, types.AnnualizedHistoricalVolatilityChartsResponse400> 400
     */
    SDK.prototype.annualizedHistoricalVolatilityCharts = function (metadata) {
        return this.core.fetch('/v2/annualized-historical-volatility-charts', 'get', metadata);
    };
    /**
     * Visualize the total cryptocurrency market capitalization alongside Bitcoin's market cap,
     * with color-coded periods indicating bearish (red) and bullish (green) seasons.
     *
     * @summary Market Total Crypto Market Cap
     * @throws FetchError<400, types.TotalMarketCryptoCapChartsResponse400> 400
     */
    SDK.prototype.totalMarketCryptoCapCharts = function (metadata) {
        return this.core.fetch('/v2/total-market-crypto-cap-charts', 'get', metadata);
    };
    /**
     * Identify standout cryptocurrencies with a chart displaying positive and negative price
     * percentage changes, plotted against volume deviation in bubble format.
     *
     * @summary Market Movers
     * @throws FetchError<400, types.MarketMoversChartsResponse400> 400
     */
    SDK.prototype.marketMoversCharts = function (metadata) {
        return this.core.fetch('/v2/market-movers-charts', 'get', metadata);
    };
    /**
     * Get the list of coins for top market cap
     *
     * @summary Top Tokens by Market Cap
     * @throws FetchError<400, types.TopMarketCapTokensResponse400> 400
     */
    SDK.prototype.topMarketCapTokens = function (metadata) {
        return this.core.fetch('/v2/top-market-cap-tokens', 'get', metadata);
    };
    /**
     * Get hourly OHLCV (Open, High, Low, Close, Volume) data for tokens.
     *
     * @summary Hourly OHLCV
     * @throws FetchError<400, types.HourlyOhlcvResponse400> 400
     */
    SDK.prototype.hourlyOhlcv = function (metadata) {
        return this.core.fetch('/v2/hourly-ohlcv', 'get', metadata);
    };
    /**
     * Visualize resistance and support levels in the cryptocurrency market. This endpoint
     * provides charts showing key resistance and support levels for various cryptocurrencies,
     * helping users identify potential market trends and reversal points. The charts include
     * historical data with color-coded zones to indicate where resistance (red) and support
     * (green) levels have been established.
     *
     * @summary Resistance & Support Charts
     * @throws FetchError<400, types.ResistanceAndSupportChartsResponse400> 400
     */
    SDK.prototype.resistanceAndSupportCharts = function (metadata) {
        return this.core.fetch('/v2/resistance-and-support-charts', 'get', metadata);
    };
    /**
     * Get token prices based on the provided token IDs.
     *
     * @summary Price
     * @throws FetchError<400, types.PriceResponse400> 400
     */
    SDK.prototype.price = function (metadata) {
        return this.core.fetch('/v2/price', 'get', metadata);
    };
    /**
     * Get daily OHLCV (Open, High, Low, Close, Volume) data for tokens.
     *
     * @summary Daily OHLCV
     * @throws FetchError<400, types.DailyOhlcvResponse400> 400
     */
    SDK.prototype.dailyOhlcv = function (metadata) {
        return this.core.fetch('/v2/daily-ohlcv', 'get', metadata);
    };
    /**
     * This endpoint returns the current holdings of the given Index, along with their
     * respective weight in %.
     *
     * @summary Index Holdings
     * @throws FetchError<400, types.IndexHoldingsResponse400> 400
     */
    SDK.prototype.indexHoldings = function (metadata) {
        return this.core.fetch('/v2/indices-tree-map', 'get', metadata);
    };
    /**
     * This endpoint returns the current holdings of the given Sector Index, along with their
     * respective weight in %.
     *
     * @summary Sector Indices Holdings
     * @throws FetchError<400, types.SectorIndicesHoldingsResponse400> 400
     */
    SDK.prototype.sectorIndicesHoldings = function (metadata) {
        return this.core.fetch('/v2/indices-index-specific-tree-map', 'get', metadata);
    };
    /**
     * The Indices Performance endpoint provides historical performance data for a given index,
     * including cumulative return on investment (ROI) over time. This data is useful for
     * analyzing index trends and evaluating investment performance.
     *
     * @summary Indices Performance
     * @throws FetchError<400, types.IndicesPerformanceResponse400> 400
     */
    SDK.prototype.indicesPerformance = function (metadata) {
        return this.core.fetch('/v2/indices-performance', 'get', metadata);
    };
    /**
     * The Sector Indices Performance endpoint provides historical performance data for a given
     * Sector Index, including cumulative return on investment (ROI) over time. This data is
     * useful for analyzing index trends and evaluating investment performance.
     *
     * @summary Sector Indices Performance
     * @throws FetchError<400, types.IndexSpecificPerformanceResponse400> 400
     */
    SDK.prototype.indexSpecificPerformance = function (metadata) {
        return this.core.fetch('/v2/indices-index-specific-performance', 'get', metadata);
    };
    /**
     * The Index Transaction endpoint provides detailed transaction data related to index
     * holdings, including buy/sell actions, transaction sizes in various units, and
     * timestamps. This allows traders and investors to track index rebalancing activities and
     * market movements.
     *
     * @summary Index Transaction
     * @throws FetchError<400, types.IndicesTransactionResponse400> 400
     */
    SDK.prototype.indicesTransaction = function (metadata) {
        return this.core.fetch('/v2/indices-index-transaction', 'get', metadata);
    };
    /**
     * The Sector Index Transaction endpoint provides detailed transaction data related to
     * index holdings, including buy/sell actions, transaction sizes in various units, and
     * timestamps. This allows traders and investors to track index rebalancing activities and
     * market movements.
     *
     * @summary Sector Index Transaction
     * @throws FetchError<400, types.SectorIndexTransactionResponse400> 400
     */
    SDK.prototype.sectorIndexTransaction = function (metadata) {
        return this.core.fetch('/v2/indices-index-specific-index-transaction', 'get', metadata);
    };
    return SDK;
}());
var createSDK = (function () { return new SDK(); })();
module.exports = createSDK;
