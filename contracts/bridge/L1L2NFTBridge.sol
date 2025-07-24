// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract L1L2NFTBridge is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    IERC721 public immutable nft;
    IERC721Metadata public immutable nftMeta;

    event Deposit(address indexed user, uint256 indexed tokenId, string tokenURI);
    event Withdraw(address indexed user, uint256 indexed tokenId, string tokenURI);

    constructor(address _nft) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        nft = IERC721(_nft);
        nftMeta = IERC721Metadata(_nft);
    }

    // L1: usuario deposita NFT para transferir a L2
    function deposit(uint256 tokenId) external {
        require(nft.ownerOf(tokenId) == msg.sender, "No owner");
        string memory uri = nftMeta.tokenURI(tokenId);
        nft.transferFrom(msg.sender, address(this), tokenId); // lock
        emit Deposit(msg.sender, tokenId, uri);
    }

    // L2: bridge/oráculo mintea NFT al usuario tras verificación
    function withdraw(address to, uint256 tokenId, string memory tokenURI) external onlyRole(BRIDGE_ROLE) {
        // Aquí deberías mintear el NFT en L2 (o liberar en L1)
        emit Withdraw(to, tokenId, tokenURI);
    }
} 