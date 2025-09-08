// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface ICustomToken {
    // ========== BRIDGE FUNCTIONS ==========
    
    function bridgeInit(address _l1Token) external;
    
    
    function bridgeMint(address _account, uint256 _amount) external;
    
    
    function l1Address() external view returns (address);
    
    
    function getBridgeConfig() external view returns (
        address l1Token,
        address l2Gateway,
        address l1Gateway
    );
    
    
    function bridgeToL1(address _to, uint256 _amount) external;
    
    
    function batchBridgeToL1(
        address[] calldata _recipients,
        uint256[] calldata _amounts
    ) external;
    
    // ========== TOKEN FUNCTIONS ==========
    
    function mint(address to, uint256 amount) external;
    
    
    function burnFrom(address account, uint256 amount) external;
    
    
    function snapshot() external;
    
    
    function pause() external;
    
    
    function unpause() external;
    
    // ========== STAKING FUNCTIONS ==========
    
    function stake(uint256 amount, uint256 lockPeriod) external;
    
    
    function unstake(uint256 stakeIndex) external;
    
    
    function calculateStakingReward(address user, uint256 stakeIndex) external view returns (uint256);
    
    
    function getUserStakes(address user) external view returns (StakeInfo[] memory);
    
    // ========== REWARD FUNCTIONS ==========
    
    function rewardLearning(address student) external;
    
    
    function rewardAchievement(address user) external;
    
    
    function rewardReferral(address referrer, address referred) external;
    
    
    function claimDailyLoginReward() external;
    
    
    function rewardInstructor(address instructor) external;
    
    
    function batchReward(
        address[] calldata users,
        uint256[] calldata amounts,
        string calldata rewardType
    ) external;
    
    // ========== FIAT INTEGRATION ==========
    
    function mintFiatUser(address to, uint256 amount, string memory paymentId) external;
    
    // ========== VIEW FUNCTIONS ==========
    
    function getUserInfo(address user) external view returns (
        uint256 balance,
        uint256 stakedAmount,
        uint256 pendingRewards,
        uint256 loginStreak,
        uint256 referralsCount,
        bool isBlacklisted
    );
    
    
    function getGlobalStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _stakingAPY
    );
    
    
    function canUnstake(address user, uint256 stakeIndex) external view returns (bool);
    
    
    function version() external pure returns (string memory);
    
    // ========== STRUCTURES ==========
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 lockPeriod;
        uint256 rewardRate;
        bool active;
    }
    
    struct RewardConfig {
        uint256 learningReward;
        uint256 achievementReward;
        uint256 referralReward;
        uint256 instructorBonus;
        uint256 dailyLoginReward;
    }
}

