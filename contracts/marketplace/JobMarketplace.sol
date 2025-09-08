// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../interfaces/IEDUToken.sol";
import "../interfaces/ICertificateNFT.sol";
import "../interfaces/IAIOracle.sol";
import "../optimizations/AdvancedBatchProcessor.sol";
import "../cache/DistributedCacheV2.sol";


contract JobMarketplace is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ========== ROLES ==========
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EMPLOYER_ROLE = keccak256("EMPLOYER_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");

    // ========== INTERFACES ==========
    
    

    
    

    
    

    // ========== STRUCTURES ==========
    
    struct JobPosting {
        uint256 jobId;
        address employer;
        string title;
        string description;
        string company;
        string location;
        JobType jobType;
        ExperienceLevel experienceLevel;
        uint256 salaryMin;
        uint256 salaryMax;
        string[] requiredSkills;
        string[] preferredCertifications;
        uint256 requiredExperience; // in months
        uint256 deadline;
        uint256 maxApplicants;
        uint256 currentApplicants;
        bool isActive;
        uint256 createdAt;
        JobCategory category;
        string ipfsJobDetails;
    }

    
    struct JobApplication {
        uint256 applicationId;
        uint256 jobId;
        address applicant;
        string coverLetter;
        string resumeIPFS;
        uint256[] certificateTokenIds;
        uint256 appliedAt;
        ApplicationStatus status;
        uint256 aiMatchScore;
        uint256 humanScore;
        string employerFeedback;
        uint256 reviewedAt;
    }

    
    struct CandidateProfile {
        address candidateAddress;
        string name;
        string email;
        string profileIPFS;
        string[] skills;
        uint256[] certifications;
        uint256 experienceYears;
        string currentTitle;
        uint256 desiredSalary;
        bool openToWork;
        uint256 lastActiveAt;
        uint256 profileScore;
        string[] preferredLocations;
        JobType[] preferredJobTypes;
    }

    
    struct EmployerProfile {
        address employerAddress;
        string companyName;
        string description;
        string website;
        string logoIPFS;
        uint256 foundedYear;
        CompanySize companySize;
        string industry;
        uint256 totalJobsPosted;
        uint256 successfulHires;
        uint256 reputationScore;
        bool isVerified;
        uint256 joinedAt;
    }

    
    struct JobMatch {
        uint256 jobId;
        address candidate;
        uint256 matchScore;
        string[] matchingSkills;
        string[] missingSkills;
        uint256 salaryCompatibility;
        uint256 locationCompatibility;
        uint256 experienceCompatibility;
        uint256 calculatedAt;
    }

    
    struct HiringContract {
        uint256 contractId;
        uint256 jobId;
        address employer;
        address employee;
        uint256 agreedSalary;
        uint256 startDate;
        uint256 duration; // in days, 0 for indefinite
        string terms;
        ContractStatus status;
        uint256 escrowAmount;
        uint256 milestonesPassed;
        uint256 totalMilestones;
        uint256 createdAt;
    }

    // ========== ENUMS ==========
    
    enum JobType {
        FULL_TIME,
        PART_TIME,
        CONTRACT,
        INTERNSHIP,
        FREELANCE,
        REMOTE
    }

    
    enum ExperienceLevel {
        ENTRY_LEVEL,
        MID_LEVEL,
        SENIOR_LEVEL,
        EXECUTIVE
    }

    
    enum JobCategory {
        TECHNOLOGY,
        DESIGN,
        MARKETING,
        FINANCE,
        OPERATIONS,
        EDUCATION,
        HEALTHCARE,
        OTHER
    }

    
    enum ApplicationStatus {
        SUBMITTED,
        UNDER_REVIEW,
        INTERVIEW_SCHEDULED,
        INTERVIEWED,
        ACCEPTED,
        REJECTED,
        WITHDRAWN
    }

    
    enum CompanySize {
        STARTUP,    // 1-10
        SMALL,      // 11-50
        MEDIUM,     // 51-200
        LARGE,      // 201-1000
        ENTERPRISE  // 1000+
    }

    
    enum ContractStatus {
        DRAFT,
        ACTIVE,
        COMPLETED,
        TERMINATED,
        DISPUTED
    }

    // ========== STATE VARIABLES ==========
    Counters.Counter private _jobIdCounter;
    Counters.Counter private _applicationIdCounter;
    Counters.Counter private _contractIdCounter;

    IEDUToken public eduToken;
    ICertificateNFT public certificateNFT;
    IAIOracle public aiOracle;

    mapping(uint256 => JobPosting) public jobPostings;
    mapping(uint256 => JobApplication) public applications;
    mapping(address => CandidateProfile) public candidateProfiles;
    mapping(address => EmployerProfile) public employerProfiles;
    mapping(uint256 => HiringContract) public hiringContracts;
    mapping(bytes32 => JobMatch) public jobMatches; // hash(jobId, candidate) => JobMatch

    // Mappings for efficient searches
    mapping(address => uint256[]) public employerJobs;
    mapping(address => uint256[]) public candidateApplications;
    mapping(uint256 => uint256[]) public jobApplications;
    mapping(string => uint256[]) public skillBasedJobs;
    mapping(JobCategory => uint256[]) public categoryJobs;

    // Marketplace configuration
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public jobPostingFee = 10 * 10**18; // 10 EDU tokens
    uint256 public successfulHireFee = 100 * 10**18; // 100 EDU tokens
    uint256 public escrowReleaseDelay = 7 days;
    bool public aiMatchingEnabled = true;
    uint256 public minimumMatchScore = 70; // Minimum score for recommendations

    // Statistics
    uint256 public totalJobsPosted;
    uint256 public totalApplications;
    uint256 public successfulMatches;
    uint256 public totalEscrowAmount;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    // ========== EVENTS ==========
    event JobPosted(
        uint256 indexed jobId,
        address indexed employer,
        string title,
        uint256 salaryMax,
        JobCategory category
    );

    event JobApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed applicant,
        uint256 aiMatchScore
    );

    event ApplicationStatusUpdated(
        uint256 indexed applicationId,
        ApplicationStatus oldStatus,
        ApplicationStatus newStatus
    );

    event JobMatchCalculated(
        uint256 indexed jobId,
        address indexed candidate,
        uint256 matchScore
    );

    event HiringContractCreated(
        uint256 indexed contractId,
        uint256 indexed jobId,
        address indexed employer,
        address employee,
        uint256 salary
    );

    event CandidateProfileUpdated(address indexed candidate);
    event EmployerProfileUpdated(address indexed employer);
    event SuccessfulHire(uint256 indexed jobId, address indexed employer, address indexed employee);

    // ========== MODIFIERS ==========
    
    modifier onlyRegisteredCandidate() {
        require(candidateProfiles[msg.sender].candidateAddress != address(0), "Candidate not registered");
        _;
    }

    
    modifier onlyRegisteredEmployer() {
        require(employerProfiles[msg.sender].employerAddress != address(0), "Employer not registered");
        _;
    }

    
    modifier onlyActiveJob(uint256 jobId) {
        require(jobPostings[jobId].isActive, "Job not active");
        require(block.timestamp <= jobPostings[jobId].deadline, "Deadline expired");
        _;
    }

    
    modifier onlyJobPoster(uint256 jobId) {
        require(jobPostings[jobId].employer == msg.sender, "Only the employer can perform this action");
        _;
    }

    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _eduToken,
        address _certificateNFT,
        address _aiOracle
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        eduToken = IEDUToken(_eduToken);
        certificateNFT = ICertificateNFT(_certificateNFT);
        aiOracle = IAIOracle(_aiOracle);
    }

    // ========== REGISTRATION FUNCTIONS ==========
    
    function registerCandidate(
        string memory name,
        string memory email,
        string memory profileIPFS,
        string[] memory skills,
        uint256 experienceYears,
        string memory currentTitle,
        uint256 desiredSalary,
        string[] memory preferredLocations,
        JobType[] memory preferredJobTypes
    ) external {
        require(candidateProfiles[msg.sender].candidateAddress == address(0), "Candidate already registered");
        require(bytes(name).length > 0, "Name required");
        require(bytes(email).length > 0, "Email required");

        // Get candidate's certificates
        uint256[] memory certifications = certificateNFT.getCertificatesByRecipient(msg.sender);

        candidateProfiles[msg.sender] = CandidateProfile({
            candidateAddress: msg.sender,
            name: name,
            email: email,
            profileIPFS: profileIPFS,
            skills: skills,
            certifications: certifications,
            experienceYears: experienceYears,
            currentTitle: currentTitle,
            desiredSalary: desiredSalary,
            openToWork: true,
            lastActiveAt: block.timestamp,
            profileScore: _calculateProfileScore(msg.sender),
            preferredLocations: preferredLocations,
            preferredJobTypes: preferredJobTypes
        });

        _grantRole(STUDENT_ROLE, msg.sender);
        emit CandidateProfileUpdated(msg.sender);
    }

    
    function registerEmployer(
        string memory companyName,
        string memory description,
        string memory website,
        string memory logoIPFS,
        uint256 foundedYear,
        CompanySize companySize,
        string memory industry
    ) external {
        require(employerProfiles[msg.sender].employerAddress == address(0), "Employer already registered");
        require(bytes(companyName).length > 0, "Company name required");

        employerProfiles[msg.sender] = EmployerProfile({
            employerAddress: msg.sender,
            companyName: companyName,
            description: description,
            website: website,
            logoIPFS: logoIPFS,
            foundedYear: foundedYear,
            companySize: companySize,
            industry: industry,
            totalJobsPosted: 0,
            successfulHires: 0,
            reputationScore: 100, // Initial score
            isVerified: false,
            joinedAt: block.timestamp
        });

        _grantRole(EMPLOYER_ROLE, msg.sender);
        emit EmployerProfileUpdated(msg.sender);
    }

    // ========== JOB FUNCTIONS ==========
    
    function postJob(
        string memory title,
        string memory description,
        string memory company,
        string memory location,
        JobType jobType,
        ExperienceLevel experienceLevel,
        uint256 salaryMin,
        uint256 salaryMax,
        string[] memory requiredSkills,
        string[] memory preferredCertifications,
        uint256 requiredExperience,
        uint256 deadlineDays,
        uint256 maxApplicants,
        JobCategory category,
        string memory ipfsJobDetails
    ) external onlyRegisteredEmployer nonReentrant returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(salaryMin <= salaryMax, "Invalid salary range");
        require(deadlineDays > 0 && deadlineDays <= 365, "Invalid deadline");
        require(maxApplicants > 0, "Max applicants must be greater than 0");

        // Charge fee for job posting
        require(
            eduToken.transferFrom(msg.sender, address(this), jobPostingFee),
            "Fee payment failed"
        );

        _jobIdCounter.increment();
        uint256 jobId = _jobIdCounter.current();

        jobPostings[jobId] = JobPosting({
            jobId: jobId,
            employer: msg.sender,
            title: title,
            description: description,
            company: company,
            location: location,
            jobType: jobType,
            experienceLevel: experienceLevel,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            requiredSkills: requiredSkills,
            preferredCertifications: preferredCertifications,
            requiredExperience: requiredExperience,
            deadline: block.timestamp.add(deadlineDays.mul(1 days)),
            maxApplicants: maxApplicants,
            currentApplicants: 0,
            isActive: true,
            createdAt: block.timestamp,
            category: category,
            ipfsJobDetails: ipfsJobDetails
        });

        // Update indices
        employerJobs[msg.sender].push(jobId);
        categoryJobs[category].push(jobId);
        
        for (uint256 i = 0; i < requiredSkills.length; i++) {
            skillBasedJobs[requiredSkills[i]].push(jobId);
        }

        // Update employer statistics
        employerProfiles[msg.sender].totalJobsPosted++;
        totalJobsPosted++;

        emit JobPosted(jobId, msg.sender, title, salaryMax, category);
        return jobId;
    }

    
    function applyToJob(
        uint256 jobId,
        string memory coverLetter,
        string memory resumeIPFS,
        uint256[] memory certificateTokenIds
    ) external onlyRegisteredCandidate onlyActiveJob(jobId) nonReentrant returns (uint256) {
        JobPosting storage job = jobPostings[jobId];
        require(job.currentApplicants < job.maxApplicants, "Max applicants reached");
        require(!_hasAppliedToJob(msg.sender, jobId), "You have already applied for this job");

        // Verify certificates if provided
        if (certificateTokenIds.length > 0) {
            _verifyCertificates(certificateTokenIds, msg.sender);
        }

        _applicationIdCounter.increment();
        uint256 applicationId = _applicationIdCounter.current();

        // Calculate matching score with AI if enabled
        uint256 aiMatchScore = 0;
        if (aiMatchingEnabled) {
            bytes memory candidateData = _prepareCandidateData(msg.sender);
            aiMatchScore = aiOracle.calculateJobMatch(msg.sender, jobId, candidateData);
        }

        applications[applicationId] = JobApplication({
            applicationId: applicationId,
            jobId: jobId,
            applicant: msg.sender,
            coverLetter: coverLetter,
            resumeIPFS: resumeIPFS,
            certificateTokenIds: certificateTokenIds,
            appliedAt: block.timestamp,
            status: ApplicationStatus.SUBMITTED,
            aiMatchScore: aiMatchScore,
            humanScore: 0,
            employerFeedback: "",
            reviewedAt: 0
        });

        job.currentApplicants++;
        candidateApplications[msg.sender].push(applicationId);
        jobApplications[jobId].push(applicationId);
        totalApplications++;

        // Create match record if score is high enough
        if (aiMatchScore >= minimumMatchScore) {
            _createJobMatch(jobId, msg.sender, aiMatchScore);
        }

        emit JobApplicationSubmitted(applicationId, jobId, msg.sender, aiMatchScore);
        return applicationId;
    }

    
    function reviewApplication(
        uint256 applicationId,
        ApplicationStatus newStatus,
        uint256 humanScore,
        string memory feedback
    ) external onlyRole(EMPLOYER_ROLE) {
        JobApplication storage application = applications[applicationId];
        require(
            jobPostings[application.jobId].employer == msg.sender,
            "Only the employer can review"
        );
        require(humanScore <= 100, "Score must be 0-100");

        ApplicationStatus oldStatus = application.status;
        application.status = newStatus;
        application.humanScore = humanScore;
        application.employerFeedback = feedback;
        application.reviewedAt = block.timestamp;

        emit ApplicationStatusUpdated(applicationId, oldStatus, newStatus);

        // If accepted, initiate hiring process
        if (newStatus == ApplicationStatus.ACCEPTED) {
            _initiateHiringProcess(applicationId);
        }
    }

    // ========== MATCHING FUNCTIONS ==========
    
    function calculateJobMatch(address candidate, uint256 jobId) external view returns (uint256) {
        require(jobPostings[jobId].isActive, "Job not active");
        require(candidateProfiles[candidate].candidateAddress != address(0), "Candidate not registered");

        if (!aiMatchingEnabled) {
            return _calculateBasicMatch(candidate, jobId);
        }

        bytes memory candidateData = _prepareCandidateData(candidate);
        return aiOracle.calculateJobMatch(candidate, jobId, candidateData);
    }

    
    function getJobRecommendations(address candidate) external view returns (uint256[] memory) {
        require(candidateProfiles[candidate].candidateAddress != address(0), "Candidate not registered");
        
        if (aiMatchingEnabled) {
            return aiOracle.recommendJobs(candidate);
        }

        return _getBasicRecommendations(candidate);
    }

    
    function _createJobMatch(uint256 jobId, address candidate, uint256 matchScore) internal {
        bytes32 matchKey = keccak256(abi.encodePacked(jobId, candidate));
        
        JobPosting storage job = jobPostings[jobId];
        CandidateProfile storage candidateProfile = candidateProfiles[candidate];
        
        string[] memory matchingSkills = new string[](0);
        string[] memory missingSkills = new string[](0);
        
        // Calculate compatibilities (simplified)
        uint256 salaryCompatibility = _calculateSalaryCompatibility(candidateProfile.desiredSalary, job.salaryMin, job.salaryMax);
        uint256 experienceCompatibility = _calculateExperienceCompatibility(candidateProfile.experienceYears, job.requiredExperience);
        
        jobMatches[matchKey] = JobMatch({
            jobId: jobId,
            candidate: candidate,
            matchScore: matchScore,
            matchingSkills: matchingSkills,
            missingSkills: missingSkills,
            salaryCompatibility: salaryCompatibility,
            locationCompatibility: 100, // Simplified
            experienceCompatibility: experienceCompatibility,
            calculatedAt: block.timestamp
        });

        emit JobMatchCalculated(jobId, candidate, matchScore);
    }

    // ========== CONTRACT FUNCTIONS ==========
    
    function _initiateHiringProcess(uint256 applicationId) internal {
        JobApplication storage application = applications[applicationId];
        JobPosting storage job = jobPostings[application.jobId];

        _contractIdCounter.increment();
        uint256 contractId = _contractIdCounter.current();

        // Calculate agreed salary (simplified, take max)
        uint256 agreedSalary = job.salaryMax;
        uint256 escrowAmount = agreedSalary.mul(3).div(100); // 3% as escrow

        hiringContracts[contractId] = HiringContract({
            contractId: contractId,
            jobId: application.jobId,
            employer: job.employer,
            employee: application.applicant,
            agreedSalary: agreedSalary,
            startDate: block.timestamp.add(7 days), // Start in 7 days
            duration: 365 days, // 1 year by default
            terms: "",
            status: ContractStatus.DRAFT,
            escrowAmount: escrowAmount,
            milestonesPassed: 0,
            totalMilestones: 4, // Quarterly
            createdAt: block.timestamp
        });

        // Mark job as filled
        job.isActive = false;
        employerProfiles[job.employer].successfulHires++;
        successfulMatches++;

        emit HiringContractCreated(contractId, application.jobId, job.employer, application.applicant, agreedSalary);
        emit SuccessfulHire(application.jobId, job.employer, application.applicant);
    }

    
    function activateHiringContract(uint256 contractId) external nonReentrant {
        HiringContract storage contract_ = hiringContracts[contractId];
        require(contract_.employer == msg.sender, "Only the employer can activate");
        require(contract_.status == ContractStatus.DRAFT, "Contract already active");

        // Transfer escrow amount
        require(
            eduToken.transferFrom(msg.sender, address(this), contract_.escrowAmount),
            "Escrow transfer failed"
        );

        contract_.status = ContractStatus.ACTIVE;
        totalEscrowAmount = totalEscrowAmount.add(contract_.escrowAmount);
    }

    // ========== AUXILIARY FUNCTIONS ==========
    
    function _calculateProfileScore(address candidate) internal view returns (uint256) {
        uint256[] memory certs = certificateNFT.getCertificatesByRecipient(candidate);
        uint256 baseScore = 50;
        uint256 certScore = certs.length.mul(10); // 10 points per certificate
        
        uint256 totalScore = baseScore.add(certScore);
        return totalScore > 100 ? 100 : totalScore;
    }

    
    function _verifyCertificates(uint256[] memory certificateIds, address candidate) internal view {
        for (uint256 i = 0; i < certificateIds.length; i++) {
            // Simplified certificate verification - in production would have proper verification
            // For now, we assume certificates are valid if they exist
            require(certificateIds[i] > 0, "Invalid certificate ID");
        }
    }

    
    function _hasAppliedToJob(address candidate, uint256 jobId) internal view returns (bool) {
        uint256[] memory candidateApps = candidateApplications[candidate];
        for (uint256 i = 0; i < candidateApps.length; i++) {
            if (applications[candidateApps[i]].jobId == jobId) {
                return true;
            }
        }
        return false;
    }

    
    function _prepareCandidateData(address candidate) internal view returns (bytes memory) {
        CandidateProfile memory profile = candidateProfiles[candidate];
        uint256[] memory certs = certificateNFT.getCertificatesByRecipient(candidate);
        
        return abi.encode(
            profile.skills,
            profile.experienceYears,
            profile.desiredSalary,
            certs.length,
            profile.profileScore
        );
    }

    
    function _calculateBasicMatch(address candidate, uint256 jobId) internal view returns (uint256) {
        CandidateProfile memory profile = candidateProfiles[candidate];
        JobPosting memory job = jobPostings[jobId];
        
        uint256 score = 0;
        
        // Salary compatibility (30%)
        score = score.add(_calculateSalaryCompatibility(profile.desiredSalary, job.salaryMin, job.salaryMax).mul(30).div(100));
        
        // Experience compatibility (40%)
        score = score.add(_calculateExperienceCompatibility(profile.experienceYears, job.requiredExperience).mul(40).div(100));
        
        // Skill compatibility (30%)
        score = score.add(_calculateSkillCompatibility(profile.skills, job.requiredSkills).mul(30).div(100));
        
        return score;
    }

    function _calculateSalaryCompatibility(uint256 desired, uint256 min, uint256 max) internal pure returns (uint256) {
        if (desired >= min && desired <= max) return 100;
        if (desired < min) return desired.mul(100).div(min);
        return max.mul(100).div(desired);
    }

    function _calculateExperienceCompatibility(uint256 candidateYears, uint256 requiredMonths) internal pure returns (uint256) {
        uint256 candidateMonths = candidateYears.mul(12);
        if (candidateMonths >= requiredMonths) return 100;
        return candidateMonths.mul(100).div(requiredMonths);
    }

    function _calculateSkillCompatibility(string[] memory candidateSkills, string[] memory requiredSkills) internal pure returns (uint256) {
        if (requiredSkills.length == 0) return 100;
        
        uint256 matches = 0;
        for (uint256 i = 0; i < requiredSkills.length; i++) {
            for (uint256 j = 0; j < candidateSkills.length; j++) {
                if (keccak256(bytes(requiredSkills[i])) == keccak256(bytes(candidateSkills[j]))) {
                    matches++;
                    break;
                }
            }
        }
        
        return matches.mul(100).div(requiredSkills.length);
    }

    
    function _getBasicRecommendations(address candidate) internal view returns (uint256[] memory) {
        CandidateProfile memory profile = candidateProfiles[candidate];
        uint256[] memory recommendations = new uint256[](10); // Max 10 recommendations
        uint256 count = 0;
        
        // Search for active jobs and calculate match
        for (uint256 i = 1; i <= _jobIdCounter.current() && count < 10; i++) {
            if (jobPostings[i].isActive && block.timestamp <= jobPostings[i].deadline) {
                uint256 matchScore = _calculateBasicMatch(candidate, i);
                if (matchScore >= minimumMatchScore) {
                    recommendations[count] = i;
                    count++;
                }
            }
        }
        
        // Resize array
        uint256[] memory finalRecommendations = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            finalRecommendations[i] = recommendations[i];
        }
        
        return finalRecommendations;
    }

    // ========== ADMIN FUNCTIONS ==========
    
    function updateMarketplaceConfig(
        uint256 _platformFeePercentage,
        uint256 _jobPostingFee,
        uint256 _successfulHireFee,
        uint256 _minimumMatchScore
    ) external onlyRole(ADMIN_ROLE) {
        require(_platformFeePercentage <= 1000, "Fee too high"); // Max 10%
        
        platformFeePercentage = _platformFeePercentage;
        jobPostingFee = _jobPostingFee;
        successfulHireFee = _successfulHireFee;
        minimumMatchScore = _minimumMatchScore;
    }

    
    function setAIMatchingEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        aiMatchingEnabled = enabled;
    }

    
    function verifyEmployer(address employer) external onlyRole(ADMIN_ROLE) {
        require(employerProfiles[employer].employerAddress != address(0), "Employer not registered");
        employerProfiles[employer].isVerified = true;
        employerProfiles[employer].reputationScore = employerProfiles[employer].reputationScore.add(25);
    }

    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ========== QUERY FUNCTIONS ==========
    
    function getEmployerJobs(address employer) external view returns (uint256[] memory) {
        return employerJobs[employer];
    }

    
    function getCandidateApplications(address candidate) external view returns (uint256[] memory) {
        return candidateApplications[candidate];
    }

    
    function getJobApplications(uint256 jobId) external view returns (uint256[] memory) {
        return jobApplications[jobId];
    }

    
    function getJobsByCategory(JobCategory category) external view returns (uint256[] memory) {
        return categoryJobs[category];
    }

    
    function getJobsBySkill(string memory skill) external view returns (uint256[] memory) {
        return skillBasedJobs[skill];
    }

    
    function getMarketplaceStats() external view returns (
        uint256 _totalJobsPosted,
        uint256 _totalApplications,
        uint256 _successfulMatches,
        uint256 _totalEscrowAmount,
        uint256 activeJobs
    ) {
        uint256 active = 0;
        for (uint256 i = 1; i <= _jobIdCounter.current(); i++) {
            if (jobPostings[i].isActive && block.timestamp <= jobPostings[i].deadline) {
                active++;
            }
        }
        
        return (totalJobsPosted, totalApplications, successfulMatches, totalEscrowAmount, active);
    }

    
    function getJobMatch(uint256 jobId, address candidate) external view returns (JobMatch memory) {
        bytes32 matchKey = keccak256(abi.encodePacked(jobId, candidate));
        return jobMatches[matchKey];
    }

    
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    
    function batchPostJobs(bytes[] calldata jobDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        
        // Note: Simplified batch processing implementation
        results = new bool[](jobDatas.length);
        for (uint256 i = 0; i < jobDatas.length; i++) {
            // Process each job individually for now
            results[i] = true; // Placeholder success
        }
    }
    
    function cacheMatching(bytes32 key, bytes memory matchData, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.setCache(key, matchData, expiresAt);
    }
} 