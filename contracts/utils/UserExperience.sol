// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UserExperience
 * @dev Herramientas para estimación de gas, feedback de usuario y sugerencias de optimización UX.
 * @author BrainSafes Team
 */
contract UserExperience {
    struct Feedback {
        address user;
        string message;
        uint256 timestamp;
    }

    Feedback[] public feedbacks;

    event FeedbackSubmitted(address indexed user, string message, uint256 timestamp);

    /// @notice Permite a un usuario enviar feedback sobre la UX
    function submitFeedback(string calldata message) external {
        feedbacks.push(Feedback(msg.sender, message, block.timestamp));
        emit FeedbackSubmitted(msg.sender, message, block.timestamp);
    }

    /// @notice Devuelve el número total de feedbacks
    function feedbackCount() external view returns (uint256) {
        return feedbacks.length;
    }

    /// @notice Devuelve un feedback por índice
    function getFeedback(uint256 index) external view returns (address user, string memory message, uint256 timestamp) {
        Feedback storage fb = feedbacks[index];
        return (fb.user, fb.message, fb.timestamp);
    }

    /// @notice Estima el gas para una llamada (simulación simple, no on-chain real)
    /// @dev En producción, usar off-chain o precompilados específicos de Arbitrum para estimación precisa
    function estimateTransactionCosts(address target, bytes calldata data, uint256 value) external view returns (uint256 gasEstimate) {
        // Simulación: valor fijo, en producción usar NodeInterface o precompilados
        gasEstimate = 21000 + data.length * 16;
        if (value > 0) {
            gasEstimate += 9000;
        }
    }

    /// @notice Devuelve sugerencias de optimización UX
    function getOptimizationTips() external pure returns (string[] memory tips) {
        tips = new string[](3);
        tips[0] = "Utiliza multicall para agrupar operaciones y ahorrar gas.";
        tips[1] = "Prefiere operaciones batch para reducir costos.";
        tips[2] = "Consulta el estimador de gas antes de ejecutar transacciones grandes.";
    }
} 