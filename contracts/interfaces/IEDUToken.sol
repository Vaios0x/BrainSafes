// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;


interface IEDUToken {
    // ========== ERC20 STANDARD FUNCTIONS ==========
    
    function totalSupply() external view returns (uint256);

    
    function balanceOf(address account) external view returns (uint256);

    
    function transfer(address to, uint256 amount) external returns (bool);

    
    function allowance(address owner, address spender) external view returns (uint256);

    
    function approve(address spender, uint256 amount) external returns (bool);

    
    function transferFrom(address from, address to, uint256 amount) external returns (bool);

    // ========== MINTING FUNCTIONS ==========
    
    function mint(address to, uint256 amount) external;

    
    function batchMint(address[] calldata recipients, uint256[] calldata amounts) external;

    
    function mintCourseCompletionReward(address student, uint256 courseId, uint256 score) external;

    
    function mintAchievementReward(address user, uint256 achievementId, uint256 rewardAmount) external;

    
    function mintScholarshipReward(address student, uint256 programId, uint256 amount) external;

    // ========== BURNING FUNCTIONS ==========
    
    function burn(uint256 amount) external;

    
    function burnFrom(address from, uint256 amount) external;

    
    function batchBurn(address[] calldata from, uint256[] calldata amounts) external;

    // ========== STAKING FUNCTIONS ==========
    
    function stake(uint256 amount) external;

    
    function unstake(uint256 amount) external;

    
    function stakedBalance(address user) external view returns (uint256);

    
    function claimStakingRewards() external;

    // ========== GOVERNANCE FUNCTIONS ==========
    
    function getVotingPower(address user) external view returns (uint256);

    
    function delegate(address delegatee) external;

    
    function delegates(address delegator) external view returns (address);

    // ========== UTILITY FUNCTIONS ==========
    
    function circulatingSupply() external view returns (uint256);

    
    function totalBurned() external view returns (uint256);

    
    function totalStaked() external view returns (uint256);

    
    function hasMinimumStake(address user) external view returns (bool);

    // ========== EVENTS ==========
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    event TokensStaked(address indexed user, uint256 amount);
    event TokensUnstaked(address indexed user, uint256 amount);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event VotingPowerDelegated(address indexed delegator, address indexed delegatee);
    event CourseCompletionRewardMinted(address indexed student, uint256 courseId, uint256 amount);
    event AchievementRewardMinted(address indexed user, uint256 achievementId, uint256 amount);
    event ScholarshipRewardMinted(address indexed student, uint256 programId, uint256 amount);
}
