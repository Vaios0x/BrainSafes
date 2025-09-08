// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IApi3Oracle {
    function getData(bytes32 key) external view returns (uint256);
    function getDataWithProof(bytes32 key) external view returns (uint256, bytes memory);
}