// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IPythOracle
 * @dev Interface for Pyth Network - Ultra-high frequency oracle (400ms updates)
 * Features: Pull-based model, confidence intervals, 750+ feeds, millisecond latency
 * Perfect for: High-frequency trading, perpetuals, derivatives, real-time DeFi
 */
interface IPythOracle {
    // ========== DATA STRUCTURES ==========
    
    struct Price {
        int64 price;          // Price with exponent applied
        uint64 conf;          // Confidence interval
        int32 expo;           // Exponent (10^expo)
        uint publishTime;     // Timestamp of price update
    }
    
    struct PriceFeed {
        bytes32 id;           // Unique price feed identifier
        Price price;          // Current price information
        Price emaPrice;       // Exponentially-weighted moving average price
    }

    // ========== CORE PRICE FUNCTIONS ==========
    
    /**
     * @dev Get the latest price for a price feed (with confidence)
     * @param id Price feed identifier (e.g., Crypto.ETH/USD, Equity.AAPL/USD)
     * @return price Latest price data with confidence interval
     */
    function getPrice(bytes32 id) external view returns (Price memory price);
    
    /**
     * @dev Get price with no older than maxAge seconds
     * @param id Price feed identifier
     * @param maxAge Maximum age of price data in seconds
     * @return price Latest valid price data
     */
    function getPriceNoOlderThan(bytes32 id, uint maxAge) external view returns (Price memory price);
    
    /**
     * @dev Get the exponentially-weighted moving average price
     * @param id Price feed identifier
     * @return emaPrice EMA price with confidence interval
     */
    function getEmaPrice(bytes32 id) external view returns (Price memory emaPrice);
    
    /**
     * @dev Get both current and EMA price efficiently
     * @param id Price feed identifier
     * @return price Current price
     * @return emaPrice EMA price
     */
    function getPriceAndEma(bytes32 id) external view returns (Price memory price, Price memory emaPrice);

    // ========== BATCH OPERATIONS ==========
    
    /**
     * @dev Get multiple prices at once - gas efficient for portfolios
     * @param ids Array of price feed identifiers
     * @return prices Array of current prices
     */
    function getPrices(bytes32[] calldata ids) external view returns (Price[] memory prices);
    
    /**
     * @dev Get multiple price feeds with full data
     * @param ids Array of price feed identifiers
     * @return priceFeeds Array of complete price feed data
     */
    function getPriceFeeds(bytes32[] calldata ids) external view returns (PriceFeed[] memory priceFeeds);

    // ========== PULL-BASED UPDATES ==========
    
    /**
     * @dev Update price feeds by providing signed price data (pull model)
     * @param updateData Array of signed price update data from Pyth API
     */
    function updatePriceFeeds(bytes[] calldata updateData) external payable;
    
