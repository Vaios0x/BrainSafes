// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CommunityRewards is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    IERC20 public immutable rewardToken;
    address public badgeContract;
    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    mapping(address => uint96) public points; // packing
    mapping(address => uint96) public claimed;
    mapping(address => uint256) internal badgeBitmap; // bitmap para badges

    event PointsAssigned(address indexed user, uint96 points);
    event RewardClaimed(address indexed user, uint96 amount);
    event BadgeClaimed(address indexed user, uint8 badgeType);

    constructor(address _token, address _badgeContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        rewardToken = IERC20(_token);
        badgeContract = _badgeContract;
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function assignPoints(address user, uint96 pts) external onlyRole(ADMIN_ROLE) {
        require(pts > 0, unicode"Puntos inválidos");
        unchecked { points[user] += pts; }
        emit PointsAssigned(user, pts);
    }

    function assignPointsOracle(address user, uint96 pts) external onlyRole(ORACLE_ROLE) {
        require(pts > 0, unicode"Puntos inválidos");
        unchecked { points[user] += pts; }
        emit PointsAssigned(user, pts);
    }

    function claimTokenReward(uint96 amount) external {
        uint96 userPoints = points[msg.sender];
        require(userPoints >= amount, "No tienes suficientes puntos");
        require(amount > 0, unicode"Cantidad inválida");
        unchecked { points[msg.sender] = userPoints - amount; }
        claimed[msg.sender] += amount;
        // Assembly transfer
        address token = address(rewardToken);
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), caller())
            mstore(add(ptr, 36), amount)
            let result := call(gas(), token, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        emit RewardClaimed(msg.sender, amount);
    }

    function claimBadge(uint8 badgeType, string memory badgeURI) external {
        require(points[msg.sender] >= 1000, "Se requieren 1000 puntos para badge");
        require((badgeBitmap[msg.sender] & (1 << badgeType)) == 0, "Badge ya reclamado");
        badgeBitmap[msg.sender] |= (1 << badgeType);
        // Llamada al contrato de badge (debe tener función mintBadge)
        (bool ok, ) = badgeContract.call(abi.encodeWithSignature("mintBadge(address,string)", msg.sender, badgeURI));
        require(ok, "Mint badge fallido");
        emit BadgeClaimed(msg.sender, badgeType);
    }

    function getPoints(address user) external view returns (uint96) {
        return points[user];
    }

    function getClaimed(address user) external view returns (uint96) {
        return claimed[user];
    }

    function hasBadge(address user, uint8 badgeType) external view returns (bool) {
        return (badgeBitmap[user] & (1 << badgeType)) != 0;
    }
} 