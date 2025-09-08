// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CertificateNFT is ERC721, AccessControl {
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");
    uint256 public nextTokenId;
    mapping(uint256 => string) public tokenURIs;

    event CertificateRevoked(address indexed from, uint256 indexed tokenId);

    constructor() ERC721("BrainSafesCertificate", "BSC") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mintCertificate(address to, string memory uri) external onlyRole(MINTER_ROLE) returns (uint256) {
        uint256 tokenId = ++nextTokenId;
        _mint(to, tokenId);
        tokenURIs[tokenId] = uri;
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return tokenURIs[tokenId];
    }

    function grantMinter(address minter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MINTER_ROLE, minter);
    }

    function grantRevoker(address revoker) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(REVOKER_ROLE, revoker);
    }

    function revokeCertificate(uint256 tokenId) external onlyRole(REVOKER_ROLE) {
        address owner = ownerOf(tokenId);
        _burn(tokenId);
        emit CertificateRevoked(owner, tokenId);
    }
} 