    /**
     * @dev Get fee required to update price feeds
     * @param updateData Array of price update data
     * @return fee Required fee in wei
     */
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint fee);
    
    /**
     * @dev Update price feeds if they're older than maxAge
     * @param updateData Signed price update data
     * @param ids Price feed identifiers to update
     * @param maxAge Maximum age before update is required
     */
    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata ids,
        uint64[] calldata maxAge
    ) external payable;

    // ========== PYTH LAZER (2025) - ULTRA LOW LATENCY ==========
    
    /**
     * @dev Subscribe to Pyth Lazer for millisecond-level updates
     * @param feedId Price feed to subscribe to
     * @param callback Contract to receive ultra-fast updates
     * @param maxLatency Maximum acceptable latency in milliseconds
     */
    function subscribeToPythLazer(
        bytes32 feedId,
        address callback,
        uint16 maxLatency
    ) external;
    
    /**
     * @dev Get the latest Pyth Lazer update (sub-millisecond data)
     * @param feedId Price feed identifier
     * @return price Ultra-fast price update
     * @return latency Actual latency in microseconds
     */
    function getLazerPrice(bytes32 feedId) external view returns (Price memory price, uint32 latency);

    // ========== ADVANCED FEEDS (2025 EXPANSION) ==========
    
    /**
     * @dev Get Real World Asset (RWA) price data
     * @param rwaId RWA identifier (e.g., US Treasury rates, commodities)
     * @return price RWA price/rate
     * @return metadata Additional RWA information
     */
    function getRWAPrice(bytes32 rwaId) external view returns (Price memory price, bytes memory metadata);
    
    /**
     * @dev Get international equity/index data
     * @param equityId Equity identifier (e.g., FTSE 100, Hang Seng, Nikkei)
     * @return price Equity price
     * @return marketStatus Current market status (open/closed/pre-market)
     */
    function getEquityPrice(bytes32 equityId) external view returns (Price memory price, uint8 marketStatus);
    
    /**
     * @dev Get forex rates with high precision
     * @param forexPair FX pair identifier (e.g., EUR/USD, GBP/JPY)
     * @return price Exchange rate
     * @return bid Bid price
     * @return ask Ask price
     */
    function getForexPrice(bytes32 forexPair) external view returns (
        Price memory price,
        Price memory bid,
        Price memory ask
    );

    // ========== EDUCATION/JOB MARKET INTEGRATION ==========
    
    /**
     * @dev Get skill demand pricing from job market APIs (via Pyth custom feeds)
     * @param skillId Skill identifier
     * @return demandIndex Demand index (0-1000)
     * @return averageSalary Average salary globally
     * @return growthRate YoY growth rate
     */
    function getSkillDemandData(bytes32 skillId) external view returns (
        uint256 demandIndex,
        uint256 averageSalary,
        int256 growthRate
    );

    // ========== CONFIDENCE & VALIDATION ==========
    
    /**
     * @dev Check if price data meets confidence requirements
     * @param id Price feed identifier
     * @param minConfidence Minimum required confidence level
     * @param maxAge Maximum acceptable age in seconds
     * @return isValid Whether price meets requirements
     * @return actualConfidence Actual confidence level
     */
    function validatePriceConfidence(
        bytes32 id,
        uint64 minConfidence,
        uint maxAge
    ) external view returns (bool isValid, uint64 actualConfidence);
    
    /**
     * @dev Get price feed health status
     * @param id Price feed identifier
     * @return isActive Whether feed is currently active
     * @return lastUpdate Timestamp of last update
     * @return updateFrequency Expected update frequency
     * @return healthScore Overall health score (0-100)
     */
    function getPriceFeedHealth(bytes32 id) external view returns (
        bool isActive,
        uint256 lastUpdate,
        uint256 updateFrequency,
        uint8 healthScore
    );

    // ========== DISCOVERY & METADATA ==========
    
    /**
     * @dev Get all available price feeds by category
     * @param category Feed category (0=Crypto, 1=Equity, 2=FX, 3=Metal, 4=RWA)
     * @return feedIds Array of feed identifiers
     * @return symbols Array of human-readable symbols
     */
    function getFeedsByCategory(uint8 category) external view returns (
        bytes32[] memory feedIds,
        string[] memory symbols
    );
    
    /**
     * @dev Get detailed metadata for a price feed
     * @param id Price feed identifier
     * @return symbol Human-readable symbol
     * @return description Feed description
     * @return assetType Asset type category
     * @return quoteCurrency Quote currency
     * @return baseCurrency Base currency
     */
    function getPriceFeedMetadata(bytes32 id) external view returns (
        string memory symbol,
        string memory description,
        string memory assetType,
        string memory quoteCurrency,
        string memory baseCurrency
    );

    // ========== HISTORICAL DATA ==========
    
    /**
     * @dev Get price at a specific historical timestamp
     * @param id Price feed identifier
     * @param timestamp Historical timestamp
     * @param tolerance Acceptable time tolerance (seconds)
     * @return price Historical price data
     */
    function getHistoricalPrice(
        bytes32 id,
        uint256 timestamp,
        uint256 tolerance
    ) external view returns (Price memory price);

    // ========== EVENTS ==========
    
    event PriceFeedUpdate(bytes32 indexed id, int64 price, uint64 conf, uint publishTime);
    event BatchUpdate(bytes32[] ids, uint256 totalFeePaid);
    event LazerSubscription(bytes32 indexed feedId, address indexed subscriber, uint16 maxLatency);
    event ConfidenceThresholdBreached(bytes32 indexed id, uint64 actualConf, uint64 minConf);
    
    // ========== ERRORS ==========
    
    error PriceFeedNotFound(bytes32 id);
    error StalePrice(bytes32 id, uint publishTime, uint maxAge);
    error InsufficientConfidence(bytes32 id, uint64 actualConf, uint64 requiredConf);
    error InsufficientFee(uint requiredFee, uint providedFee);
    error InvalidUpdateData(bytes updateData);
    error LazerSubscriptionFailed(bytes32 feedId, string reason);
}

/**
 * @title IPythLazerCallback
 * @dev Callback interface for ultra-low latency Pyth Lazer updates
 */
interface IPythLazerCallback {
    /**
     * @dev Called when a Pyth Lazer update is received (sub-millisecond)
     * @param feedId Price feed that was updated
     * @param price New price data
     * @param latency Actual update latency in microseconds
     */
    function onLazerUpdate(bytes32 feedId, IPythOracle.Price memory price, uint32 latency) external;
}