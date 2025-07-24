// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";

contract GenericNFTBridge is AccessControl {
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");
    IERC721 public immutable nft;
    IERC721Metadata public immutable nftMeta;

    event BridgeRequest(address indexed user, uint256 indexed tokenId, string targetChain, string tokenURI);
    event NFTMinted(address indexed user, uint256 indexed tokenId, string sourceChain, string tokenURI);

    constructor(address _nft) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);
        nft = IERC721(_nft);
        nftMeta = IERC721Metadata(_nft);
    }

    // Usuario solicita puente: quema o bloquea el NFT
    function requestBridge(uint256 tokenId, string memory targetChain) external {
        require(nft.ownerOf(tokenId) == msg.sender, "No owner");
        string memory uri = nftMeta.tokenURI(tokenId);
        // Transferir a este contrato (lock) o quemar si es burnable
        nft.transferFrom(msg.sender, address(this), tokenId);
        emit BridgeRequest(msg.sender, tokenId, targetChain, uri);
    }

    // El bridge/oráculo mintea el NFT en la red destino
    function mintFromBridge(address to, uint256 tokenId, string memory sourceChain, string memory tokenURI) external onlyRole(BRIDGE_ROLE) {
        // Aquí deberías llamar a un contrato NFT con función mint especial
        // Por simplicidad, solo emitimos el evento
        emit NFTMinted(to, tokenId, sourceChain, tokenURI);
    }
} 