// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface INodeInterface {
    
    struct L2ToL1Message {
        address sender;
        address recipient;
        bytes data;
        uint256 blockNumber;
        uint256 timestamp;
    }

    
    struct L1ToL2Message {
        address sender;
        address recipient;
        bytes data;
        uint256 gasLimit;
        uint256 maxSubmissionCost;
        uint256 maxFeePerGas;
    }

    
    function estimateL2ToL1Gas(
        address sender,
        address recipient,
        bytes calldata data
    ) external view returns (uint256 gasEstimate);

    
    function estimateL1ToL2Gas(
        address sender,
        address recipient,
        bytes calldata data
    ) external view returns (uint256 gasEstimate);

    
    function getBlockNumber() external view returns (uint256 blockNumber);

    
    function getTimestamp() external view returns (uint256 timestamp);

    
    function getGasPrice() external view returns (uint256 gasPrice);

    
    function getBaseFee() external view returns (uint256 baseFee);

    
    function getL1BaseFee() external view returns (uint256 l1BaseFee);

    
    function getL1GasPrice() external view returns (uint256 l1GasPrice);

    
    function getL1GasUsed() external view returns (uint256 l1GasUsed);

    
    function getL1GasLimit() external view returns (uint256 l1GasLimit);

    
    function getL2GasLimit() external view returns (uint256 l2GasLimit);

    
    function getL2GasUsed() external view returns (uint256 l2GasUsed);

    
    function getL2GasPrice() external view returns (uint256 l2GasPrice);

    
    function getL2BaseFee() external view returns (uint256 l2BaseFee);

    
    function getL2PriorityFee() external view returns (uint256 l2PriorityFee);

    
    function getL2MaxFeePerGas() external view returns (uint256 l2MaxFeePerGas);

    
    function getL2MaxPriorityFeePerGas() external view returns (uint256 l2MaxPriorityFeePerGas);

    
    function getL2GasLimitForL1ToL2() external view returns (uint256 l2GasLimitForL1ToL2);

    
    function getL2GasLimitForL2ToL1() external view returns (uint256 l2GasLimitForL2ToL1);

    
    function getL2GasLimitForL2ToL2() external view returns (uint256 l2GasLimitForL2ToL2);

    
    function getL2GasLimitForL2ToL1WithData(bytes calldata data) external view returns (uint256 l2GasLimitForL2ToL1WithData);

    
    function getL2GasLimitForL1ToL2WithData(bytes calldata data) external view returns (uint256 l2GasLimitForL1ToL2WithData);

    
    function getL2GasLimitForL2ToL2WithData(bytes calldata data) external view returns (uint256 l2GasLimitForL2ToL2WithData);
}