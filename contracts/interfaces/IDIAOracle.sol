// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IDIAOracle  
 * @dev Interface for DIA Oracle - Custom data feeds and transparent aggregation
 * Features: Custom oracle builder, 3000+ tokens, transparent methodology, education/job data
 * Perfect for: Custom data needs, educational metrics, job market analysis
 */
interface IDIAOracle {
    // ========== DATA STRUCTURES ==========
    
    struct AssetPrice {
        uint256 price;        // Price with 8 decimals
        uint256 supply;       // Circulating supply
        uint256 timestamp;    // Last update timestamp
        string methodology;   // Price calculation methodology
    }
    
    struct CustomFeed {
        bytes32 feedId;          // Unique identifier
        string name;             // Human readable name
        string[] dataSources;    // Array of data sources
        string aggregation;      // Aggregation method
        uint256 updateFreq;      // Update frequency in seconds
        bool isActive;           // Whether feed is active
        address owner;           // Feed owner/requester
    }
    
    struct JobMarketData {
        uint256 averageSalary;      // Average salary in USD (8 decimals)
        uint256 jobOpenings;        // Number of job openings
        uint256 demandScore;        // Demand score (0-1000)
        uint256 salaryGrowth;       // YoY salary growth rate (8 decimals)
        uint256 skillDifficulty;    // Skill difficulty index (0-100)
        uint256 remotePercentage;   // Remote work percentage
        uint256 timestamp;          // Last update timestamp
        string[] topLocations;      // Top hiring locations
    }

    // ========== CORE PRICE FUNCTIONS ==========
    
    /**
     * @dev Get the latest price for an asset from DIA's aggregated data
     * @param symbol Asset symbol (e.g., "BTC", "ETH", "ARB")
     * @return price Asset price structure with metadata
     */
    function getAssetPrice(string memory symbol) external view returns (AssetPrice memory price);
    
    /**
     * @dev Get price from specific exchange for transparency
     * @param symbol Asset symbol
     * @param exchange Exchange identifier (e.g., "Binance", "Uniswap-V3")
     * @return price Price from specific source
     * @return volume 24h volume on that exchange
     */
    function getExchangePrice(string memory symbol, string memory exchange) external view returns (
        uint256 price,
        uint256 volume
    );
    
    /**
     * @dev Get aggregated price with full source breakdown
     * @param symbol Asset symbol
     * @return aggregatedPrice Final aggregated price
     * @return sources Array of source exchanges
     * @return prices Individual prices from each source
     * @return weights Weight of each source in aggregation
     */
    function getAggregatedPrice(string memory symbol) external view returns (
        uint256 aggregatedPrice,
        string[] memory sources,
        uint256[] memory prices,
        uint256[] memory weights
    );

    // ========== CUSTOM ORACLE BUILDER ==========
    
    /**
     * @dev Request creation of a custom data feed via DIA's Oracle Builder
     * @param name Human readable name for the feed
     * @param dataSources Array of data source URLs/APIs
     * @param aggregationMethod How to aggregate the data ("median", "mean", "weighted")
     * @param updateFrequency Update frequency in seconds
     * @param customParams Additional parameters for data processing
     * @return feedId Unique identifier for the custom feed
     */
    function requestCustomFeed(
        string memory name,
        string[] memory dataSources,
        string memory aggregationMethod,
        uint256 updateFrequency,
        bytes memory customParams
    ) external returns (bytes32 feedId);
    
    /**
     * @dev Get data from a custom feed
     * @param feedId Custom feed identifier
     * @return data Raw data bytes from the feed
     * @return timestamp Last update timestamp
     * @return confidence Confidence score (0-100)
     */
    function getCustomFeedData(bytes32 feedId) external view returns (
        bytes memory data,
        uint256 timestamp,
        uint8 confidence
    );
    
    /**
     * @dev Update a custom feed configuration (only feed owner)
     * @param feedId Feed to update
     * @param newSources New data sources
     * @param newAggregation New aggregation method
     * @param newFrequency New update frequency
     */
    function updateCustomFeed(
        bytes32 feedId,
        string[] memory newSources,
        string memory newAggregation,
        uint256 newFrequency
    ) external;

    // ========== EDUCATION & CAREER DATA ==========
    
    /**
     * @dev Get comprehensive job market data for a skill
     * @param skill Skill identifier (e.g., "Solidity", "React", "Data-Science")
     * @param location Location filter ("Global", "US", "Europe", "Remote")
     * @param experienceLevel Experience level ("Entry", "Mid", "Senior", "Lead")
     * @return marketData Comprehensive job market information
     */
    function getJobMarketData(
        string memory skill,
        string memory location,
        string memory experienceLevel
    ) external view returns (JobMarketData memory marketData);
    
    /**
     * @dev Get university/bootcamp outcome data
     * @param institution Institution identifier
     * @param program Program/course identifier
     * @return graduateCount Number of graduates tracked
     * @return employmentRate Employment rate within 6 months (%)
     * @return averageSalary Average starting salary
     * @return topEmployers List of top hiring companies
     * @return skillsLearned Key skills taught in program
     */
    function getEducationOutcomes(
        string memory institution,
        string memory program
    ) external view returns (
        uint256 graduateCount,
        uint256 employmentRate,
        uint256 averageSalary,
        string[] memory topEmployers,
        string[] memory skillsLearned
    );
    
    /**
     * @dev Get certification value and recognition data
     * @param certification Certification identifier
     * @return recognitionScore Industry recognition (0-100)
     * @return salaryPremium Salary premium percentage vs non-certified
     * @return expirationPeriod Certification validity period (months)
     * @return renewalRate Percentage of people who renew
     * @return topIndustries Industries that value this cert most
     */
    function getCertificationValue(string memory certification) external view returns (
        uint256 recognitionScore,
        uint256 salaryPremium,
        uint256 expirationPeriod,
        uint256 renewalRate,
        string[] memory topIndustries
    );
    
