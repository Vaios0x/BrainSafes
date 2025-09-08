// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract UserExperience is AccessControl, ReentrancyGuard, Pausable {
    // ========== CONSTANTS ==========
    bytes32 public constant UX_ANALYST_ROLE = keccak256("UX_ANALYST_ROLE");
    bytes32 public constant FEEDBACK_MODERATOR_ROLE = keccak256("FEEDBACK_MODERATOR_ROLE");
    bytes32 public constant OPTIMIZATION_ENGINEER_ROLE = keccak256("OPTIMIZATION_ENGINEER_ROLE");
    
    uint256 public constant MAX_FEEDBACK_LENGTH = 1000;
    uint256 public constant MAX_TIPS_COUNT = 50;
    uint256 public constant FEEDBACK_COOLDOWN = 3600; // 1 hour
    uint256 public constant GAS_ESTIMATION_PRECISION = 1000;

    // ========== STATE VARIABLES ==========
    struct Feedback {
        address user;
        string message;
        uint256 timestamp;
        uint256 rating;
        string category;
        bool isResolved;
        string moderatorResponse;
    }

    struct GasEstimate {
        uint256 estimatedGas;
        uint256 estimatedCost;
        uint256 confidence;
        string optimizationTip;
    }

    struct UXMetrics {
        uint256 totalUsers;
        uint256 totalFeedback;
        uint256 averageRating;
        uint256 totalGasSaved;
        uint256 optimizationCount;
    }

    struct OptimizationTip {
        string title;
        string description;
        string category;
        uint256 priority;
        bool isActive;
    }

    // ========== STATE VARIABLES ==========
    Feedback[] public feedbacks;
    mapping(address => uint256) public userFeedbackCount;
    mapping(address => uint256) public lastFeedbackTime;
    mapping(address => uint256) public userRating;
    mapping(string => uint256) public categoryFeedbackCount;
    mapping(bytes32 => bool) public processedOptimizations;
    
    OptimizationTip[] public optimizationTips;
    mapping(address => uint256) public userGasSaved;
    mapping(address => uint256) public userOptimizationCount;
    
    uint256 public totalFeedback;
    uint256 public totalGasSaved;
    uint256 public totalOptimizations;
    uint256 public averageUserRating;
    uint256 public lastMetricsUpdate;

    // ========== EVENTS ==========
    event FeedbackSubmitted(
        address indexed user,
        string message,
        uint256 rating,
        string category,
        uint256 timestamp
    );
    
    event FeedbackResolved(
        uint256 indexed feedbackId,
        address indexed moderator,
        string response,
        uint256 timestamp
    );
    
    event GasOptimization(
        address indexed user,
        uint256 gasSaved,
        string optimizationTip,
        uint256 timestamp
    );
    
    event OptimizationTipAdded(
        string title,
        string category,
        uint256 priority,
        uint256 timestamp
    );
    
    event UXMetricsUpdated(
        uint256 totalUsers,
        uint256 totalFeedback,
        uint256 averageRating,
        uint256 totalGasSaved
    );
    
    event EmergencyPaused(address indexed admin);
    event EmergencyUnpaused(address indexed admin);

    // ========== CONSTRUCTOR ==========
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UX_ANALYST_ROLE, msg.sender);
        _grantRole(FEEDBACK_MODERATOR_ROLE, msg.sender);
        _grantRole(OPTIMIZATION_ENGINEER_ROLE, msg.sender);
        
        _initializeDefaultTips();
    }

    // ========== CORE UX FUNCTIONS ==========
    
    function submitFeedback(
        string calldata message,
        uint256 rating,
        string calldata category
    ) external whenNotPaused {
        require(bytes(message).length > 0, "Empty feedback");
        require(bytes(message).length <= MAX_FEEDBACK_LENGTH, "Feedback too long");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        require(block.timestamp >= lastFeedbackTime[msg.sender] + FEEDBACK_COOLDOWN, "Cooldown period");
        
        feedbacks.push(Feedback({
            user: msg.sender,
            message: message,
            timestamp: block.timestamp,
            rating: rating,
            category: category,
            isResolved: false,
            moderatorResponse: ""
        }));
        
        totalFeedback++;
        userFeedbackCount[msg.sender]++;
        lastFeedbackTime[msg.sender] = block.timestamp;
        categoryFeedbackCount[category]++;
        
        // Update user rating
        _updateUserRating(msg.sender, rating);
        
        emit FeedbackSubmitted(msg.sender, message, rating, category, block.timestamp);
        _updateUXMetrics();
    }

    
    function feedbackCount() external view returns (uint256 count) {
        return feedbacks.length;
    }

    
    function getFeedback(
        uint256 index
    ) external view returns (
        address user,
        string memory message,
        uint256 timestamp,
        uint256 rating,
        string memory category,
        bool isResolved
    ) {
        require(index < feedbacks.length, "Invalid index");
        Feedback storage fb = feedbacks[index];
        return (fb.user, fb.message, fb.timestamp, fb.rating, fb.category, fb.isResolved);
    }

    // ========== GAS ESTIMATION FUNCTIONS ==========
    
    function estimateTransactionCosts(
        address target,
        bytes calldata data,
        uint256 value
    ) external view returns (GasEstimate memory estimate) {
        require(target != address(0), "Invalid target");
        
        // Base gas estimation
        uint256 baseGas = 21000;
        uint256 dataGas = data.length * 16;
        uint256 valueGas = value > 0 ? 9000 : 0;
        
        estimate.estimatedGas = baseGas + dataGas + valueGas;
        
        // Add safety margin (20%)
        estimate.estimatedGas = estimate.estimatedGas + (estimate.estimatedGas * 20 / 100);
        
        // Estimate cost (assuming 20 gwei gas price)
        uint256 gasPrice = 20000000000; // 20 gwei
        estimate.estimatedCost = estimate.estimatedGas * gasPrice;
        
        // Confidence level based on data size
        if (data.length < 100) {
            estimate.confidence = 95;
        } else if (data.length < 500) {
            estimate.confidence = 85;
        } else {
            estimate.confidence = 75;
        }
        
        // Generate optimization tip
        estimate.optimizationTip = _generateOptimizationTip(estimate.estimatedGas, data.length);
    }

    
    function estimateBatchGas(
        address[] calldata targets,
        bytes[] calldata dataArray,
        uint256[] calldata values
    ) external view returns (GasEstimate[] memory estimates) {
        require(targets.length == dataArray.length, "Array length mismatch");
        require(targets.length == values.length, "Array length mismatch");
        require(targets.length <= 10, "Too many transactions");
        
        estimates = new GasEstimate[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            estimates[i] = this.estimateTransactionCosts(targets[i], dataArray[i], values[i]);
        }
    }

    // ========== OPTIMIZATION FUNCTIONS ==========
    
    function getOptimizationTips() external view returns (OptimizationTip[] memory tips) {
        uint256 activeCount = 0;
        
        // Count active tips
        for (uint256 i = 0; i < optimizationTips.length; i++) {
            if (optimizationTips[i].isActive) {
                activeCount++;
            }
        }
        
        tips = new OptimizationTip[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < optimizationTips.length; i++) {
            if (optimizationTips[i].isActive) {
                tips[index] = optimizationTips[i];
                index++;
            }
        }
    }

    
    function addOptimizationTip(
        string calldata title,
        string calldata description,
        string calldata category,
        uint256 priority
    ) external onlyRole(OPTIMIZATION_ENGINEER_ROLE) {
        require(bytes(title).length > 0, "Empty title");
        require(bytes(description).length > 0, "Empty description");
        require(priority >= 1 && priority <= 5, "Invalid priority");
        require(optimizationTips.length < MAX_TIPS_COUNT, "Too many tips");
        
        optimizationTips.push(OptimizationTip({
            title: title,
            description: description,
            category: category,
            priority: priority,
            isActive: true
        }));
        
        emit OptimizationTipAdded(title, category, priority, block.timestamp);
    }

    
    function recordGasOptimization(
        address user,
        uint256 gasSaved,
        string calldata tip
    ) external onlyRole(OPTIMIZATION_ENGINEER_ROLE) {
        require(user != address(0), "Invalid user");
        require(gasSaved > 0, "No gas saved");
        
        userGasSaved[user] += gasSaved;
        userOptimizationCount[user]++;
        totalGasSaved += gasSaved;
        totalOptimizations++;
        
        emit GasOptimization(user, gasSaved, tip, block.timestamp);
        _updateUXMetrics();
    }

    // ========== FEEDBACK MODERATION FUNCTIONS ==========
    
    function resolveFeedback(
        uint256 feedbackId,
        string calldata response
    ) external onlyRole(FEEDBACK_MODERATOR_ROLE) {
        require(feedbackId < feedbacks.length, "Invalid feedback ID");
        require(!feedbacks[feedbackId].isResolved, "Already resolved");
        
        feedbacks[feedbackId].isResolved = true;
        feedbacks[feedbackId].moderatorResponse = response;
        
        emit FeedbackResolved(feedbackId, msg.sender, response, block.timestamp);
    }

    
    function getFeedbackStats() external view returns (
        uint256 totalFeedbackResult,
        uint256 resolvedFeedback,
        uint256 averageRating,
        string memory topCategory
    ) {
        totalFeedbackResult = feedbacks.length;
        uint256 totalRating = 0;
        uint256 resolvedCount = 0;
        
        for (uint256 i = 0; i < feedbacks.length; i++) {
            totalRating += feedbacks[i].rating;
            if (feedbacks[i].isResolved) {
                resolvedCount++;
            }
        }
        
        resolvedFeedback = resolvedCount;
        averageRating = totalFeedback > 0 ? totalRating / totalFeedback : 0;
        
        // Find top category (simplified)
        topCategory = "General";
        
        return (totalFeedbackResult, resolvedFeedback, averageRating, topCategory);
    }

    // ========== ANALYTICS FUNCTIONS ==========
    
    function getUXMetrics() external view returns (UXMetrics memory metrics) {
        metrics.totalUsers = _getUniqueUsers();
        metrics.totalFeedback = totalFeedback;
        metrics.averageRating = averageUserRating;
        metrics.totalGasSaved = totalGasSaved;
        metrics.optimizationCount = totalOptimizations;
        
        return metrics;
    }

    
    function getUserAnalytics(
        address user
    ) external view returns (
        uint256 feedbackCountResult,
        uint256 rating,
        uint256 gasSaved,
        uint256 optimizationCount
    ) {
        return (
            userFeedbackCount[user],
            userRating[user],
            userGasSaved[user],
            userOptimizationCount[user]
        );
    }

    
    function getCategoryAnalytics(
        string calldata category
    ) external view returns (uint256 feedbackCountResult, uint256 averageRating) {
        feedbackCountResult = categoryFeedbackCount[category];
        
        uint256 totalRating = 0;
        uint256 count = 0;
        
        for (uint256 i = 0; i < feedbacks.length; i++) {
            if (keccak256(bytes(feedbacks[i].category)) == keccak256(bytes(category))) {
                totalRating += feedbacks[i].rating;
                count++;
            }
        }
        
        averageRating = count > 0 ? totalRating / count : 0;
        
        return (feedbackCountResult, averageRating);
    }

    // ========== UTILITY FUNCTIONS ==========
    
    function canSubmitFeedback(address user) external view returns (bool canSubmit) {
        return block.timestamp >= lastFeedbackTime[user] + FEEDBACK_COOLDOWN;
    }

    
    function getNextFeedbackTime(address user) external view returns (uint256 nextTime) {
        return lastFeedbackTime[user] + FEEDBACK_COOLDOWN;
    }

    
    function calculateGasSavings(
        uint256 originalGas,
        uint256 optimizedGas
    ) external pure returns (uint256 savingsPercentage) {
        require(originalGas > optimizedGas, "No savings");
        require(originalGas > 0, "Invalid original gas");
        
        return ((originalGas - optimizedGas) * 100) / originalGas;
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
        emit EmergencyPaused(msg.sender);
    }

    
    function emergencyUnpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
        emit EmergencyUnpaused(msg.sender);
    }

    
    function grantUXAnalystRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(UX_ANALYST_ROLE, account);
    }

    
    function grantFeedbackModeratorRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(FEEDBACK_MODERATOR_ROLE, account);
    }

    
    function grantOptimizationEngineerRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(OPTIMIZATION_ENGINEER_ROLE, account);
    }

    // ========== INTERNAL FUNCTIONS ==========
    
    function _initializeDefaultTips() internal {
        optimizationTips.push(OptimizationTip({
            title: "Use Multicall",
            description: "Group multiple operations into a single transaction to save gas",
            category: "Gas Optimization",
            priority: 5,
            isActive: true
        }));
        
        optimizationTips.push(OptimizationTip({
            title: "Batch Operations",
            description: "Prefer batch operations over individual calls",
            category: "Gas Optimization",
            priority: 4,
            isActive: true
        }));
        
        optimizationTips.push(OptimizationTip({
            title: "Check Gas Estimator",
            description: "Always check gas estimation before large transactions",
            category: "Best Practices",
            priority: 3,
            isActive: true
        }));
    }

    
    function _updateUserRating(address user, uint256 rating) internal {
        uint256 currentCount = userFeedbackCount[user];
        uint256 currentRating = userRating[user];
        
        if (currentCount == 1) {
            userRating[user] = rating;
        } else {
            userRating[user] = ((currentRating * (currentCount - 1)) + rating) / currentCount;
        }
        
        _updateAverageRating();
    }

    
    function _updateAverageRating() internal {
        uint256 totalRating = 0;
        uint256 totalUsers = 0;
        
        // This is a simplified calculation - in production, you'd track this more efficiently
        for (uint256 i = 0; i < feedbacks.length; i++) {
            if (userRating[feedbacks[i].user] > 0) {
                totalRating += userRating[feedbacks[i].user];
                totalUsers++;
            }
        }
        
        averageUserRating = totalUsers > 0 ? totalRating / totalUsers : 0;
    }

    
    function _generateOptimizationTip(
        uint256 gasUsed,
        uint256 dataSize
    ) internal view returns (string memory tip) {
        if (gasUsed > 500000) {
            return "Consider breaking this transaction into smaller batches";
        } else if (dataSize > 1000) {
            return "Large data size detected. Consider compression or off-chain storage";
        } else if (gasUsed > 200000) {
            return "Use multicall to group related operations";
        } else {
            return "Transaction looks optimized. Good job!";
        }
    }

    
    function _updateUXMetrics() internal {
        lastMetricsUpdate = block.timestamp;
        
        emit UXMetricsUpdated(
            _getUniqueUsers(),
            totalFeedback,
            averageUserRating,
            totalGasSaved
        );
    }

    
    function _getUniqueUsers() internal view returns (uint256 uniqueUsers) {
        // This is a simplified calculation - in production, you'd track this more efficiently
        uint256 count = 0;
        for (uint256 i = 0; i < feedbacks.length; i++) {
            if (userFeedbackCount[feedbacks[i].user] > 0) {
                count++;
            }
        }
        return count;
    }

    // ========== VIEW FUNCTIONS ==========
    
    function version() external pure returns (string memory) {
        return "2.0.0";
    }

    
    function getContractStats() external view returns (
        uint256 totalFeedbackResult,
        uint256 totalGasSavedResult,
        uint256 averageRating,
        uint256 lastUpdate
    ) {
        return (totalFeedback, totalGasSaved, averageUserRating, lastMetricsUpdate);
    }
} 