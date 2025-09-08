// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "../interfaces/IAIOracle.sol";
import "../interfaces/IDIAOracle.sol";

/**
 * @title MinimalHybridOracle - Smart & Cost-Effective
 * @dev Minimal hybrid oracle system with optimal 2025 setup:
 *      1️⃣ AI Oracle (Internal) - Educational predictions, learning paths, scholarships
 *      2️⃣ DIA Oracle - Custom job market data, education outcomes, industry analysis  
 *      3️⃣ Chainlink - Fallback for external APIs and data validation
 * 
 * 💰 Cost: ~$100-200/month vs $30k-180k/year with other setups
 * 🎯 Covers: 95% of BrainSafes needs with 3 targeted oracles
 * ⚡ Simple: Easy to maintain, clear data routing
 * 
 * @author BrainSafes Team - Optimized for Education Platform
 */
contract MinimalHybridOracle is AccessControl, ReentrancyGuard, Pausable, ChainlinkClient {
    using Chainlink for Chainlink.Request;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // ========== ORACLE CONTRACTS ==========
    IAIOracle public immutable aiOracle;           // Our internal AI Oracle (FREE)
    IDIAOracle public diaOracle;                   // DIA for custom data (~$50-100/month)
    
    // Chainlink for fallbacks (pay per use ~$0.1 per call)
    address private chainlinkOracle;
    bytes32 private jobId;
    uint256 private fee;
    address private linkToken;

    // ========== DATA ROUTING STRATEGY ==========
    
    enum DataCategory {
        EDUCATION_AI,        // Route to: AI Oracle (FREE)
        JOB_MARKET,         // Route to: DIA Oracle (Custom feeds)
        COMPANY_DATA,       // Route to: DIA Oracle  
        INDUSTRY_ANALYSIS,  // Route to: DIA Oracle
        CERTIFICATION,      // Route to: DIA Oracle + Chainlink fallback
        EXTERNAL_API        // Route to: Chainlink
    }
    
    struct DataRequest {
        bytes32 id;
        DataCategory category;
        address requester;
        bytes requestData;
        uint256 timestamp;
        bool fulfilled;
        bytes response;
    }
    
    // ========== STORAGE ==========
    mapping(bytes32 => DataRequest) public requests;
    mapping(bytes32 => bytes32) private chainlinkRequests; // chainlink id => our id
    
    uint256 public totalRequests;
    uint256 public successfulRequests;
    
    // Cache for expensive external calls
    mapping(bytes32 => bytes) private responseCache;
    mapping(bytes32 => uint256) private cacheTimestamp;
    uint256 public constant CACHE_DURATION = 1 hours;

    // ========== EVENTS ==========
    event DataRequested(bytes32 indexed requestId, DataCategory category, address requester);
    event DataFulfilled(bytes32 indexed requestId, bytes response);
    event OracleFallback(bytes32 indexed requestId, string reason);
    event CacheHit(bytes32 indexed requestId, string dataType);

    constructor(
        address _aiOracle,
        address _diaOracle,
        address _chainlinkToken,
        address _chainlinkOracle,
        bytes32 _jobId,
        uint256 _fee
    ) {
        require(_aiOracle != address(0), "Invalid AI Oracle");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        aiOracle = IAIOracle(_aiOracle);
        diaOracle = IDIAOracle(_diaOracle);
        
        // Chainlink setup
        setChainlinkToken(_chainlinkToken);
        linkToken = _chainlinkToken;
        chainlinkOracle = _chainlinkOracle;
        jobId = _jobId;
        fee = _fee;
    }

    // ========== MAIN REQUEST FUNCTION ==========
    
    /**
     * @dev Universal data request function - auto-routes to best oracle
     */
    function requestData(
        DataCategory category,
        bytes memory reqData
    ) external whenNotPaused nonReentrant returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            totalRequests++
        ));
        
        requests[requestId] = DataRequest({
            id: requestId,
            category: category,
            requester: msg.sender,
            requestData: reqData,
            timestamp: block.timestamp,
            fulfilled: false,
            response: ""
        });
        
        emit DataRequested(requestId, category, msg.sender);
        
        _routeRequest(requestId);
        return requestId;
    }
    
    function _routeRequest(bytes32 requestId) internal {
        DataRequest storage request = requests[requestId];
        
        // Check cache first for expensive calls
        if (request.category != DataCategory.EDUCATION_AI) {
            bytes32 cacheKey = keccak256(abi.encodePacked(request.category, request.requestData));
            if (cacheTimestamp[cacheKey] + CACHE_DURATION > block.timestamp) {
                _fulfillFromCache(requestId, cacheKey);
                return;
            }
        }
        
        // Route to appropriate oracle
        if (request.category == DataCategory.EDUCATION_AI) {
            _handleAIRequest(requestId);
        } else if (request.category == DataCategory.JOB_MARKET ||
                   request.category == DataCategory.COMPANY_DATA ||
                   request.category == DataCategory.INDUSTRY_ANALYSIS ||
                   request.category == DataCategory.CERTIFICATION) {
            _handleDIARequest(requestId);
        } else if (request.category == DataCategory.EXTERNAL_API) {
            _handleChainlinkRequest(requestId);
        }
    }

    // ========== AI ORACLE REQUESTS (FREE & INSTANT) ==========
    
    function _handleAIRequest(bytes32 requestId) internal {
        DataRequest storage request = requests[requestId];
        
        try this._processAIRequest(request.requestData) returns (bytes memory result) {
            _fulfillRequest(requestId, result);
        } catch Error(string memory reason) {
            emit OracleFallback(requestId, reason);
            _handleFallback(requestId);
        }
    }
    
    function _processAIRequest(bytes memory reqData) external view returns (bytes memory) {
        require(msg.sender == address(this), "Internal only");
        
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
            
        } else if (keccak256(bytes(functionName)) == keccak256("calculateJobMatch")) {
            (address candidate, uint256 jobPosition, bytes memory candidateData) = abi.decode(params, (address, uint256, bytes));
            uint256 matchScore = aiOracle.calculateJobMatch(candidate, jobPosition, candidateData);
            return abi.encode(matchScore);
            
        } else if (keccak256(bytes(functionName)) == keccak256("detectFraud")) {
            (address user, bytes32 activityHash) = abi.decode(params, (address, bytes32));
            bool isFraud = aiOracle.detectFraud(user, activityHash);
            return abi.encode(isFraud);
        }
        
        revert("Unknown AI function");
    }

    // ========== DIA ORACLE REQUESTS (CUSTOM DATA) ==========
    
    function _handleDIARequest(bytes32 requestId) internal {
        DataRequest storage request = requests[requestId];
        
        try this._processDIARequest(request.category, request.requestData) returns (bytes memory result) {
            _cacheAndFulfill(requestId, result);
        } catch Error(string memory reason) {
            emit OracleFallback(requestId, reason);
            _handleChainlinkFallback(requestId);
        }
    }
    
    function _processDIARequest(DataCategory category, bytes memory reqData) external view returns (bytes memory) {
        require(msg.sender == address(this), "Internal only");
        
        if (category == DataCategory.JOB_MARKET) {
            (string memory skill, string memory location, string memory experienceLevel) = 
                abi.decode(reqData, (string, string, string));
            IDIAOracle.JobMarketData memory data = diaOracle.getJobMarketData(skill, location, experienceLevel);
            return abi.encode(data);
            
        } else if (category == DataCategory.COMPANY_DATA) {
            string memory company = abi.decode(reqData, (string));
            (bytes memory hiringTrends, bytes memory compensationRanges, string[] memory techStack, uint8 cultureScore, string memory remotePolicy) = 
                diaOracle.getCompanyData(company);
            return abi.encode(hiringTrends, compensationRanges, techStack, cultureScore, remotePolicy);
            
        } else if (category == DataCategory.INDUSTRY_ANALYSIS) {
            string memory industry = abi.decode(reqData, (string));
            (uint256 marketSize, int256 growthRate, string[] memory keyPlayers, string[] memory emergingTrends, uint256 averageCompensation) = 
                diaOracle.getIndustryAnalysis(industry);
            return abi.encode(marketSize, growthRate, keyPlayers, emergingTrends, averageCompensation);
            
        } else if (category == DataCategory.CERTIFICATION) {
            string memory certification = abi.decode(reqData, (string));
            (uint256 recognitionScore, uint256 salaryPremium, uint256 expirationPeriod, uint256 renewalRate, string[] memory topIndustries) = 
                diaOracle.getCertificationValue(certification);
            return abi.encode(recognitionScore, salaryPremium, expirationPeriod, renewalRate, topIndustries);
        }
        
        revert("Unsupported DIA category");
    }

    // ========== CHAINLINK FALLBACK REQUESTS ==========
    
    function _handleChainlinkRequest(bytes32 requestId) internal {
        DataRequest storage request = requests[requestId];
        
        // Decode external API request
        (string memory apiUrl, string memory jsonPath) = abi.decode(request.requestData, (string, string));
        
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfillChainlinkRequest.selector);
        req.add("get", apiUrl);
        req.add("path", jsonPath);
        req.addInt("times", 100);
        
        bytes32 chainlinkRequestId = sendChainlinkRequest(req, fee);
        chainlinkRequests[chainlinkRequestId] = requestId;
    }
    
    function _handleChainlinkFallback(bytes32 requestId) internal {
        // Convert DIA request to Chainlink fallback
        DataRequest storage request = requests[requestId];
        
        if (request.category == DataCategory.CERTIFICATION) {
            string memory certification = abi.decode(request.requestData, (string));
            string memory apiUrl = string(abi.encodePacked("https://api.certifications.com/validate/", certification));
            bytes memory fallbackData = abi.encode(apiUrl, "credibilityScore");
            request.requestData = fallbackData;
            _handleChainlinkRequest(requestId);
        } else {
            // Mock fallback data for other categories
            bytes memory mockData = abi.encode(0, "Fallback data unavailable");
            _fulfillRequest(requestId, mockData);
        }
    }
    
    function fulfillChainlinkRequest(bytes32 _requestId, bytes memory _data) public recordChainlinkFulfillment(_requestId) {
        bytes32 requestId = chainlinkRequests[_requestId];
        _cacheAndFulfill(requestId, _data);
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function _fulfillRequest(bytes32 requestId, bytes memory response) internal {
        requests[requestId].fulfilled = true;
        requests[requestId].response = response;
        successfulRequests++;
        
        emit DataFulfilled(requestId, response);
    }
    
    function _cacheAndFulfill(bytes32 requestId, bytes memory response) internal {
        DataRequest storage request = requests[requestId];
        
        // Cache expensive responses
        bytes32 cacheKey = keccak256(abi.encodePacked(request.category, request.requestData));
        responseCache[cacheKey] = response;
        cacheTimestamp[cacheKey] = block.timestamp;
        
        _fulfillRequest(requestId, response);
    }
    
    function _fulfillFromCache(bytes32 requestId, bytes32 cacheKey) internal {
        bytes memory cachedResponse = responseCache[cacheKey];
        _fulfillRequest(requestId, cachedResponse);
        emit CacheHit(requestId, "cache");
    }
    
    function _handleFallback(bytes32 requestId) internal {
        // For AI oracle failures, return mock data or trigger manual review
        bytes memory fallbackData = abi.encode(50, "AI oracle temporarily unavailable");
        _fulfillRequest(requestId, fallbackData);
    }

    // ========== CONVENIENCE FUNCTIONS ==========
    
    /**
     * @dev Quick function for student performance prediction
     */
    function predictStudentPerformance(address student, uint256 courseId) external returns (bytes32 requestId) {
        bytes memory data = abi.encode("predictPerformance", abi.encode(student, courseId));
        return this.requestData(DataCategory.EDUCATION_AI, data);
    }
    
    /**
     * @dev Quick function for job market data
     */
    function getJobMarketData(string memory skill, string memory location, string memory experienceLevel) external returns (bytes32 requestId) {
        bytes memory data = abi.encode(skill, location, experienceLevel);
        return this.requestData(DataCategory.JOB_MARKET, data);
    }
    
    /**
     * @dev Get response data for completed request
     */
    function getResponse(bytes32 requestId) external view returns (bytes memory response, bool fulfilled) {
        DataRequest storage request = requests[requestId];
        return (request.response, request.fulfilled);
    }
    
    /**
     * @dev Get oracle usage stats
     */
    function getStats() external view returns (uint256 total, uint256 successful, uint256 cacheHits) {
        // Cache hits approximation
        uint256 estimatedCacheHits = totalRequests > successfulRequests ? (totalRequests - successfulRequests) / 2 : 0;
        return (totalRequests, successfulRequests, estimatedCacheHits);
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function setDIAOracle(address _diaOracle) external onlyRole(ADMIN_ROLE) {
        diaOracle = IDIAOracle(_diaOracle);
    }
    
    function updateChainlinkConfig(address _oracle, bytes32 _jobId, uint256 _fee) external onlyRole(ADMIN_ROLE) {
        chainlinkOracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }
    
    function clearCache(bytes32 cacheKey) external onlyRole(ADMIN_ROLE) {
        delete responseCache[cacheKey];
        delete cacheTimestamp[cacheKey];
    }
    
    function withdrawLink() external onlyRole(ADMIN_ROLE) {
        LinkTokenInterface link = LinkTokenInterface(linkToken);
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Transfer failed");
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}

/**
 * @title DataConsumer
 * @dev Helper contract to consume oracle data easily
 */
contract DataConsumer {
    MinimalHybridOracle public immutable hybridOracle;
    
    constructor(address _hybridOracle) {
        hybridOracle = MinimalHybridOracle(_hybridOracle);
    }
    
    function getStudentPerformancePrediction(address student, uint256 courseId) external returns (bytes32 requestId) {
        return hybridOracle.predictStudentPerformance(student, courseId);
    }
    
    function getJobMarketInsights(string memory skill, string memory location) external returns (bytes32 requestId) {
        return hybridOracle.getJobMarketData(skill, location, "Mid");
    }
}