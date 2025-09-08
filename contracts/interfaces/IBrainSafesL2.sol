// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IBrainSafesL2 {
    function receiveFromL1(address sender, uint256 amount) external;
    function initiateWithdrawal(address recipient, uint256 amount) external;
    function receiveCertificateFromL1(address sender, uint256 tokenId) external;
    function mintFromL1(address recipient, uint256 amount) external;
    function mintCertificateFromL1(address recipient, uint256 tokenId, bytes memory data) external;
}
 