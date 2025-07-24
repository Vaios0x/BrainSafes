// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IAaveLendingPool {
    function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

contract DeFiIntegration is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    IERC20 public immutable token;
    IAaveLendingPool public aave;
    uint64 public totalDeposits;
    uint64 public totalYield;
    mapping(address => uint96) public deposits;
    mapping(address => uint96) public yieldEarned;
    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    event Deposited(address indexed user, uint96 amount);
    event YieldSet(address indexed user, uint96 yieldAmount);
    event Withdrawn(address indexed user, uint96 amount, uint96 yield);

    constructor(address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        token = IERC20(_token);
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function setAave(address _aave) external onlyGuardian {
        aave = IAaveLendingPool(_aave);
    }

    function deposit(uint96 amount) external onlyRole(STUDENT_ROLE) nonReentrant {
        require(amount > 0, "Monto invalido");
        // Assembly transfer
        address tokenAddr = address(token);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), address())
            mstore(add(ptr, 36), amount)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        unchecked { deposits[msg.sender] += amount; totalDeposits += amount; }
        // Depositar en Aave si está configurado
        if (address(aave) != address(0)) {
            token.approve(address(aave), amount);
            aave.deposit(address(token), amount, address(this), 0);
        }
        emit Deposited(msg.sender, amount);
    }

    function setYield(address user, uint96 yieldAmount) external onlyRole(ADMIN_ROLE) {
        yieldEarned[user] = yieldAmount;
        emit YieldSet(user, yieldAmount);
    }

    function withdraw() external nonReentrant {
        uint96 deposit = deposits[msg.sender];
        require(deposit > 0, "Nada para retirar");
        uint96 userYield = yieldEarned[msg.sender];
        deposits[msg.sender] = 0;
        yieldEarned[msg.sender] = 0;
        unchecked { totalDeposits -= deposit; }
        // Retirar de Aave si está configurado
        if (address(aave) != address(0)) {
            aave.withdraw(address(token), deposit + userYield, address(this));
        }
        // Assembly transfer
        address tokenAddr = address(token);
        uint256 total = uint256(deposit) + uint256(userYield);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), caller())
            mstore(add(ptr, 36), total)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        emit Withdrawn(msg.sender, deposit, userYield);
    }

    function getDeposit(address user) external view returns (uint96) {
        return deposits[user];
    }

    function getYield(address user) external view returns (uint96) {
        return yieldEarned[user];
    }
} 