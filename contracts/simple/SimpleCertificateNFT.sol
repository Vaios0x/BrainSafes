// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SimpleCertificateNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    Counters.Counter private _tokenIds;
    
    struct Certificate {
        string courseName;
        string studentName;
        uint256 issueDate;
        string ipfsHash;
        bool isVerified;
    }
    
    mapping(uint256 => Certificate) public certificates;
    
    event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string courseName);
    
    constructor() ERC721("BrainSafes Certificate", "CERT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }
    
    function issueCertificate(
        address recipient,
        string memory courseName,
        string memory studentName,
        string memory ipfsHash
    ) external onlyRole(VERIFIER_ROLE) returns (uint256) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        certificates[tokenId] = Certificate({
            courseName: courseName,
            studentName: studentName,
            issueDate: block.timestamp,
            ipfsHash: ipfsHash,
            isVerified: true
        });
        
        _mint(recipient, tokenId);
        
        emit CertificateIssued(tokenId, recipient, courseName);
        return tokenId;
    }
    
    function getCertificate(uint256 tokenId) external view returns (Certificate memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}