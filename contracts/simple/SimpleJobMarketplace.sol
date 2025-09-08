// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IERC20Simple {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract SimpleJobMarketplace is AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    
    Counters.Counter private _jobIds;
    
    IERC20Simple public eduToken;
    
    enum JobStatus { Open, InProgress, Completed, Cancelled }
    
    struct Job {
        uint256 jobId;
        address employer;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        JobStatus status;
        address assignedFreelancer;
        string[] requiredSkills;
        uint256 createdAt;
    }
    
    struct Application {
        address freelancer;
        string proposal;
        uint256 proposedBudget;
        uint256 appliedAt;
        bool isAccepted;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application[]) public jobApplications;
    mapping(uint256 => mapping(address => bool)) public hasApplied;
    
    event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 budget);
    event ApplicationSubmitted(uint256 indexed jobId, address indexed freelancer, uint256 proposedBudget);
    event JobAssigned(uint256 indexed jobId, address indexed freelancer);
    event JobCompleted(uint256 indexed jobId);
    
    constructor(address _eduToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        eduToken = IERC20Simple(_eduToken);
    }
    
    function postJob(
        string memory title,
        string memory description,
        uint256 budget,
        uint256 deadline,
        string[] memory requiredSkills
    ) external returns (uint256) {
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(budget > 0, "Budget must be greater than 0");
        
        _jobIds.increment();
        uint256 jobId = _jobIds.current();
        
        jobs[jobId] = Job({
            jobId: jobId,
            employer: msg.sender,
            title: title,
            description: description,
            budget: budget,
            deadline: deadline,
            status: JobStatus.Open,
            assignedFreelancer: address(0),
            requiredSkills: requiredSkills,
            createdAt: block.timestamp
        });
        
        // Escrow the budget
        require(eduToken.transferFrom(msg.sender, address(this), budget), "Budget transfer failed");
        
        emit JobPosted(jobId, msg.sender, title, budget);
        return jobId;
    }
    
    function applyForJob(
        uint256 jobId,
        string memory proposal,
        uint256 proposedBudget
    ) external {
        require(jobs[jobId].jobId != 0, "Job does not exist");
        require(jobs[jobId].status == JobStatus.Open, "Job is not open");
        require(!hasApplied[jobId][msg.sender], "Already applied");
        require(proposedBudget <= jobs[jobId].budget, "Proposed budget exceeds job budget");
        
        jobApplications[jobId].push(Application({
            freelancer: msg.sender,
            proposal: proposal,
            proposedBudget: proposedBudget,
            appliedAt: block.timestamp,
            isAccepted: false
        }));
        
        hasApplied[jobId][msg.sender] = true;
        
        emit ApplicationSubmitted(jobId, msg.sender, proposedBudget);
    }
    
    function assignJob(uint256 jobId, address freelancer) external {
        require(jobs[jobId].employer == msg.sender, "Only employer can assign");
        require(jobs[jobId].status == JobStatus.Open, "Job is not open");
        require(hasApplied[jobId][freelancer], "Freelancer has not applied");
        
        jobs[jobId].status = JobStatus.InProgress;
        jobs[jobId].assignedFreelancer = freelancer;
        
        // Mark the accepted application
        Application[] storage applications = jobApplications[jobId];
        for (uint256 i = 0; i < applications.length; i++) {
            if (applications[i].freelancer == freelancer) {
                applications[i].isAccepted = true;
                break;
            }
        }
        
        emit JobAssigned(jobId, freelancer);
    }
    
    function completeJob(uint256 jobId) external nonReentrant {
        require(jobs[jobId].employer == msg.sender, "Only employer can complete");
        require(jobs[jobId].status == JobStatus.InProgress, "Job is not in progress");
        
        jobs[jobId].status = JobStatus.Completed;
        
        // Release payment to freelancer
        address freelancer = jobs[jobId].assignedFreelancer;
        uint256 budget = jobs[jobId].budget;
        
        require(eduToken.transfer(freelancer, budget), "Payment transfer failed");
        
        emit JobCompleted(jobId);
    }
    
    function getJob(uint256 jobId) external view returns (Job memory) {
        require(jobs[jobId].jobId != 0, "Job does not exist");
        return jobs[jobId];
    }
    
    function getJobApplications(uint256 jobId) external view returns (Application[] memory) {
        return jobApplications[jobId];
    }
    
    function getActiveJobs() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active jobs
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].status == JobStatus.Open) {
                activeCount++;
            }
        }
        
        // Collect active job IDs
        uint256[] memory activeJobs = new uint256[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _jobIds.current(); i++) {
            if (jobs[i].status == JobStatus.Open) {
                activeJobs[index] = i;
                index++;
            }
        }
        
        return activeJobs;
    }
}