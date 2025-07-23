// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@arbitrum/nitro-contracts/src/bridge/ICustomToken.sol";
import "@arbitrum/nitro-contracts/src/bridge/ITokenGateway.sol";

/**
 * @title EDUToken
 * @dev Native ERC-20 token for the BrainSafes ecosystem
 * @dev Features: Mintable, Burnable, Pausable, with Rewards and Staking System
 * @dev Optimized for Arbitrum with custom bridge support
 * @author BrainSafes Team
 */
contract EDUToken is ERC20, ERC20Burnable, ERC20Snapshot, AccessControl, Pausable, ICustomToken {
    using SafeMath for uint256;

    // Arbitrum precompiles
    ArbSys constant arbsys = ArbSys(address(0x64));
    
    // Bridge configuration
    address public l1Token;
    address public l2Gateway;
    address public l1Gateway;
    
    // Bridge events
    event TokensBridged(address indexed from, address indexed to, uint256 amount, uint256 chainId);
    event TokensReceived(address indexed to, uint256 amount, uint256 fromChainId);
    event BridgeConfigUpdated(address l1Token, address l2Gateway, address l1Gateway);

    // ========== ROLES ==========
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant STAKING_ROLE = keccak256("STAKING_ROLE");
    bytes32 public constant BRIDGE_ROLE = keccak256("BRIDGE_ROLE");

    // ========== CONSTANTS ==========
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million initial supply
    uint256 public constant STAKING_REWARD_RATE = 500; // 5% annual
    uint256 public constant MIN_STAKING_AMOUNT = 100 * 10**18; // 100 EDU minimum
    uint256 public constant STAKING_LOCK_PERIOD = 30 days; // Minimum lock period

    // ========== STRUCTURES ==========
    /**
     * @dev Structure for storing staking information
     */
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod;
        uint256 rewardRate;
        bool active;
    }

    /**
     * @dev Structure for reward configuration
     */
    struct RewardConfig {
        uint256 learningReward;      // Reward for completing lessons
        uint256 achievementReward;   // Reward for achievements
        uint256 referralReward;      // Reward for referrals
        uint256 instructorBonus;     // Bonus for instructors
        uint256 dailyLoginReward;    // Reward for daily login
    }

    // ========== CROSS-CHAIN VARIABLES ==========
    address public l1TokenAddress;
    mapping(bytes32 => bool) public processedL1Messages;
    mapping(uint256 => bool) public processedL2ToL1Messages;

    // ========== STATE VARIABLES ==========
    mapping(address => StakeInfo[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyLoginStreak;
    mapping(address => uint256) public lastLoginTime;
    mapping(address => address) public referrals; // referred => referrer
    mapping(address => uint256) public referralCount;
    mapping(address => bool) public blacklisted;

    RewardConfig public rewardConfig;
    uint256 public totalStakedGlobal;
    uint256 public totalRewardsDistributed;
    bool public stakingEnabled = true;
    bool public transfersEnabled = true;

    // ========== EVENTS ==========
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 amount, string rewardType);
    event ReferralRewarded(address indexed referrer, address indexed referred, uint256 amount);
    event DailyLoginRewarded(address indexed user, uint256 amount, uint256 streak);
    event StakingConfigUpdated(bool enabled);
    event RewardConfigUpdated();
    event UserBlacklisted(address indexed user, bool blacklisted);
    event TokensBridged(address indexed from, address indexed to, uint256 amount, uint256 chainId);
    event TokensReceived(address indexed to, uint256 amount, uint256 fromChainId);

    // ========== MODIFIERS ==========
    /**
     * @dev Ensures the account is not blacklisted
     */
    modifier notBlacklisted(address account) {
        require(!blacklisted[account], "Account is blacklisted");
        _;
    }

    /**
     * @dev Ensures staking is enabled
     */
    modifier stakingIsEnabled() {
        require(stakingEnabled, "Staking is disabled");
        _;
    }

    /**
     * @dev Ensures transfers are enabled
     */
    modifier transfersAreEnabled() {
        require(transfersEnabled, "Transfers are disabled");
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Initializes the contract with initial supply and reward configuration
     */
    constructor() ERC20("BrainSafes Token", "EDU") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(STAKING_ROLE, msg.sender);
        _grantRole(BRIDGE_ROLE, msg.sender);

        // Initial reward configuration
        rewardConfig = RewardConfig({
            learningReward: 10 * 10**18,      // 10 EDU per lesson
            achievementReward: 50 * 10**18,   // 50 EDU per achievement
            referralReward: 25 * 10**18,      // 25 EDU per referral
            instructorBonus: 100 * 10**18,    // 100 EDU instructor bonus
            dailyLoginReward: 1 * 10**18      // 1 EDU per daily login
        });

        // Mint initial supply
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // ========== TOKEN FUNCTIONS ==========
    /**
     * @dev Mint tokens - only for authorized roles
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply().add(amount) <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens from a specific account
     */
    function burnFrom(address account, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(account, amount);
    }

    /**
     * @dev Create a snapshot of the current state
     */
    function snapshot() public onlyRole(SNAPSHOT_ROLE) {
        _snapshot();
    }

    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== CROSS-CHAIN FUNCTIONALITY ==========
    /**
     * @dev Set the L1 token address for cross-chain messaging
     * @param _l1TokenAddress Address of the token on L1
     */
    function setL1TokenAddress(address _l1TokenAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        l1TokenAddress = _l1TokenAddress;
    }
    
    /**
     * @dev Initialize bridge configuration
     */
    function initializeBridge(
        address _l1Token,
        address _l2Gateway,
        address _l1Gateway
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        l1Token = _l1Token;
        l2Gateway = _l2Gateway;
        l1Gateway = _l1Gateway;
        emit BridgeConfigUpdated(_l1Token, _l2Gateway, _l1Gateway);
    }

    /**
     * @dev Implementation of ICustomToken for Arbitrum bridge support
     */
    function bridgeInit(address _l1Token) external override {
        require(msg.sender == l2Gateway, "Only L2 Gateway can initialize bridge");
        require(l1Token == address(0), "Bridge already initialized");
        l1Token = _l1Token;
        emit BridgeConfigUpdated(_l1Token, l2Gateway, l1Gateway);
    }

    /**
     * @dev Bridge tokens to L1 using the custom gateway
     */
    function bridgeToL1(
        address _to,
        uint256 _amount
    ) external whenNotPaused notBlacklisted(msg.sender) {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _amount, "Insufficient balance");
        
        // Approve gateway to spend tokens
        _approve(msg.sender, l2Gateway, _amount);
        
        // Initiate bridge transfer
        ITokenGateway(l2Gateway).outboundTransfer(
            l1Token,
            _to,
            _amount,
            new bytes(0) // No additional data needed
        );
        
        emit TokensBridged(msg.sender, _to, _amount, 1); // 1 for Ethereum mainnet
    }

    /**
     * @dev Process tokens received from L1
     * This function can only be called by the L2 Gateway
     */
    function bridgeMint(
        address _account,
        uint256 _amount
    ) external override {
        require(msg.sender == l2Gateway, "Only L2 Gateway can mint");
        _mint(_account, _amount);
        emit TokensReceived(_account, _amount, 1); // 1 for Ethereum mainnet
    }

    /**
     * @dev Get the L1 token address
     */
    function l1Address() external view override returns (address) {
        return l1Token;
    }

    /**
     * @dev Batch bridge transfer to L1 for gas optimization
     */
    function batchBridgeToL1(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external whenNotPaused notBlacklisted(msg.sender) {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length <= 20, "Batch too large");
        
        uint256 totalAmount = 0;
        for(uint256 i = 0; i < _amounts.length; i++) {
            totalAmount = totalAmount.add(_amounts[i]);
        }
        
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        // Approve gateway to spend total amount
        _approve(msg.sender, l2Gateway, totalAmount);
        
        // Process each transfer
        for(uint256 i = 0; i < _recipients.length; i++) {
            ITokenGateway(l2Gateway).outboundTransfer(
                l1Token,
                _recipients[i],
                _amounts[i],
                new bytes(0)
            );
            
            emit TokensBridged(msg.sender, _recipients[i], _amounts[i], 1);
        }
    }

    /**
     * @dev Get bridge configuration
     */
    function getBridgeConfig() external view returns (
        address _l1Token,
        address _l2Gateway,
        address _l1Gateway
    ) {
        return (l1Token, l2Gateway, l1Gateway);
    }
    
    /**
     * @dev Batch process multiple transfers for gas optimization
     * @param _recipients Array of recipient addresses
     * @param _amounts Array of amounts to transfer
     */
    function batchTransfer(address[] calldata _recipients, uint256[] calldata _amounts) 
        external 
        notBlacklisted(msg.sender) 
        transfersAreEnabled 
    {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length <= 100, "Batch too large");
        
        uint256 totalAmount = 0;
        for(uint256 i = 0; i < _amounts.length; i++) {
            totalAmount = totalAmount.add(_amounts[i]);
        }
        
        require(balanceOf(msg.sender) >= totalAmount, "Insufficient balance");
        
        for(uint256 i = 0; i < _recipients.length; i++) {
            require(!blacklisted[_recipients[i]], "Recipient blacklisted");
            _transfer(msg.sender, _recipients[i], _amounts[i]);
        }
    }

    // ========== STAKING SYSTEM ==========
    /**
     * @dev Stake tokens
     * @param amount Amount of tokens to stake
     * @param lockPeriod Duration to lock tokens for
     */
    function stake(uint256 amount, uint256 lockPeriod) external stakingIsEnabled notBlacklisted(msg.sender) {
        require(amount >= MIN_STAKING_AMOUNT, "Minimum amount not reached");
        require(lockPeriod >= STAKING_LOCK_PERIOD, "Lock period too short");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        // Transfer tokens to the contract
        _transfer(msg.sender, address(this), amount);

        // Create stake
        userStakes[msg.sender].push(StakeInfo({
            amount: amount,
            timestamp: block.timestamp,
            lockPeriod: lockPeriod,
            rewardRate: STAKING_REWARD_RATE,
            active: true
        }));

        totalStaked[msg.sender] = totalStaked[msg.sender].add(amount);
        totalStakedGlobal = totalStakedGlobal.add(amount);

        emit Staked(msg.sender, amount, lockPeriod);
    }

    /**
     * @dev Unstake tokens
     */
    function unstake(uint256 stakeIndex) external notBlacklisted(msg.sender) {
        require(stakeIndex < userStakes[msg.sender].length, "Stake does not exist");
        
        StakeInfo storage stakeInfo = userStakes[msg.sender][stakeIndex];
        require(stakeInfo.active, "Stake already withdrawn");
        require(
            block.timestamp >= stakeInfo.timestamp.add(stakeInfo.lockPeriod),
            "Lock period not completed"
        );

        uint256 stakedAmount = stakeInfo.amount;
        uint256 reward = calculateStakingReward(msg.sender, stakeIndex);

        // Mark stake as inactive
        stakeInfo.active = false;
        totalStaked[msg.sender] = totalStaked[msg.sender].sub(stakedAmount);
        totalStakedGlobal = totalStakedGlobal.sub(stakedAmount);

        // Transfer tokens back + rewards
        _transfer(address(this), msg.sender, stakedAmount);
        if (reward > 0) {
            mint(msg.sender, reward);
            totalRewardsDistributed = totalRewardsDistributed.add(reward);
        }

        emit Unstaked(msg.sender, stakedAmount, reward);
    }

    /**
     * @dev Calculate staking reward
     * @param user Address of the staker
     * @param stakeIndex Index of the stake
     * @return Calculated reward amount
     */
    function calculateStakingReward(address user, uint256 stakeIndex) public view returns (uint256) {
        require(stakeIndex < userStakes[user].length, "Stake does not exist");
        
        StakeInfo storage stakeInfo = userStakes[user][stakeIndex];
        if (!stakeInfo.active) return 0;

        uint256 stakingDuration = block.timestamp.sub(stakeInfo.timestamp);
        uint256 yearlyReward = stakeInfo.amount.mul(stakeInfo.rewardRate).div(10000);
        uint256 reward = yearlyReward.mul(stakingDuration).div(365 days);

        return reward;
    }

    /**
     * @dev Get user's stake information
     */
    function getUserStakes(address user) external view returns (StakeInfo[] memory) {
        return userStakes[user];
    }

    // ========== REWARDS SYSTEM ==========
    /**
     * @dev Reward for completing a lesson
     * @param student Address of the student to reward
     */
    function rewardLearning(address student) external onlyRole(MINTER_ROLE) notBlacklisted(student) {
        uint256 reward = rewardConfig.learningReward;
        mint(student, reward);
        totalRewardsDistributed = totalRewardsDistributed.add(reward);
        emit RewardClaimed(student, reward, "learning");
    }

    /**
     * @dev Reward for achieving an achievement
     */
    function rewardAchievement(address user) external onlyRole(MINTER_ROLE) notBlacklisted(user) {
        uint256 reward = rewardConfig.achievementReward;
        mint(user, reward);
        totalRewardsDistributed = totalRewardsDistributed.add(reward);
        emit RewardClaimed(user, reward, "achievement");
    }

    /**
     * @dev Reward for referring users
     * @param referrer Address of the referrer
     * @param referred Address of the referred user
     */
    function rewardReferral(address referrer, address referred) external onlyRole(MINTER_ROLE) {
        require(!blacklisted[referrer] && !blacklisted[referred], "User is blacklisted");
        require(referrals[referred] == address(0), "User already referred");
        require(referrer != referred, "You cannot refer yourself");

        referrals[referred] = referrer;
        referralCount[referrer]++;

        uint256 reward = rewardConfig.referralReward;
        mint(referrer, reward);
        totalRewardsDistributed = totalRewardsDistributed.add(reward);

        emit ReferralRewarded(referrer, referred, reward);
    }

    /**
     * @dev Daily login reward
     */
    function claimDailyLoginReward() external notBlacklisted(msg.sender) {
        uint256 currentTime = block.timestamp;
        uint256 lastLogin = lastLoginTime[msg.sender];

        // Check if at least 20 hours have passed since last login
        require(currentTime >= lastLogin.add(20 hours), "Must wait more time");

        // Calculate streak
        uint256 streak = dailyLoginStreak[msg.sender];
        if (currentTime <= lastLogin.add(48 hours)) {
            // Continue streak
            streak = streak.add(1);
        } else {
            // Reset streak
            streak = 1;
        }

        dailyLoginStreak[msg.sender] = streak;
        lastLoginTime[msg.sender] = currentTime;

        // Calculate reward based on streak
        uint256 baseReward = rewardConfig.dailyLoginReward;
        uint256 streakBonus = streak >= 7 ? baseReward.mul(2) : baseReward; // x2 after 7 days
        
        mint(msg.sender, streakBonus);
        totalRewardsDistributed = totalRewardsDistributed.add(streakBonus);

        emit DailyLoginRewarded(msg.sender, streakBonus, streak);
    }

    /**
     * @dev Bonus for instructors for creating quality content
     */
    function rewardInstructor(address instructor) external onlyRole(MINTER_ROLE) notBlacklisted(instructor) {
        uint256 reward = rewardConfig.instructorBonus;
        mint(instructor, reward);
        totalRewardsDistributed = totalRewardsDistributed.add(reward);
        emit RewardClaimed(instructor, reward, "instructor_bonus");
    }

    // ========== ADMIN FUNCTIONS ==========
    /**
     * @dev Update reward configuration
     * @param _learningReward New reward for completing lessons
     * @param _achievementReward New reward for achievements
     * @param _referralReward New reward for referrals
     * @param _instructorBonus New bonus for instructors
     * @param _dailyLoginReward New reward for daily login
     */
    function updateRewardConfig(
        uint256 _learningReward,
        uint256 _achievementReward,
        uint256 _referralReward,
        uint256 _instructorBonus,
        uint256 _dailyLoginReward
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rewardConfig.learningReward = _learningReward;
        rewardConfig.achievementReward = _achievementReward;
        rewardConfig.referralReward = _referralReward;
        rewardConfig.instructorBonus = _instructorBonus;
        rewardConfig.dailyLoginReward = _dailyLoginReward;

        emit RewardConfigUpdated();
    }

    /**
     * @dev Enable/disable staking
     */
    function setStakingEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        stakingEnabled = enabled;
        emit StakingConfigUpdated(enabled);
    }

    /**
     * @dev Enable/disable transfers
     */
    function setTransfersEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersEnabled = enabled;
    }

    /**
     * @dev Add/remove from blacklist
     */
    function setBlacklisted(address user, bool isBlacklisted) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blacklisted[user] = isBlacklisted;
        emit UserBlacklisted(user, isBlacklisted);
    }

    /**
     * @dev Emergency function to recover blacklisted tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }

    // ========== GAS OPTIMIZATION FOR ARBITRUM ==========
    /**
     * @dev Get the current Arbitrum block number (more gas efficient than block.number)
     */
    function getBlockNumber() public view returns (uint256) {
        return arbsys.arbBlockNumber();
    }

    /**
     * @dev Batch claim rewards for gas optimization
     * @param users Array of user addresses to reward
     * @param amounts Array of reward amounts
     * @param rewardType Type of reward
     */
    function batchReward(
        address[] calldata users,
        uint256[] calldata amounts,
        string calldata rewardType
    ) external onlyRole(MINTER_ROLE) {
        require(users.length == amounts.length, "Arrays length mismatch");
        require(users.length <= 100, "Batch too large");
        
        uint256 totalAmount = 0;
        for(uint256 i = 0; i < amounts.length; i++) {
            require(!blacklisted[users[i]], "User blacklisted");
            totalAmount = totalAmount.add(amounts[i]);
            
            mint(users[i], amounts[i]);
            emit RewardClaimed(users[i], amounts[i], rewardType);
        }
        
        totalRewardsDistributed = totalRewardsDistributed.add(totalAmount);
    }

    // ========== OVERRIDES REQUIRED ==========
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused transfersAreEnabled notBlacklisted(from) notBlacklisted(to) {
        super._beforeTokenTransfer(from, to, amount);
    }

    /**
     * @dev Override transfer to handle bridge-related checks
     */
    function transfer(
        address to,
        uint256 amount
    ) public override transfersAreEnabled notBlacklisted(msg.sender) notBlacklisted(to) returns (bool) {
        if (to == l2Gateway) {
            require(amount > 0, "Cannot bridge zero tokens");
        }
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to handle bridge-related checks
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override transfersAreEnabled notBlacklisted(from) notBlacklisted(to) returns (bool) {
        if (to == l2Gateway) {
            require(amount > 0, "Cannot bridge zero tokens");
        }
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Update bridge configuration (only admin)
     */
    function updateBridgeConfig(
        address _l2Gateway,
        address _l1Gateway
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        l2Gateway = _l2Gateway;
        l1Gateway = _l1Gateway;
        emit BridgeConfigUpdated(l1Token, _l2Gateway, _l1Gateway);
    }

    // ========== VIEW FUNCTIONS ==========
    /**
     * @dev Get full information of a user
     * @param user Address of the user
     * @return balance Current token balance
     * @return stakedAmount Total amount staked
     * @return pendingRewards Pending staking rewards
     * @return loginStreak Current daily login streak
     * @return referralsCount Number of successful referrals
     * @return isBlacklisted Whether the user is blacklisted
     */
    function getUserInfo(address user) external view returns (
        uint256 balance,
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 loginStreak,
        uint256 referralsCount,
        bool isBlacklisted
    ) {
        balance = balanceOf(user);
        stakedAmount = totalStaked[user];
        loginStreak = dailyLoginStreak[user];
        referralsCount = referralCount[user];
        isBlacklisted = blacklisted[user];

        // Calculate pending rewards for all stakes
        pendingRewards = 0;
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            if (userStakes[user][i].active) {
                pendingRewards = pendingRewards.add(calculateStakingReward(user, i));
            }
        }
    }

    /**
     * @dev Get global statistics
     * @return _totalSupply Current total supply
     * @return _totalStaked Total amount staked
     * @return _totalRewardsDistributed Total rewards distributed
     * @return _stakingAPY Current staking APY
     */
    function getGlobalStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _stakingAPY
    ) {
        _totalSupply = totalSupply();
        _totalStaked = totalStakedGlobal;
        _totalRewardsDistributed = totalRewardsDistributed;
        _stakingAPY = STAKING_REWARD_RATE; // Returns base rate, could be dynamic
    }

    /**
     * @dev Check if a user can unstake
     * @param user Address of the user
     * @param stakeIndex Index of the stake to check
     * @return Whether the stake can be unstaked
     */
    function canUnstake(address user, uint256 stakeIndex) external view returns (bool) {
        if (stakeIndex >= userStakes[user].length) return false;
        
        StakeInfo storage stakeInfo = userStakes[user][stakeIndex];
        return stakeInfo.active && block.timestamp >= stakeInfo.timestamp.add(stakeInfo.lockPeriod);
    }

    // ========== UTILITY FUNCTIONS ==========
    /**
     * @dev Receive ETH (for specific cases)
     */
    receive() external payable {
        // Only allow deposits from admin
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
    }

    /**
     * @dev Contract version
     * @return Version string in semantic format
     */
    function version() external pure returns (string memory) {
        return "2.0.0";
    }
} 