    /**
     * @dev Get skill demand trending data
     * @param skill Skill identifier
     * @param timeframe Time period ("1M", "3M", "6M", "1Y")
     * @return trendDirection Trend direction (1=up, 0=stable, -1=down)
     * @return changePercentage Percentage change in demand
     * @return projectedGrowth 12-month projected growth
     * @return relatedSkills Skills that complement this one
     */
    function getSkillTrend(string memory skill, string memory timeframe) external view returns (
        int8 trendDirection,
        int256 changePercentage,
        int256 projectedGrowth,
        string[] memory relatedSkills
    );

    // ========== COMPANY & INDUSTRY DATA ==========
    
    /**
     * @dev Get company hiring patterns and compensation data
     * @param company Company identifier
     * @return hiringTrends Hiring velocity and trends
     * @return compensationRanges Salary ranges by role level
     * @return techStack Primary technologies used
     * @return cultureScore Company culture score (0-100)
     * @return remotePolicy Remote work policy
     */
    function getCompanyData(string memory company) external view returns (
        bytes memory hiringTrends,
        bytes memory compensationRanges,
        string[] memory techStack,
        uint8 cultureScore,
        string memory remotePolicy
    );
    
    /**
     * @dev Get industry analysis and forecasts
     * @param industry Industry identifier (e.g., "DeFi", "AI", "GameDev")
     * @return marketSize Current market size in USD
     * @return growthRate YoY growth rate
     * @return keyPlayers Top companies in industry
     * @return emergingTrends Key technology/skill trends
     * @return averageCompensation Industry average compensation
     */
    function getIndustryAnalysis(string memory industry) external view returns (
        uint256 marketSize,
        int256 growthRate,
        string[] memory keyPlayers,
        string[] memory emergingTrends,
        uint256 averageCompensation
    );

    // ========== DeFi & YIELD DATA ==========
    
    /**
     * @dev Get DeFi protocol metrics and safety scores
     * @param protocol Protocol address or identifier
     * @return tvl Total Value Locked
     * @return apr Current APR/APY
     * @return safetyScore Security assessment (0-100)
     * @return auditCount Number of security audits
     * @return riskFactors Known risk factors
     */
    function getDeFiMetrics(address protocol) external view returns (
        uint256 tvl,
        uint256 apr,
        uint8 safetyScore,
        uint8 auditCount,
        string[] memory riskFactors
    );

    // ========== DATA QUALITY & TRANSPARENCY ==========
    
    /**
     * @dev Get methodology and source breakdown for any data point
     * @param dataIdentifier Data point identifier
     * @return methodology Calculation methodology used
     * @return sources List of data sources
     * @return lastUpdate Last successful update
     * @return confidence Data confidence level
     * @return sampleSize Sample size used for calculation
     */
    function getDataMethodology(bytes32 dataIdentifier) external view returns (
        string memory methodology,
        string[] memory sources,
        uint256 lastUpdate,
        uint8 confidence,
        uint256 sampleSize
    );
    
    /**
     * @dev Get feed status and health metrics
     * @param feedId Feed identifier
     * @return isActive Whether feed is currently active
     * @return updateCount Total number of updates
     * @return avgUpdateTime Average time between updates
     * @return errorRate Error rate in last 100 updates (%)
     * @return nextUpdate Expected next update timestamp
     */
    function getFeedHealth(bytes32 feedId) external view returns (
        bool isActive,
        uint256 updateCount,
        uint256 avgUpdateTime,
        uint8 errorRate,
        uint256 nextUpdate
    );

    // ========== DISCOVERY & SEARCH ==========
    
    /**
     * @dev Search available feeds by category and keywords
     * @param category Feed category ("price", "education", "jobs", "defi")
     * @param keywords Search keywords
     * @param limit Maximum results to return
     * @return feedIds Matching feed identifiers
     * @return names Human readable names
     * @return descriptions Feed descriptions
     */
    function searchFeeds(
        string memory category,
        string[] memory keywords,
        uint256 limit
    ) external view returns (
        bytes32[] memory feedIds,
        string[] memory names,
        string[] memory descriptions
    );
    
    /**
     * @dev Get all available asset symbols with metadata
     * @return symbols All tracked asset symbols
     * @return categories Asset categories
     * @return sourceCount Number of sources per asset
     */
    function getAvailableAssets() external view returns (
        string[] memory symbols,
        string[] memory categories,
        uint256[] memory sourceCount
    );

    // ========== EVENTS ==========
    
    event AssetPriceUpdated(string indexed symbol, uint256 price, uint256 timestamp);
    event CustomFeedCreated(bytes32 indexed feedId, string name, address indexed owner);
    event CustomFeedUpdated(bytes32 indexed feedId, address indexed owner);
    event JobMarketDataUpdated(string indexed skill, string indexed location);
    event EducationOutcomesUpdated(string indexed institution, string indexed program);
    event CompanyDataUpdated(string indexed company);
    event IndustryAnalysisUpdated(string indexed industry);
    
    // ========== ERRORS ==========
    
    error AssetNotFound(string symbol);
    error CustomFeedNotFound(bytes32 feedId);
    error UnauthorizedFeedUpdate(bytes32 feedId, address caller);
    error InvalidDataSource(string source);
    error InvalidAggregationMethod(string method);
    error InsufficientDataPoints(bytes32 feedId);
    error StaleData(bytes32 feedId, uint256 lastUpdate);
}