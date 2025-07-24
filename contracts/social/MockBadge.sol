// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MockBadge {
    event BadgeMinted(address indexed to, string uri);
    function mintBadge(address to, string memory uri) public {
        emit BadgeMinted(to, uri);
    }
} 