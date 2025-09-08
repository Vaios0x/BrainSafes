// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IRedStoneOracle
 * @dev Interface for RedStone Oracle - The most promising oracle for 2025
 * Features: 0.5ms latency, modular design, cross-chain, yield-bearing collateral
 * Perfect for: DeFi, lending, restaking protocols
 */
interface IRedStoneOracle {
    // ========== REDSTONE CORE FUNCTIONS ==========
    
    /**
     * @dev Get the latest value for a data feed
     * @param dataFeedId The identifier for the data feed (e.g., "ETH", "BTC", "SKILL_SOLIDITY_SALARY")
     * @return value The latest value with 8 decimals precision
     * @return timestamp The timestamp of the latest update
     */
    function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256 value, uint256 timestamp);
    
    /**
     * @dev Get multiple values at once - gas efficient
     * @param dataFeedIds Array of data feed identifiers
     * @return values Array of latest values
     * @return timestamps Array of update timestamps
     */
    function getValuesForDataFeeds(bytes32[] calldata dataFeedIds) external view returns (uint256[] memory values, uint256[] memory timestamps);
    
    /**
     * @dev Get value with metadata and confidence interval
     * @param dataFeedId The data feed identifier
     * @return value The latest value
     * @return timestamp Update timestamp
     * @return confidence Confidence level (0-100)
     * @return metadata Additional data feed information
     */
    function getValueWithMetadata(bytes32 dataFeedId) external view returns (
        uint256 value,
        uint256 timestamp,
        uint8 confidence,
        bytes memory metadata
    );

    // ========== EDUCATION & JOB MARKET DATA ==========
    
    /**
     * @dev Get job market data for a specific skill
     * @param skill The skill identifier (e.g., "SOLIDITY", "REACT", "AI_ML")
     * @return averageSalary Average salary in USD (8 decimals)
     * @return jobOpenings Number of job openings
     * @return demandScore Demand score (0-100)
     * @return timestamp Last update timestamp
     */
    function getSkillMarketData(string memory skill) external view returns (
        uint256 averageSalary,
        uint256 jobOpenings,
        uint256 demandScore,
        uint256 timestamp
    );
    
    /**
     * @dev Get certification credibility score
     * @param certification Certification identifier (e.g., "AWS_CERTIFIED", "GOOGLE_CLOUD")
     * @return credibilityScore Score from 0-100
     * @return recognitionLevel Industry recognition level (0-5)
     * @return timestamp Last update
     */
    function getCertificationData(string memory certification) external view returns (
        uint256 credibilityScore,
        uint8 recognitionLevel,
        uint256 timestamp
    );
    
    /**
     * @dev Get university/institution ranking and credibility
     * @param institution Institution identifier
     * @return ranking Global ranking position
     * @return credibilityScore Credibility (0-100)
     * @return graduateEmploymentRate Employment rate percentage
     */
    function getInstitutionData(string memory institution) external view returns (
        uint256 ranking,
        uint256 credibilityScore,
        uint256 graduateEmploymentRate
    );

    // ========== YIELD & DeFi DATA (RedStone Specialty) ==========
    
    /**
     * @dev Get yield data for liquid staking/restaking tokens
     * @param token Token address or identifier
     * @return apr Annual Percentage Rate (8 decimals)
     * @return apy Annual Percentage Yield (8 decimals)
     * @return tvl Total Value Locked
     * @return riskScore Risk assessment (0-100)
     */
    function getYieldData(address token) external view returns (
        uint256 apr,
        uint256 apy,
        uint256 tvl,
        uint8 riskScore
    );

    // ========== CUSTOM DATA REQUESTS ==========
    
    /**
     * @dev Request custom data feed creation
     * @param dataSource External API or data source
     * @param updateFrequency How often to update (in seconds)
     * @param aggregationMethod Method to aggregate data
     * @return requestId Unique identifier for the request
     */
    function requestCustomDataFeed(
        string memory dataSource,
        uint256 updateFrequency,
        bytes memory aggregationMethod
    ) external returns (bytes32 requestId);
    
    /**
     * @dev Subscribe to real-time data updates via push model
     * @param dataFeedId The data feed to subscribe to
     * @param callback Contract to receive updates
     * @param maxGasPrice Maximum gas price for updates
     */
    function subscribeToRealTimeUpdates(
        bytes32 dataFeedId,
        address callback,
        uint256 maxGasPrice
    ) external;

    // ========== CROSS-CHAIN FUNCTIONS ==========
    
    /**
     * @dev Get data from another chain via RedStone's cross-chain infrastructure
     * @param chainId Source chain identifier
     * @param dataFeedId Data feed on source chain
     * @return value Cross-chain data value
     * @return timestamp Update timestamp
     * @return chainConfidence Cross-chain validation confidence
     */
    function getCrossChainData(
        uint256 chainId,
        bytes32 dataFeedId
    ) external view returns (
        uint256 value,
        uint256 timestamp,
        uint8 chainConfidence
    );

    // ========== ATOM (Liquidation Intelligence) ==========
    
    /**
     * @dev Get liquidation risk assessment using Atom AI
     * @param position Position details (collateral, debt, etc.)
     * @return riskScore Liquidation risk (0-100)
     * @return liquidationPrice Price at which liquidation occurs
     * @return timeToLiquidation Estimated seconds until liquidation risk
     * @return recommendations AI recommendations to avoid liquidation
     */
    function getLiquidationIntelligence(bytes memory position) external view returns (
        uint256 riskScore,
        uint256 liquidationPrice,
        uint256 timeToLiquidation,
        string memory recommendations
    );

    // ========== CONFIGURATION & ADMIN ==========
    
    /**
     * @dev Get available data feeds
     * @return dataFeeds Array of available data feed identifiers
     * @return categories Categories for each feed
     * @return updateFrequencies Update frequency for each feed
     */
    function getAvailableDataFeeds() external view returns (
        bytes32[] memory dataFeeds,
        string[] memory categories,
        uint256[] memory updateFrequencies
    );
    
    /**
     * @dev Check if a data feed is active and healthy
     * @param dataFeedId Data feed identifier
     * @return isActive Whether the feed is currently active
     * @return lastUpdate Timestamp of last successful update
     * @return heartbeat Maximum expected time between updates
     */
    function getDataFeedStatus(bytes32 dataFeedId) external view returns (
        bool isActive,
        uint256 lastUpdate,
        uint256 heartbeat
    );

    // ========== EVENTS ==========
    
    event DataFeedUpdated(bytes32 indexed dataFeedId, uint256 value, uint256 timestamp);
    event CustomDataFeedRequested(bytes32 indexed requestId, string dataSource, address requester);
    event CrossChainDataReceived(uint256 indexed sourceChain, bytes32 indexed dataFeedId, uint256 value);
    event RealTimeSubscription(address indexed subscriber, bytes32 indexed dataFeedId);
    event LiquidationRiskAssessed(address indexed user, uint256 riskScore, uint256 liquidationPrice);
    
    // ========== ERRORS ==========
    
    error DataFeedNotFound(bytes32 dataFeedId);
    error StaleData(bytes32 dataFeedId, uint256 lastUpdate);
    error InsufficientConfidence(bytes32 dataFeedId, uint8 confidence);
    error CrossChainDataUnavailable(uint256 chainId, bytes32 dataFeedId);
    error CustomDataFeedCreationFailed(string reason);
}