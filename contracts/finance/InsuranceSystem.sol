// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract InsuranceSystem is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant CLAIMS_ROLE = keccak256("CLAIMS_ROLE");

    IERC20 public immutable token;
    uint64 public policyCounter;
    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    enum PolicyStatus { Active, Claimed, Settled, Cancelled }

    struct Policy {
        address student;
        uint128 premium;
        uint128 coverage;
        uint32 start;
        uint32 end;
        uint8 status;
    }

    mapping(uint64 => Policy) public policies;

    event PolicyPurchased(uint64 indexed policyId, address indexed student, uint128 premium, uint128 coverage, uint32 end);
    event PolicyClaimed(uint64 indexed policyId, address indexed student);
    event PolicySettled(uint64 indexed policyId, address indexed student, uint128 payout);
    event PolicyCancelled(uint64 indexed policyId, address indexed student);

    constructor(address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        token = IERC20(_token);
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function purchasePolicy(uint128 premium, uint128 coverage, uint32 duration) external onlyRole(STUDENT_ROLE) nonReentrant returns (uint64) {
        require(premium > 0 && coverage > 0 && duration > 0, "Parametros invalidos");
        // Assembly transfer
        address tokenAddr = address(token);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), address())
            mstore(add(ptr, 36), premium)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        unchecked { policyCounter++; }
        policies[policyCounter] = Policy({
            student: msg.sender,
            premium: premium,
            coverage: coverage,
            start: uint32(block.timestamp),
            end: uint32(block.timestamp + duration),
            status: uint8(PolicyStatus.Active)
        });
        emit PolicyPurchased(policyCounter, msg.sender, premium, coverage, uint32(block.timestamp + duration));
        return policyCounter;
    }

    function claimPolicy(uint64 policyId) external onlyRole(STUDENT_ROLE) {
        Policy storage policy = policies[policyId];
        require(policy.student == msg.sender, "No autorizado");
        require(policy.status == uint8(PolicyStatus.Active), "No activa");
        require(block.timestamp <= policy.end, "Expirada");
        policy.status = uint8(PolicyStatus.Claimed);
        emit PolicyClaimed(policyId, msg.sender);
    }

    function settleClaim(uint64 policyId) external onlyRole(CLAIMS_ROLE) nonReentrant {
        Policy storage policy = policies[policyId];
        require(policy.status == uint8(PolicyStatus.Claimed), "No reclamada");
        policy.status = uint8(PolicyStatus.Settled);
        // Assembly transfer
        address tokenAddr = address(token);
        address studentAddr = policy.student;
        uint128 cov = policy.coverage;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), studentAddr)
            mstore(add(ptr, 36), cov)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        emit PolicySettled(policyId, policy.student, policy.coverage);
    }

    function cancelPolicy(uint64 policyId) external onlyRole(ADMIN_ROLE) {
        Policy storage policy = policies[policyId];
        require(policy.status == uint8(PolicyStatus.Active), "No activa");
        policy.status = uint8(PolicyStatus.Cancelled);
        emit PolicyCancelled(policyId, policy.student);
    }

    function getPolicyStatus(uint64 policyId) external view returns (uint8) {
        return policies[policyId].status;
    }
} 