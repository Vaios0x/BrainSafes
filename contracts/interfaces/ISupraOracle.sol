// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ISupraOracle
 * @dev Enhanced interface for Supra Oracle integration - optimized for Layer 2
 */
interface ISupraOracle {
    // ========== ORIGINAL SUPRA FUNCTIONS ==========
    
    function getData(bytes32 key) external view returns (uint256);
    function getRoundData(bytes32 key, uint256 roundId) external view returns (uint256, uint256, uint256);
    function getLatestRoundData(bytes32 key) external view returns (uint256, uint256, uint256);
    function getHistoricalData(bytes32 key, uint256 timestamp) external view returns (uint256);
    function getSupportedPairs() external pure returns (bytes32[] memory);
    function verifyOracleSignature(bytes32 key, bytes memory signature) external pure returns (bool);

    // ========== ENHANCED FUNCTIONS FOR BRAINSAFES ==========
    
    function getPrice(string memory priceFeed) external view returns (uint256 price, uint256 timestamp);
    
    function getPrices(string[] memory priceFeeds) external view returns (uint256[] memory prices, uint256[] memory timestamps);

    // ========== VRF (Verifiable Random Function) ==========
    
    function requestRandomWords(
        uint32 numWords,
        address callbackContract,
        bytes4 callbackSelector
    ) external returns (uint256 requestId);
    
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;

    // ========== CUSTOM DATA FEEDS FOR EDUCATION/JOBS ==========
    
    function requestMarketData(string memory skill, address callback) external returns (bytes32 requestId);
    
    function requestCertificationData(string memory certification, address callback) external returns (bytes32 requestId);
    
    function requestReputationData(address user, address callback) external returns (bytes32 requestId);

    // ========== HIGH FREQUENCY DATA ==========
    
    function subscribeToDataFeed(string memory feedId, address subscriber) external;
    
    function unsubscribeFromDataFeed(string memory feedId, address subscriber) external;
    
    function getDataFeedValue(string memory feedId) external view returns (bytes memory data, uint256 timestamp);

    // ========== CONFIGURATION ==========
    
    function getSupportedFeeds() external view returns (string[] memory feeds);
    
    function getFeedInfo(string memory feedId) external view returns (
        string memory description,
        uint256 updateFrequency,
        uint256 lastUpdate,
        bool isActive
    );

    // ========== EVENTS ==========
    
    event DataRequested(bytes32 indexed requestId, string indexed dataType, address indexed requester);
    event DataFulfilled(bytes32 indexed requestId, bytes data, uint256 timestamp);
    event RandomWordsRequested(uint256 indexed requestId, address indexed requester, uint32 numWords);
    event RandomWordsFulfilled(uint256 indexed requestId, uint256[] randomWords);
    event FeedSubscribed(string indexed feedId, address indexed subscriber);
    event FeedUnsubscribed(string indexed feedId, address indexed subscriber);
} 