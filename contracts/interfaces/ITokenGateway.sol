// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface ITokenGateway {
    // ========== OUTBOUND TRANSFERS ==========
    
    function outboundTransfer(
        address _token,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external returns (bytes memory);
    
    
    function batchOutboundTransfer(
        address _token,
        address[] calldata _recipients,
        uint256[] calldata _amounts,
        bytes calldata _data
    ) external returns (bytes[] memory);
    
    // ========== INBOUND TRANSFERS ==========
    
    function finalizeInboundTransfer(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external;
    
    
    function batchFinalizeInboundTransfer(
        address _token,
        address[] calldata _froms,
        address[] calldata _tos,
        uint256[] calldata _amounts,
        bytes[] calldata _data
    ) external;
    
    // ========== WITHDRAWAL FUNCTIONS ==========
    
    function initiateWithdrawal(
        address _token,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external;
    
    
    function completeWithdrawal(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        bytes calldata _data
    ) external;
    
    // ========== GATEWAY CONFIGURATION ==========
    
    function counterpartGateway() external view returns (address);
    
    
    function l1Gateway() external view returns (address);
    
    
    function l2Gateway() external view returns (address);
    
    
    function isSupportedToken(address _token) external view returns (bool);
    
    
    function getMaxTransferAmount(address _token) external view returns (uint256);
    
    
    function getMinTransferAmount(address _token) external view returns (uint256);
    
    // ========== FEE FUNCTIONS ==========
    
    function calculateTransferFee(address _token, uint256 _amount) external view returns (uint256);
    
    
    function feeRecipient() external view returns (address);
    
    
    function feePercentage() external view returns (uint256);
    
    // ========== SECURITY FUNCTIONS ==========
    
    function pause() external;
    
    
    function unpause() external;
    
    
    function paused() external view returns (bool);
    
    
    function emergencyStop() external;
    
    
    function resumeOperations() external;
    
    // ========== EVENTS ==========
    event OutboundTransferInitiated(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data
    );
    
    event InboundTransferFinalized(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data
    );
    
    event WithdrawalInitiated(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data
    );
    
    event WithdrawalCompleted(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data
    );
    
    event GatewayPaused(address indexed operator);
    event GatewayUnpaused(address indexed operator);
    event EmergencyStop(address indexed operator);
    event OperationsResumed(address indexed operator);
}

