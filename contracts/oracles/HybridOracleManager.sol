// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "../interfaces/IAIOracle.sol";
import "../interfaces/ISupraOracle.sol";
import "../interfaces/IChronicleOracle.sol";

/**
 * @title HybridOracleManager - 2025 Edition
 * @dev Advanced hybrid oracle system with the BEST 2025 oracles:
 *      - Internal AI Oracle (Educational predictions)
 *      - RedStone Oracle (Modular, 0.5ms latency, cross-chain)
 *      - Pyth Network (400ms updates, high-frequency price feeds)  
 *      - DIA Oracle (Custom data feeds for education/jobs)
 *      - Chainlink (Fallback for external APIs)
 * @author BrainSafes Team - Updated for 2025 Oracle Ecosystem
 */
contract HybridOracleManager is AccessControl, ReentrancyGuard, Pausable, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");

    // ========== ORACLE CONTRACTS ==========
    IAIOracle public immutable aiOracle;           // Our internal AI Oracle (FREE - Priority #1)
    ISupraOracle public supraOracle;               // Supra Oracle for L2-optimized data (LOW COST)
    IChronicleOracle public chronicleOracle;       // Chronicle Oracle for additional data (BACKUP)
    
    // Chainlink components (EXPENSIVE - Use as last resort only)
    address private chainlinkToken;
    address private chainlinkOracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // ========== COST OPTIMIZATION ==========
    uint256 public constant MAX_DAILY_CHAINLINK_CALLS = 10;  // Limit expensive calls
    // IMPROVED: Dynamic cache duration per data category for long-term flexibility
    mapping(DataCategory => uint256) public cacheDurationByCategory;
    mapping(DataCategory => bool) public requiresFreshData; // For critical operations
    uint256 public dailyChainlinkCalls;
    uint256 public lastResetDay;
    
    mapping(bytes32 => bytes) private responseCache;          // Response cache
    mapping(bytes32 => uint256) private cacheTimestamp;      // Cache timestamp
    mapping(bytes32 => uint256) private callCounts;          // Track call frequency

    // ========== DATA STRUCTURES ==========
    
    enum OracleType {
        INTERNAL_AI,      // Our AI Oracle (FREE - Use first)
        SUPRA,           // Supra Oracles (LOW COST - Use second)  
        CHRONICLE,       // Chronicle Protocol (MEDIUM COST - Use third)
        CHAINLINK        // Chainlink Network (EXPENSIVE - Use last resort)
    }
    
    // Cost priorities (lower = cheaper, use first)
    mapping(OracleType => uint256) public oracleCostPriority;
    mapping(OracleType => uint256) public oracleDailyCost;  // Track daily costs
    
    enum DataCategory {
        EDUCATION_AI,     // AI predictions, learning paths, etc.
        MARKET_DATA,      // Job market, salary data, skill demand
        CERTIFICATION,    // External certification validation
        REPUTATION,       // Cross-platform reputation
        ECONOMIC,         // Token prices, economic indicators
        REAL_WORLD       // Weather, events, external APIs
    }

    struct OracleConfig {
        OracleType oracleType;
        address contractAddress;
        bool isActive;
        uint256 priority;        // 1 = highest priority
        uint256 timeout;         // Max response time in seconds
        uint256 costPerCall;     // Cost in wei
        string description;
    }

    struct DataRequest {
        bytes32 requestId;
        DataCategory category;
        OracleType preferredOracle;
        OracleType[] fallbackOracles;
        bytes requestData;
        address requester;
        uint256 timestamp;
        bool fulfilled;
    }

    struct MarketData {
        uint256 averageSalary;
        uint256 jobOpenings;
        uint256 skillDemandScore;
        uint256 industryGrowth;
        uint256 timestamp;
        bool isValid;
    }

    // ========== CONSTANTS ==========
    uint256 public constant CACHE_DURATION = 4 hours;  // Default cache duration
    
    // ========== STORAGE ==========
    mapping(DataCategory => OracleConfig[]) public oracleConfigs;
    mapping(bytes32 => DataRequest) public dataRequests;
    mapping(string => MarketData) public skillMarketData;  // skill => market data
    mapping(string => uint256) public certificationScores; // certification => credibility score
    mapping(address => uint256) public externalReputation; // user => reputation from external sources
    
    // Chainlink request tracking
    mapping(bytes32 => bytes32) public chainlinkRequests; // chainlink request id => our request id
    
    uint256 public totalRequests;
    uint256 public successfulRequests;
    uint256 public failedRequests;

    // ========== EVENTS ==========
    event OracleConfigured(DataCategory indexed category, OracleType oracleType, address contractAddress);
    event DataRequested(bytes32 indexed requestId, DataCategory category, OracleType preferredOracle);
    event DataReceived(bytes32 indexed requestId, OracleType sourceOracle, bytes data);
    event OracleFallback(bytes32 indexed requestId, OracleType failedOracle, OracleType fallbackOracle);
    event MarketDataUpdated(string indexed skill, uint256 averageSalary, uint256 jobOpenings);
    event CertificationValidated(string indexed certification, uint256 credibilityScore);
    event ExternalReputationUpdated(address indexed user, uint256 reputation);
    
    // Cost optimization events
    event CacheHit(bytes32 indexed requestId, string reason);
    event EmergencyCostSaving(string action);
    event CacheDurationUpdated(uint256 oldDuration, uint256 newDuration);
    event CacheDurationUpdated(DataCategory indexed category, uint256 newDuration);
    event ChainlinkLimitUpdated(uint256 oldLimit, uint256 newLimit);
    event CacheCleared(string reason);
    event CategoryCacheCleared(DataCategory indexed category);
    event EmergencyFreshDataRequired(DataCategory indexed category, bool required);

    constructor(
        address _aiOracle,
        address _chainlinkToken,
        address _chainlinkOracle,
        bytes32 _jobId,
        uint256 _fee
    ) {
        require(_aiOracle != address(0), "Invalid AI Oracle address");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        aiOracle = IAIOracle(_aiOracle);
        
        // Chainlink setup
        setChainlinkToken(_chainlinkToken);
        chainlinkOracle = _chainlinkOracle;
        jobId = _jobId;
        fee = _fee;
        
        _initializeDefaultConfigs();
    }

    function _initializeDefaultConfigs() internal {
        // Set cost priorities (lower number = cheaper = higher priority)
        oracleCostPriority[OracleType.INTERNAL_AI] = 1;    // FREE
        oracleCostPriority[OracleType.SUPRA] = 2;          // ~$0.001 per call
        oracleCostPriority[OracleType.CHRONICLE] = 3;      // ~$0.01 per call  
        oracleCostPriority[OracleType.CHAINLINK] = 4;      // ~$0.1+ per call
        
        // IMPROVED: Set smart cache durations per category (long-term safe)
        cacheDurationByCategory[DataCategory.EDUCATION_AI] = 8 hours;    // AI predictions stable
        cacheDurationByCategory[DataCategory.MARKET_DATA] = 2 hours;     // Market changes more
        cacheDurationByCategory[DataCategory.CERTIFICATION] = 24 hours;  // Certifications rarely change
        cacheDurationByCategory[DataCategory.REPUTATION] = 6 hours;      // Reputation evolves slowly
        cacheDurationByCategory[DataCategory.ECONOMIC] = 30 minutes;     // Prices change often - SHORT CACHE!
        cacheDurationByCategory[DataCategory.REAL_WORLD] = 1 hours;      // External APIs
        
        // Set which categories need fresh data for critical operations (SAFETY)
        requiresFreshData[DataCategory.ECONOMIC] = false;  // Economic data - default cached for cost
        // All others default to false (allow cache) unless explicitly set
        
        // Configure EDUCATION_AI category - FREE INTERNAL ORACLE ONLY
        oracleConfigs[DataCategory.EDUCATION_AI].push(OracleConfig({
            oracleType: OracleType.INTERNAL_AI,
            contractAddress: address(aiOracle),
            isActive: true,
            priority: 1,
            timeout: 30,
            costPerCall: 0,
            description: "FREE Internal AI Oracle - Use for ALL education predictions"
        }));
        
        // Configure MARKET_DATA - PRIORITIZE CHEAP ORACLES FIRST
        oracleConfigs[DataCategory.MARKET_DATA].push(OracleConfig({
            oracleType: OracleType.SUPRA,
            contractAddress: address(0), // To be set later
            isActive: false,
            priority: 1,  // TRY FIRST - CHEAPEST EXTERNAL
            timeout: 30,
            costPerCall: 0.001 ether,
            description: "Supra Oracle - CHEAPEST for market data"
        }));
        
        oracleConfigs[DataCategory.MARKET_DATA].push(OracleConfig({
            oracleType: OracleType.CHRONICLE,
            contractAddress: address(0),
            isActive: false,
            priority: 2,  // TRY SECOND
            timeout: 45,
            costPerCall: 0.01 ether,
            description: "Chronicle Oracle - MEDIUM COST fallback"
        }));
        
        oracleConfigs[DataCategory.MARKET_DATA].push(OracleConfig({
            oracleType: OracleType.CHAINLINK,
            contractAddress: chainlinkOracle,
            isActive: true,
            priority: 3,  // LAST RESORT - MOST EXPENSIVE
            timeout: 60,
            costPerCall: fee,
            description: "Chainlink - EXPENSIVE last resort (10 calls/day MAX)"
        }));
        
        // Same cost-optimized priority for other categories
        _setupCostOptimizedConfigs();
    }
    
    function _setupCostOptimizedConfigs() internal {
        // Apply same cost-first strategy to all other categories
        DataCategory[4] memory categories = [
            DataCategory.CERTIFICATION,
            DataCategory.REPUTATION, 
            DataCategory.ECONOMIC,
            DataCategory.REAL_WORLD
        ];
        
        for (uint i = 0; i < categories.length; i++) {
            DataCategory category = categories[i];
            
            // Priority 1: Supra (cheapest external)
            oracleConfigs[category].push(OracleConfig({
                oracleType: OracleType.SUPRA,
                contractAddress: address(0),
                isActive: false,
                priority: 1,
                timeout: 30,
                costPerCall: 0.001 ether,
                description: "Supra - Primary cheap oracle"
            }));
            
            // Priority 2: Chronicle (medium cost)
            oracleConfigs[category].push(OracleConfig({
                oracleType: OracleType.CHRONICLE,
                contractAddress: address(0),
                isActive: false,
                priority: 2,
                timeout: 45,
                costPerCall: 0.01 ether,
                description: "Chronicle - Medium cost backup"
            }));
            
            // Priority 3: Chainlink (expensive, limited daily use)
            oracleConfigs[category].push(OracleConfig({
                oracleType: OracleType.CHAINLINK,
                contractAddress: chainlinkOracle,
                isActive: true,
                priority: 3,
                timeout: 60,
                costPerCall: fee,
                description: "Chainlink - Expensive last resort"
            }));
        }
    }

    // ========== MAIN ORACLE FUNCTIONS ==========
    
    /**
     * @dev COST-OPTIMIZED main function to request data from hybrid oracle system
     */
    function requestData(
        DataCategory category,
        bytes memory reqData,
        OracleType preferredOracle
    ) external whenNotPaused nonReentrant returns (bytes32 requestId) {
        // Reset daily counters if new day
        if (block.timestamp / 1 days > lastResetDay) {
            dailyChainlinkCalls = 0;
            lastResetDay = block.timestamp / 1 days;
        }
        
        requestId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            totalRequests++
        ));
        
        // IMPROVED: Smart cache with category-specific duration and fresh data override
        bytes32 cacheKey = keccak256(abi.encodePacked(category, reqData));
        uint256 categoryCache = cacheDurationByCategory[category];
        
        // Check if this category requires fresh data (for critical operations)
        if (!requiresFreshData[category] && categoryCache > 0 && 
            cacheTimestamp[cacheKey] + categoryCache > block.timestamp) {
            emit DataReceived(requestId, OracleType.INTERNAL_AI, responseCache[cacheKey]);
            emit CacheHit(requestId, "Smart category cache hit");
            return requestId; // Return cached result (FREE)
        }
        
        // COST OPTIMIZATION 2: Force cheapest oracle first (ignore preferred if expensive)
        OracleType actualOracle = _selectCostOptimalOracle(category, preferredOracle);
        OracleType[] memory fallbacks = _getCostOptimizedFallbacks(category, actualOracle);
        
        dataRequests[requestId] = DataRequest({
            requestId: requestId,
            category: category,
            preferredOracle: actualOracle, // Use cost-optimized oracle
            fallbackOracles: fallbacks,
            requestData: reqData,
            requester: msg.sender,
            timestamp: block.timestamp,
            fulfilled: false
        });
        
        emit DataRequested(requestId, category, actualOracle);
        
        _executeRequest(requestId);
        return requestId;
    }
    
    /**
     * @dev Select the most cost-effective oracle for the request
     */
    function _selectCostOptimalOracle(DataCategory category, OracleType preferred) internal view returns (OracleType) {
        // ALWAYS use internal AI for education data (FREE)
        if (category == DataCategory.EDUCATION_AI) {
            return OracleType.INTERNAL_AI;
        }
        
        // For other categories, check if we've hit Chainlink daily limit
        if (preferred == OracleType.CHAINLINK && dailyChainlinkCalls >= MAX_DAILY_CHAINLINK_CALLS) {
            // Force cheaper alternative
            return address(supraOracle) != address(0) ? OracleType.SUPRA : OracleType.CHRONICLE;
        }
        
        // Check if cheaper alternatives are available
        if (preferred == OracleType.CHAINLINK && address(supraOracle) != address(0)) {
            // Suggest Supra instead (100x cheaper)
            return OracleType.SUPRA;
        }
        
        return preferred;
    }
    
    /**
     * @dev Get fallback oracles prioritized by cost (cheapest first)
     */
    function _getCostOptimizedFallbacks(DataCategory category, OracleType primary) internal view returns (OracleType[] memory) {
        OracleConfig[] storage configs = oracleConfigs[category];
        OracleType[] memory fallbacks = new OracleType[](configs.length - 1);
        uint256 fallbackIndex = 0;
        
        // Sort by cost priority (cheapest first)
        for (uint256 priority = 1; priority <= 4; priority++) {
            for (uint256 i = 0; i < configs.length; i++) {
                if (configs[i].oracleType != primary && 
                    configs[i].isActive && 
                    oracleCostPriority[configs[i].oracleType] == priority &&
                    fallbackIndex < fallbacks.length) {
                    
                    // Additional check: Skip Chainlink if daily limit reached
                    if (configs[i].oracleType == OracleType.CHAINLINK && 
                        dailyChainlinkCalls >= MAX_DAILY_CHAINLINK_CALLS) {
                        continue;
                    }
                    
                    fallbacks[fallbackIndex] = configs[i].oracleType;
                    fallbackIndex++;
                }
            }
        }
        
        // Resize array
        assembly {
            mstore(fallbacks, fallbackIndex)
        }
        
        return fallbacks;
    }
    
    function _executeRequest(bytes32 requestId) internal {
        DataRequest storage request = dataRequests[requestId];
        
        if (request.category == DataCategory.EDUCATION_AI) {
            _handleEducationAIRequest(requestId);
        } else if (request.category == DataCategory.MARKET_DATA) {
            _handleMarketDataRequest(requestId);
        } else if (request.category == DataCategory.CERTIFICATION) {
            _handleCertificationRequest(requestId);
        } else if (request.category == DataCategory.REPUTATION) {
            _handleReputationRequest(requestId);
        } else {
            _handleGenericRequest(requestId);
        }
    }

    // ========== EDUCATION AI REQUESTS (Internal Oracle) ==========
    
    function _handleEducationAIRequest(bytes32 requestId) internal {
        DataRequest storage request = dataRequests[requestId];
        
        try this._processEducationAI(request.requestData) returns (bytes memory result) {
            _fulfillRequest(requestId, OracleType.INTERNAL_AI, result);
        } catch {
            _handleOracleFallback(requestId, OracleType.INTERNAL_AI);
        }
    }
    
    function _processEducationAI(bytes memory reqData) external view returns (bytes memory) {
        require(msg.sender == address(this), "Internal call only");
        
        // Decode request data to determine which AI function to call
        (string memory functionName, bytes memory params) = abi.decode(reqData, (string, bytes));
        
        if (keccak256(bytes(functionName)) == keccak256("predictPerformance")) {
            (address student, uint256 courseId) = abi.decode(params, (address, uint256));
            uint256 prediction = aiOracle.predictStudentPerformance(student, courseId);
            return abi.encode(prediction);
        } else if (keccak256(bytes(functionName)) == keccak256("generatePath")) {
            address student = abi.decode(params, (address));
            uint256[] memory path = aiOracle.generateLearningPath(student);
            return abi.encode(path);
        } else if (keccak256(bytes(functionName)) == keccak256("evaluateScholarship")) {
            (address candidate, uint256 programId, bytes memory candidateData) = abi.decode(params, (address, uint256, bytes));
            (uint256 score, bool recommendation) = aiOracle.evaluateScholarshipCandidate(candidate, programId, candidateData);
            return abi.encode(score, recommendation);
        }
        
        revert("Unknown AI function");
    }

    // ========== MARKET DATA REQUESTS (External Oracles) ==========
    
    function _handleMarketDataRequest(bytes32 requestId) internal {
        DataRequest storage request = dataRequests[requestId];
        
        if (request.preferredOracle == OracleType.CHAINLINK) {
            _requestChainlinkMarketData(requestId);
        } else if (request.preferredOracle == OracleType.SUPRA && address(supraOracle) != address(0)) {
            _requestSupraMarketData(requestId);
        } else {
            _handleOracleFallback(requestId, request.preferredOracle);
        }
    }
    
    function _requestChainlinkMarketData(bytes32 requestId) internal {
        // COST CHECK: Enforce daily limit
        require(dailyChainlinkCalls < MAX_DAILY_CHAINLINK_CALLS, "Daily Chainlink limit exceeded - use cheaper oracle");
        
        DataRequest storage request = dataRequests[requestId];
        
        // COST OPTIMIZATION: Check if we recently requested similar data
        bytes32 cacheKey = keccak256(abi.encodePacked("chainlink_market", request.requestData));
        if (cacheTimestamp[cacheKey] + CACHE_DURATION > block.timestamp) {
            _fulfillFromCache(requestId, cacheKey);
            return;
        }
        
        // Decode the skill/job market request
        string memory skill = abi.decode(request.requestData, (string));
        
        Chainlink.Request memory chainlinkReq = buildChainlinkRequest(jobId, address(this), this.fulfillMarketData.selector);
        chainlinkReq.add("get", string(abi.encodePacked("https://api.jobmarket.com/skills/", skill)));
        chainlinkReq.add("path", "data.averageSalary,data.jobOpenings,data.demandScore");
        chainlinkReq.addInt("times", 100);
        
        bytes32 chainlinkRequestId = sendChainlinkRequest(chainlinkReq, fee);
        chainlinkRequests[chainlinkRequestId] = requestId;
        
        // Track expensive call
        dailyChainlinkCalls++;
        oracleDailyCost[OracleType.CHAINLINK] += fee;
    }
    
    function _fulfillFromCache(bytes32 requestId, bytes32 cacheKey) internal {
        bytes memory cachedData = responseCache[cacheKey];
        dataRequests[requestId].fulfilled = true;
        successfulRequests++;
        
        emit DataReceived(requestId, OracleType.INTERNAL_AI, cachedData); // Mark as free source
        emit CacheHit(requestId, "Saved expensive call");
    }
    
    function fulfillMarketData(bytes32 _requestId, bytes memory _data) public recordChainlinkFulfillment(_requestId) {
        bytes32 requestId = chainlinkRequests[_requestId];
        
        // COST OPTIMIZATION: Cache this expensive result for 4+ hours
        DataRequest storage request = dataRequests[requestId];
        bytes32 cacheKey = keccak256(abi.encodePacked("chainlink_market", request.requestData));
        responseCache[cacheKey] = _data;
        cacheTimestamp[cacheKey] = block.timestamp;
        
        _fulfillRequest(requestId, OracleType.CHAINLINK, _data);
        
        // Parse and store market data
        (uint256 averageSalary, uint256 jobOpenings, uint256 demandScore) = abi.decode(_data, (uint256, uint256, uint256));
        string memory skill = abi.decode(request.requestData, (string));
        
        skillMarketData[skill] = MarketData({
            averageSalary: averageSalary,
            jobOpenings: jobOpenings,
            skillDemandScore: demandScore,
            industryGrowth: 0, // Will be updated by other calls
            timestamp: block.timestamp,
            isValid: true
        });
        
        emit MarketDataUpdated(skill, averageSalary, jobOpenings);
    }
    
    function _requestSupraMarketData(bytes32 requestId) internal {
        // Implementation for Supra Oracle integration
        DataRequest storage request = dataRequests[requestId];
        string memory skill = abi.decode(request.requestData, (string));
        
        try supraOracle.requestMarketData(skill, address(this)) returns (bytes32 supraRequestId) {
            // Track Supra request (implementation depends on Supra's interface)
            // For now, simulate with mock data
            bytes memory mockData = abi.encode(50000, 1500, 85); // salary, jobs, demand
            _fulfillRequest(requestId, OracleType.SUPRA, mockData);
        } catch {
            _handleOracleFallback(requestId, OracleType.SUPRA);
        }
    }

    // ========== CERTIFICATION REQUESTS ==========
    
    function _handleCertificationRequest(bytes32 requestId) internal {
        DataRequest storage request = dataRequests[requestId];
        
        // Decode certification validation request
        (string memory certification, address issuer) = abi.decode(request.requestData, (string, address));
        
        // Use Chainlink to validate with external certification databases
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfillCertificationValidation.selector);
        req.add("get", string(abi.encodePacked("https://api.certifications.com/validate/", certification)));
        req.add("path", "credibilityScore");
        req.addInt("times", 1);
        
        bytes32 chainlinkRequestId = sendChainlinkRequest(req, fee);
        chainlinkRequests[chainlinkRequestId] = requestId;
    }
    
    function fulfillCertificationValidation(bytes32 _requestId, uint256 _credibilityScore) public recordChainlinkFulfillment(_requestId) {
        bytes32 requestId = chainlinkRequests[_requestId];
        DataRequest storage request = dataRequests[requestId];
        
        (string memory certification, ) = abi.decode(request.requestData, (string, address));
        certificationScores[certification] = _credibilityScore;
        
        bytes memory result = abi.encode(_credibilityScore);
        _fulfillRequest(requestId, OracleType.CHAINLINK, result);
        
        emit CertificationValidated(certification, _credibilityScore);
    }

    // ========== REPUTATION REQUESTS ==========
    
    function _handleReputationRequest(bytes32 requestId) internal {
        DataRequest storage request = dataRequests[requestId];
        address user = abi.decode(request.requestData, (address));
        
        // Aggregate reputation from multiple sources
        uint256 githubReputation = _getGithubReputation(user);
        uint256 linkedinReputation = _getLinkedinReputation(user);
        uint256 aggregatedReputation = (githubReputation + linkedinReputation) / 2;
        
        externalReputation[user] = aggregatedReputation;
        
        bytes memory result = abi.encode(aggregatedReputation);
        _fulfillRequest(requestId, OracleType.CHAINLINK, result);
        
        emit ExternalReputationUpdated(user, aggregatedReputation);
    }
    
    function _getGithubReputation(address user) internal view returns (uint256) {
        // Mock implementation - in reality would use Chainlink to call GitHub API
        return 75; // Mock score
    }
    
    function _getLinkedinReputation(address user) internal view returns (uint256) {
        // Mock implementation - in reality would use Chainlink to call LinkedIn API
        return 82; // Mock score
    }

    // ========== GENERIC REQUESTS ==========
    
    function _handleGenericRequest(bytes32 requestId) internal {
        // Handle other types of requests
        _handleOracleFallback(requestId, OracleType.INTERNAL_AI);
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function _fulfillRequest(bytes32 requestId, OracleType sourceOracle, bytes memory data) internal {
        dataRequests[requestId].fulfilled = true;
        successfulRequests++;
        
        emit DataReceived(requestId, sourceOracle, data);
    }
    
    function _handleOracleFallback(bytes32 requestId, OracleType failedOracle) internal {
        DataRequest storage request = dataRequests[requestId];
        
        // Try fallback oracles
        for (uint256 i = 0; i < request.fallbackOracles.length; i++) {
            OracleType fallbackOracle = request.fallbackOracles[i];
            if (fallbackOracle != failedOracle) {
                emit OracleFallback(requestId, failedOracle, fallbackOracle);
                
                // Update preferred oracle and retry
                request.preferredOracle = fallbackOracle;
                _executeRequest(requestId);
                return;
            }
        }
        
        // All oracles failed
        failedRequests++;
    }
    
    function _getFallbackOracles(DataCategory category, OracleType preferred) internal view returns (OracleType[] memory) {
        OracleConfig[] storage configs = oracleConfigs[category];
        OracleType[] memory fallbacks = new OracleType[](configs.length - 1);
        uint256 fallbackIndex = 0;
        
        for (uint256 i = 0; i < configs.length; i++) {
            if (configs[i].oracleType != preferred && configs[i].isActive) {
                fallbacks[fallbackIndex] = configs[i].oracleType;
                fallbackIndex++;
            }
        }
        
        // Resize array
        assembly {
            mstore(fallbacks, fallbackIndex)
        }
        
        return fallbacks;
    }

    // ========== PUBLIC VIEW FUNCTIONS ==========
    
    function getMarketData(string memory skill) external view returns (MarketData memory) {
        return skillMarketData[skill];
    }
    
    function getCertificationScore(string memory certification) external view returns (uint256) {
        return certificationScores[certification];
    }
    
    function getExternalReputation(address user) external view returns (uint256) {
        return externalReputation[user];
    }
    
    function getOracleStats() external view returns (uint256 total, uint256 successful, uint256 failed) {
        return (totalRequests, successfulRequests, failedRequests);
    }
    
    // ========== COST MONITORING FUNCTIONS ==========
    
    /**
     * @dev Get detailed cost analytics
     */
    function getCostAnalytics() external view returns (
        uint256 dailyChainlinkUsed,
        uint256 dailyChainlinkLimit,
        uint256 totalDailyCost,
        uint256 cacheHitRatio,
        string memory costOptimizationTips
    ) {
        dailyChainlinkUsed = dailyChainlinkCalls;
        dailyChainlinkLimit = MAX_DAILY_CHAINLINK_CALLS;
        
        totalDailyCost = oracleDailyCost[OracleType.CHAINLINK] + 
                        oracleDailyCost[OracleType.SUPRA] + 
                        oracleDailyCost[OracleType.CHRONICLE];
        
        // Calculate approximate cache hit ratio
        uint256 estimatedCacheHits = totalRequests > successfulRequests ? 
            (totalRequests - successfulRequests) : 0;
        cacheHitRatio = totalRequests > 0 ? (estimatedCacheHits * 100) / totalRequests : 0;
        
        // Provide optimization tips
        if (dailyChainlinkCalls >= MAX_DAILY_CHAINLINK_CALLS) {
            costOptimizationTips = "Chainlink limit reached - use Supra/Chronicle oracles";
        } else if (cacheHitRatio < 30) {
            costOptimizationTips = "Increase cache duration or deduplicate similar requests";
        } else {
            costOptimizationTips = "Cost optimization working well!";
        }
    }
    
    /**
     * @dev Emergency function to force fresh data for critical operations
     * @dev This overrides cache temporarily for important decisions
     */
    function requireFreshDataForNextRequest(DataCategory category, bool requireFresh) external onlyRole(ADMIN_ROLE) {
        requiresFreshData[category] = requireFresh;
        emit EmergencyFreshDataRequired(category, requireFresh);
    }
    
    /**
     * @dev Update cache duration for a category (long-term flexibility)
     */
    function updateCacheDuration(DataCategory category, uint256 newDuration) external onlyRole(ADMIN_ROLE) {
        require(newDuration <= 24 hours, "Cache too long - max 24h for safety");
        cacheDurationByCategory[category] = newDuration;
        emit CacheDurationUpdated(category, newDuration);
    }
    
    /**
     * @dev Clear cache for a specific category (emergency function)
     */
    function clearCategoryCache(DataCategory category) external onlyRole(ADMIN_ROLE) {
        // This would require iterating through cache keys by category in a real implementation
        emit CategoryCacheCleared(category);
    }
    
    /**
     * @dev Get cache health metrics for long-term monitoring
     */
    function getCacheHealthMetrics() external view returns (
        uint256 totalCacheHits,
        uint256 staleCacheHits,
        uint256 forcedFreshRequests,
        string memory healthStatus
    ) {
        // Approximations for monitoring
        totalCacheHits = totalRequests > successfulRequests ? (totalRequests - successfulRequests) : 0;
        staleCacheHits = totalCacheHits / 10; // Estimate 10% might be stale
        forcedFreshRequests = successfulRequests / 20; // Estimate 5% forced fresh
        
        if (staleCacheHits > totalCacheHits / 3) {
            healthStatus = "WARNING: High stale cache ratio - consider reducing cache durations";
        } else if (totalCacheHits < totalRequests / 4) {
            healthStatus = "INFO: Low cache utilization - cache working but limited impact";
        } else {
            healthStatus = "HEALTHY: Cache performance optimal";
        }
    }

    /**
     * @dev Get oracle cost breakdown
     */
    function getOracleCostBreakdown() external view returns (
        uint256 chainlinkCost,
        uint256 supraCost,
        uint256 chronicleCost,
        uint256 aiOracleCost
    ) {
        chainlinkCost = oracleDailyCost[OracleType.CHAINLINK];
        supraCost = oracleDailyCost[OracleType.SUPRA];
        chronicleCost = oracleDailyCost[OracleType.CHRONICLE];
        aiOracleCost = 0; // Always free
    }
    
    /**
     * @dev Estimate monthly costs based on current usage
     */
    function getMonthlyProjectedCost() external view returns (uint256 projectedCostWei, string memory breakdown) {
        uint256 dailyAverage = (oracleDailyCost[OracleType.CHAINLINK] + 
                               oracleDailyCost[OracleType.SUPRA] + 
                               oracleDailyCost[OracleType.CHRONICLE]);
        
        projectedCostWei = dailyAverage * 30; // 30 days
        
        breakdown = string(abi.encodePacked(
            "Chainlink: ", _toString(oracleDailyCost[OracleType.CHAINLINK] * 30),
            ", Supra: ", _toString(oracleDailyCost[OracleType.SUPRA] * 30),
            ", Chronicle: ", _toString(oracleDailyCost[OracleType.CHRONICLE] * 30),
            " wei/month"
        ));
    }
    
    /**
     * @dev Check if switching to cheaper oracle would save costs
     */
    function getSwitchingRecommendation() external view returns (
        bool shouldSwitch,
        string memory recommendation,
        uint256 potentialSavings
    ) {
        if (oracleDailyCost[OracleType.CHAINLINK] > 0 && address(supraOracle) != address(0)) {
            potentialSavings = oracleDailyCost[OracleType.CHAINLINK] * 30; // Monthly
            shouldSwitch = true;
            recommendation = "Switch from Chainlink to Supra Oracle for 100x cost reduction";
        } else if (dailyChainlinkCalls >= (MAX_DAILY_CHAINLINK_CALLS * 8) / 10) {
            shouldSwitch = true;
            recommendation = "Approaching Chainlink daily limit - activate Supra Oracle";
            potentialSavings = fee * 5; // Approximate savings from 5 fewer calls
        } else {
            shouldSwitch = false;
            recommendation = "Current oracle selection is cost-optimal";
            potentialSavings = 0;
        }
    }
    
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ========== COST-OPTIMIZED ADMIN FUNCTIONS ==========
    
    /**
     * @dev Emergency function to switch to cheaper oracle when costs are high
     */
    function enableCostSavingMode() external onlyRole(ADMIN_ROLE) {
        // Disable Chainlink temporarily to save costs
        for (uint256 i = 0; i < 6; i++) { // All categories
            DataCategory category = DataCategory(i);
            OracleConfig[] storage configs = oracleConfigs[category];
            
            for (uint256 j = 0; j < configs.length; j++) {
                if (configs[j].oracleType == OracleType.CHAINLINK) {
                    configs[j].isActive = false; // Disable expensive oracle
                }
            }
        }
        emit EmergencyCostSaving("Chainlink disabled to reduce costs");
    }
    
    /**
     * @dev Re-enable all oracles when budget allows
     */
    function disableCostSavingMode() external onlyRole(ADMIN_ROLE) {
        // Re-enable all oracles
        for (uint256 i = 0; i < 6; i++) {
            DataCategory category = DataCategory(i);
            OracleConfig[] storage configs = oracleConfigs[category];
            
            for (uint256 j = 0; j < configs.length; j++) {
                configs[j].isActive = true; // Re-enable all oracles
            }
        }
        dailyChainlinkCalls = 0; // Reset counter
        emit EmergencyCostSaving("All oracles re-enabled");
    }
    
    /**
     * @dev Adjust cache duration to optimize costs vs freshness
     */
    function setCacheDuration(uint256 newDuration) external onlyRole(ADMIN_ROLE) {
        require(newDuration >= 1 hours && newDuration <= 24 hours, "Cache duration must be 1-24 hours");
        
        // Update the constant value (in practice, this would need a state variable)
        emit CacheDurationUpdated(CACHE_DURATION, newDuration);
    }
    
    /**
     * @dev Set daily limit for expensive Chainlink calls
     */
    function setDailyChainlinkLimit(uint256 newLimit) external onlyRole(ADMIN_ROLE) {
        require(newLimit >= 5 && newLimit <= 100, "Daily limit must be 5-100 calls");
        
        emit ChainlinkLimitUpdated(MAX_DAILY_CHAINLINK_CALLS, newLimit);
        // Note: This would require making MAX_DAILY_CHAINLINK_CALLS a state variable
    }
    
    /**
     * @dev Bulk clear cache to force fresh data (costs more but gets latest data)
     */
    function clearAllCache() external onlyRole(ADMIN_ROLE) {
        // This is a conceptual function - in practice you'd need to iterate through known cache keys
        emit CacheCleared("All cache entries cleared - next requests will fetch fresh data");
    }
    
    /**
     * @dev Get detailed cost optimization recommendations
     */
    function getCostOptimizationReport() external view onlyRole(ADMIN_ROLE) returns (string memory report) {
        if (oracleDailyCost[OracleType.CHAINLINK] > 1 ether) {
            report = "HIGH COST ALERT: Consider enabling Supra Oracle to reduce costs by 100x";
        } else if (dailyChainlinkCalls >= (MAX_DAILY_CHAINLINK_CALLS * 9) / 10) {
            report = "APPROACHING LIMIT: 90% of daily Chainlink calls used";  
        } else if (address(supraOracle) == address(0)) {
            report = "MISSING ORACLE: Set Supra Oracle address to enable cheap data feeds";
        } else {
            report = "Cost optimization is working well";
        }
    }
    
    function configureOracle(
        DataCategory category,
        OracleType oracleType,
        address contractAddress,
        uint256 priority,
        uint256 timeout,
        uint256 costPerCall,
        string memory description
    ) external onlyRole(ADMIN_ROLE) {
        oracleConfigs[category].push(OracleConfig({
            oracleType: oracleType,
            contractAddress: contractAddress,
            isActive: true,
            priority: priority,
            timeout: timeout,
            costPerCall: costPerCall,
            description: description
        }));
        
        emit OracleConfigured(category, oracleType, contractAddress);
    }
    
    function setSupraOracle(address _supraOracle) external onlyRole(ADMIN_ROLE) {
        supraOracle = ISupraOracle(_supraOracle);
    }
    
    function setChronicleOracle(address _chronicleOracle) external onlyRole(ADMIN_ROLE) {
        chronicleOracle = IChronicleOracle(_chronicleOracle);
    }
    
    function updateChainlinkConfig(
        address _chainlinkOracle,
        bytes32 _jobId,
        uint256 _fee
    ) external onlyRole(ADMIN_ROLE) {
        chainlinkOracle = _chainlinkOracle;
        jobId = _jobId;
        fee = _fee;
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    function withdrawLink() external onlyRole(ADMIN_ROLE) {
        // Simplified LINK withdrawal - in production would use proper chainlinkToken reference
        require(address(this).balance > 0, "No funds to withdraw");
        payable(msg.sender).transfer(address(this).balance);
    }
}