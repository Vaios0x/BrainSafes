// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title ScholarshipManager
 * @notice Automated scholarship management for BrainSafes
 * @dev Handles applications, sponsor management, milestone tracking, and fund disbursement
 * @author BrainSafes Team
 */
contract ScholarshipManager is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // ========== ROLES ==========
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant EVALUATOR_ROLE = keccak256("EVALUATOR_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    bytes32 public constant SPONSOR_ROLE = keccak256("SPONSOR_ROLE");

    // ========== INTERFACES ==========
    /**
     * @dev Interface for EDU token operations
     */
    interface IEDUToken {
        function transfer(address to, uint256 amount) external returns (bool);
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
        function mint(address to, uint256 amount) external;
    }

    /**
     * @dev Interface for AI Oracle operations
     */
    interface IAIOracle {
        function evaluateScholarshipCandidate(
            address candidate, 
            uint256 scholarshipType, 
            bytes calldata candidateData
        ) external view returns (uint256 score, bool recommended);
        
        function predictAcademicSuccess(address student) external view returns (uint256 probability);
        function assessFinancialNeed(address student, bytes calldata financialData) external view returns (uint256 needScore);
    }

    /**
     * @dev Interface for BrainSafes core operations
     */
    interface IBrainSafesCore {
        function getUserProfile(address user) external view returns (
            string memory name,
            string memory email,
            string memory ipfsProfile,
            uint256 reputation,
            uint256 totalEarned,
            uint256 totalSpent,
            uint256 joinTimestamp,
            bool isActive,
            uint256[] memory achievements
        );
    }

    // ========== STRUCTURES ==========
    /**
     * @dev Structure for scholarship program details
     */
    struct ScholarshipProgram {
        uint256 id;
        string name;
        string description;
        address sponsor;
        uint256 totalFunding;
        uint256 remainingFunding;
        uint256 scholarshipAmount;
        uint256 maxRecipients;
        uint256 currentRecipients;
        uint256 applicationDeadline;
        uint256 disbursementStart;
        ScholarshipCriteria criteria;
        bool isActive;
        uint256 createdAt;
    }

    /**
     * @dev Structure for scholarship eligibility criteria
     */
    struct ScholarshipCriteria {
        uint256 minAge;
        uint256 maxAge;
        uint256 minGPA; // GPA * 100 (e.g., 3.5 = 350)
        uint256 minReputationScore;
        string[] requiredSkills;
        string[] eligibleCountries;
        uint256 maxAnnualIncome; // In EDU tokens
        bool requiresEssay;
        bool requiresRecommendation;
    }

    /**
     * @dev Structure for scholarship application details
     */
    struct ScholarshipApplication {
        uint256 id;
        uint256 programId;
        address applicant;
        string essay;
        string ipfsDocuments;
        uint256 submittedAt;
        ApplicationStatus status;
        uint256 aiScore;
        uint256 humanScore;
        uint256 finalScore;
        string evaluatorComments;
        uint256 evaluatedAt;
        bool aiRecommendation;
    }

    /**
     * @dev Structure for scholarship recipient details
     */
    struct ScholarshipRecipient {
        uint256 applicationId;
        address recipient;
        uint256 awardedAmount;
        uint256 awardedAt;
        uint256 disbursedAmount;
        uint256 milestonesPassed;
        uint256 totalMilestones;
        RecipientStatus status;
        uint256[] milestoneTimestamps;
    }

    /**
     * @dev Structure for milestone requirements
     */
    struct Milestone {
        string description;
        uint256 requiredScore;
        uint256 rewardPercentage; // Percentage of total to disburse
        bool isMandatory;
    }

    /**
     * @dev Structure for scholarship sponsor details
     */
    struct ScholarshipSponsor {
        address sponsorAddress;
        string name;
        string description;
        uint256 totalContributed;
        uint256 totalScholarshipsSponsored;
        uint256 joinedAt;
        bool isActive;
        uint256 reputationScore;
    }

    // ========== ENUMS ==========
    /**
     * @dev Application status types
     */
    enum ApplicationStatus {
        SUBMITTED,
        UNDER_REVIEW,
        AI_EVALUATED,
        HUMAN_REVIEWED,
        APPROVED,
        REJECTED,
        AWARDED
    }

    /**
     * @dev Recipient status types
     */
    enum RecipientStatus {
        ACTIVE,
        COMPLETED,
        SUSPENDED,
        TERMINATED
    }

    // ========== STATE VARIABLES ==========
    Counters.Counter private _programIdCounter;
    Counters.Counter private _applicationIdCounter;
    Counters.Counter private _recipientIdCounter;

    IEDUToken public eduToken;
    IAIOracle public aiOracle;
    IBrainSafesCore public brainSafesCore;

    mapping(uint256 => ScholarshipProgram) public scholarshipPrograms;
    mapping(uint256 => ScholarshipApplication) public applications;
    mapping(uint256 => ScholarshipRecipient) public recipients;
    mapping(address => ScholarshipSponsor) public sponsors;
    mapping(uint256 => Milestone[]) public programMilestones;
    
    // Relationship mappings
    mapping(address => uint256[]) public userApplications;
    mapping(uint256 => uint256[]) public programApplications;
    mapping(address => uint256[]) public userReceivedScholarships;
    mapping(address => uint256[]) public sponsorPrograms;

    // System configuration
    uint256 public constant AI_EVALUATION_WEIGHT = 60; // 60% AI weight
    uint256 public constant HUMAN_EVALUATION_WEIGHT = 40; // 40% human weight
    uint256 public constant MIN_APPLICATION_TIME = 1 days;
    uint256 public constant MAX_APPLICATION_TIME = 90 days;
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%

    uint256 public totalScholarshipsFunded;
    uint256 public totalAmountDisbursed;
    uint256 public totalActiveRecipients;
    bool public aiEvaluationEnabled = true;

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

    // ========== EVENTS ==========
    event ScholarshipProgramCreated(
        uint256 indexed programId, 
        address indexed sponsor, 
        string name, 
        uint256 totalFunding
    );
    
    event ApplicationSubmitted(
        uint256 indexed applicationId, 
        uint256 indexed programId, 
        address indexed applicant
    );
    
    event ApplicationEvaluated(
        uint256 indexed applicationId, 
        uint256 aiScore, 
        uint256 humanScore, 
        uint256 finalScore,
        bool approved
    );
    
    event ScholarshipAwarded(
        uint256 indexed recipientId, 
        address indexed recipient, 
        uint256 indexed programId, 
        uint256 amount
    );
    
    event MilestoneCompleted(
        uint256 indexed recipientId, 
        uint256 milestoneIndex, 
        uint256 disbursedAmount
    );
    
    event SponsorRegistered(address indexed sponsor, string name);
    event FundsDeposited(uint256 indexed programId, address indexed sponsor, uint256 amount);
    event EmergencyWithdrawal(uint256 indexed programId, uint256 amount, string reason);

    // ========== MODIFIERS ==========
    /**
     * @dev Ensures the caller is an active sponsor
     */
    modifier onlyActiveSponsor() {
        require(sponsors[msg.sender].isActive, "Not an active sponsor");
        _;
    }

    /**
     * @dev Ensures the program is active and within deadline
     */
    modifier onlyActiveProgram(uint256 programId) {
        require(scholarshipPrograms[programId].isActive, "Program not active");
        require(
            block.timestamp <= scholarshipPrograms[programId].applicationDeadline,
            "Application deadline has passed"
        );
        _;
    }

    /**
     * @dev Ensures the application exists
     */
    modifier onlyValidApplication(uint256 applicationId) {
        require(applications[applicationId].applicant != address(0), "Application does not exist");
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Initializes the contract with required token and oracle addresses
     * @param _eduToken Address of the EDU token contract
     * @param _aiOracle Address of the AI Oracle contract
     * @param _brainSafesCore Address of the BrainSafes core contract
     */
    constructor(address _eduToken, address _aiOracle, address _brainSafesCore) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(EVALUATOR_ROLE, msg.sender);
        
        eduToken = IEDUToken(_eduToken);
        aiOracle = IAIOracle(_aiOracle);
        brainSafesCore = IBrainSafesCore(_brainSafesCore);
    }

    // ========== SPONSOR MANAGEMENT FUNCTIONS ==========
    /**
     * @dev Register a new scholarship sponsor
     * @param name Name of the sponsoring organization
     * @param description Description of the sponsor's mission and goals
     */
    function registerSponsor(
        string memory name,
        string memory description
    ) external {
        require(!sponsors[msg.sender].isActive, "Already registered as sponsor");
        require(bytes(name).length > 0, "Name required");

        sponsors[msg.sender] = ScholarshipSponsor({
            sponsorAddress: msg.sender,
            name: name,
            description: description,
            totalContributed: 0,
            totalScholarshipsSponsored: 0,
            joinedAt: block.timestamp,
            isActive: true,
            reputationScore: 100
        });

        _grantRole(SPONSOR_ROLE, msg.sender);
        emit SponsorRegistered(msg.sender, name);
    }

    // ========== SCHOLARSHIP PROGRAM FUNCTIONS ==========
    /**
     * @dev Create a new scholarship program
     * @param name Name of the scholarship program
     * @param description Detailed description of the program
     * @param totalFunding Total amount of funding in EDU tokens
     * @param scholarshipAmount Amount per scholarship in EDU tokens
     * @param maxRecipients Maximum number of recipients
     * @param applicationPeriodDays Duration of application period in days
     * @param disbursementStartDelay Delay before first disbursement in days
     * @param criteria Eligibility criteria for the scholarship
     * @param milestones Array of program milestones
     * @return programId The ID of the created program
     */
    function createScholarshipProgram(
        string memory name,
        string memory description,
        uint256 totalFunding,
        uint256 scholarshipAmount,
        uint256 maxRecipients,
        uint256 applicationPeriodDays,
        uint256 disbursementStartDelay,
        ScholarshipCriteria memory criteria,
        Milestone[] memory milestones
    ) external onlyActiveSponsor nonReentrant returns (uint256) {
        require(bytes(name).length > 0, "Name required");
        require(totalFunding > 0, "Funding must be greater than 0");
        require(scholarshipAmount > 0, "Scholarship amount must be greater than 0");
        require(maxRecipients > 0, "Maximum recipients must be greater than 0");
        require(
            applicationPeriodDays >= 1 && applicationPeriodDays <= 365,
            "Invalid application period"
        );
        require(
            totalFunding >= scholarshipAmount.mul(maxRecipients),
            "Insufficient funding for all recipients"
        );

        // Transfer funds from sponsor
        require(
            eduToken.transferFrom(msg.sender, address(this), totalFunding),
            "Fund transfer failed"
        );

        _programIdCounter.increment();
        uint256 programId = _programIdCounter.current();

        scholarshipPrograms[programId] = ScholarshipProgram({
            id: programId,
            name: name,
            description: description,
            sponsor: msg.sender,
            totalFunding: totalFunding,
            remainingFunding: totalFunding,
            scholarshipAmount: scholarshipAmount,
            maxRecipients: maxRecipients,
            currentRecipients: 0,
            applicationDeadline: block.timestamp.add(applicationPeriodDays.mul(1 days)),
            disbursementStart: block.timestamp.add(disbursementStartDelay.mul(1 days)),
            criteria: criteria,
            isActive: true,
            createdAt: block.timestamp
        });

        // Add milestones
        for (uint256 i = 0; i < milestones.length; i++) {
            programMilestones[programId].push(milestones[i]);
        }

        sponsorPrograms[msg.sender].push(programId);
        sponsors[msg.sender].totalContributed = sponsors[msg.sender].totalContributed.add(totalFunding);
        sponsors[msg.sender].totalScholarshipsSponsored++;

        totalScholarshipsFunded = totalScholarshipsFunded.add(totalFunding);

        emit ScholarshipProgramCreated(programId, msg.sender, name, totalFunding);
        return programId;
    }

    /**
     * @dev Apply for a scholarship program
     * @param programId ID of the scholarship program
     * @param essay Applicant's essay or statement
     * @param ipfsDocuments IPFS hash containing supporting documents
     * @return applicationId The ID of the created application
     */
    function applyForScholarship(
        uint256 programId,
        string memory essay,
        string memory ipfsDocuments
    ) external onlyActiveProgram(programId) nonReentrant returns (uint256) {
        require(!_hasAppliedToProgram(msg.sender, programId), "Already applied to this program");
        
        ScholarshipProgram storage program = scholarshipPrograms[programId];
        require(
            program.currentRecipients < program.maxRecipients,
            "Program is full"
        );

        // Verify basic criteria
        require(_meetBasicCriteria(msg.sender, program.criteria), "Does not meet basic criteria");

        _applicationIdCounter.increment();
        uint256 applicationId = _applicationIdCounter.current();

        applications[applicationId] = ScholarshipApplication({
            id: applicationId,
            programId: programId,
            applicant: msg.sender,
            essay: essay,
            ipfsDocuments: ipfsDocuments,
            submittedAt: block.timestamp,
            status: ApplicationStatus.SUBMITTED,
            aiScore: 0,
            humanScore: 0,
            finalScore: 0,
            evaluatorComments: "",
            evaluatedAt: 0,
            aiRecommendation: false
        });

        userApplications[msg.sender].push(applicationId);
        programApplications[programId].push(applicationId);

        // Trigger automatic AI evaluation if enabled
        if (aiEvaluationEnabled) {
            _triggerAIEvaluation(applicationId);
        }

        emit ApplicationSubmitted(applicationId, programId, msg.sender);
        return applicationId;
    }

    /**
     * @dev Automatic AI evaluation
     */
    function _triggerAIEvaluation(uint256 applicationId) internal {
        ScholarshipApplication storage application = applications[applicationId];
        
        // Prepare candidate data for AI
        bytes memory candidateData = _prepareCandidateData(application.applicant);
        
        // Get AI evaluation
        (uint256 aiScore, bool aiRecommendation) = aiOracle.evaluateScholarshipCandidate(
            application.applicant,
            application.programId,
            candidateData
        );

        application.aiScore = aiScore;
        application.aiRecommendation = aiRecommendation;
        application.status = ApplicationStatus.AI_EVALUATED;

        // If AI recommends and score is high, auto-approve
        if (aiRecommendation && aiScore >= 80) {
            _autoApproveApplication(applicationId);
        }
    }

    /**
     * @dev Evaluate application by human evaluator
     * @param applicationId ID of the application to evaluate
     * @param humanScore Score assigned by human evaluator (0-100)
     * @param comments Evaluation comments and feedback
     * @param approved Whether the application is approved
     */
    function evaluateApplication(
        uint256 applicationId,
        uint256 humanScore,
        string memory comments,
        bool approved
    ) external onlyRole(EVALUATOR_ROLE) onlyValidApplication(applicationId) {
        require(humanScore <= 100, "Score must be 0-100");
        
        ScholarshipApplication storage application = applications[applicationId];
        require(
            application.status == ApplicationStatus.AI_EVALUATED || 
            application.status == ApplicationStatus.UNDER_REVIEW,
            "Invalid application status"
        );

        application.humanScore = humanScore;
        application.evaluatorComments = comments;
        application.evaluatedAt = block.timestamp;
        application.status = ApplicationStatus.HUMAN_REVIEWED;

        // Calculate final weighted score
        uint256 finalScore = application.aiScore.mul(AI_EVALUATION_WEIGHT).div(100)
            .add(humanScore.mul(HUMAN_EVALUATION_WEIGHT).div(100));
        
        application.finalScore = finalScore;

        if (approved) {
            _approveApplication(applicationId);
        } else {
            application.status = ApplicationStatus.REJECTED;
        }

        emit ApplicationEvaluated(applicationId, application.aiScore, humanScore, finalScore, approved);
    }

    /**
     * @dev Auto-approve application (by AI)
     */
    function _autoApproveApplication(uint256 applicationId) internal {
        applications[applicationId].status = ApplicationStatus.APPROVED;
        applications[applicationId].finalScore = applications[applicationId].aiScore;
        _awardScholarship(applicationId);
    }

    /**
     * @dev Manually approve application
     */
    function _approveApplication(uint256 applicationId) internal {
        applications[applicationId].status = ApplicationStatus.APPROVED;
        _awardScholarship(applicationId);
    }

    /**
     * @dev Award scholarship to an approved candidate
     */
    function _awardScholarship(uint256 applicationId) internal {
        ScholarshipApplication storage application = applications[applicationId];
        ScholarshipProgram storage program = scholarshipPrograms[application.programId];
        
        require(program.remainingFunding >= program.scholarshipAmount, "Insufficient funds");
        require(program.currentRecipients < program.maxRecipients, "Program is full");

        _recipientIdCounter.increment();
        uint256 recipientId = _recipientIdCounter.current();

        recipients[recipientId] = ScholarshipRecipient({
            applicationId: applicationId,
            recipient: application.applicant,
            awardedAmount: program.scholarshipAmount,
            awardedAt: block.timestamp,
            disbursedAmount: 0,
            milestonesPassed: 0,
            totalMilestones: programMilestones[application.programId].length,
            status: RecipientStatus.ACTIVE,
            milestoneTimestamps: new uint256[](0)
        });

        application.status = ApplicationStatus.AWARDED;
        program.remainingFunding = program.remainingFunding.sub(program.scholarshipAmount);
        program.currentRecipients++;
        totalActiveRecipients++;

        userReceivedScholarships[application.applicant].push(recipientId);

        emit ScholarshipAwarded(recipientId, application.applicant, application.programId, program.scholarshipAmount);

        // Disburse first payment if no milestones or disburse according to initial milestone
        if (programMilestones[application.programId].length == 0) {
            _disburseFunds(recipientId, program.scholarshipAmount);
        } else {
            // Disburse initial percentage (first milestone if automatic)
            Milestone storage firstMilestone = programMilestones[application.programId][0];
            uint256 initialAmount = program.scholarshipAmount.mul(firstMilestone.rewardPercentage).div(100);
            _disburseFunds(recipientId, initialAmount);
        }
    }

    /**
     * @dev Complete milestone and disburse funds
     * @param recipientId ID of the scholarship recipient
     * @param milestoneIndex Index of the milestone to complete
     * @param achievedScore Score achieved for the milestone
     * @param evidenceIPFS IPFS hash containing milestone completion evidence
     */
    function completeMilestone(
        uint256 recipientId,
        uint256 milestoneIndex,
        uint256 achievedScore,
        string memory evidenceIPFS
    ) external onlyRole(EVALUATOR_ROLE) {
        ScholarshipRecipient storage recipient = recipients[recipientId];
        require(recipient.status == RecipientStatus.ACTIVE, "Recipient not active");
        require(milestoneIndex == recipient.milestonesPassed, "Milestone out of order");
        
        ScholarshipApplication storage application = applications[recipient.applicationId];
        Milestone storage milestone = programMilestones[application.programId][milestoneIndex];
        
        require(achievedScore >= milestone.requiredScore, "Insufficient score for milestone");

        recipient.milestonesPassed++;
        recipient.milestoneTimestamps.push(block.timestamp);

        // Calculate amount to disburse
        uint256 disbursementAmount = recipient.awardedAmount.mul(milestone.rewardPercentage).div(100);
        _disburseFunds(recipientId, disbursementAmount);

        // If completed all milestones, mark as completed
        if (recipient.milestonesPassed >= recipient.totalMilestones) {
            recipient.status = RecipientStatus.COMPLETED;
            totalActiveRecipients--;
        }

        emit MilestoneCompleted(recipientId, milestoneIndex, disbursementAmount);
    }

    /**
     * @dev Disburse funds to recipient
     */
    function _disburseFunds(uint256 recipientId, uint256 amount) internal {
        ScholarshipRecipient storage recipient = recipients[recipientId];
        
        // Calculate platform fee
        uint256 platformFee = amount.mul(PLATFORM_FEE_PERCENTAGE).div(10000);
        uint256 disbursementAmount = amount.sub(platformFee);

        require(
            eduToken.transfer(recipient.recipient, disbursementAmount),
            "Transfer failed"
        );

        recipient.disbursedAmount = recipient.disbursedAmount.add(disbursementAmount);
        totalAmountDisbursed = totalAmountDisbursed.add(disbursementAmount);
    }

    // ========== CRITERIA EVALUATION FUNCTIONS ==========
    /**
     * @dev Verify basic criteria
     */
    function _meetBasicCriteria(address applicant, ScholarshipCriteria memory criteria) internal view returns (bool) {
        // Get user profile from BrainSafes
        (,,,uint256 reputation,,,,bool isActive,) = brainSafesCore.getUserProfile(applicant);
        
        if (!isActive) return false;
        if (reputation < criteria.minReputationScore) return false;
        
        // Here we could add more verifications like age, country, etc.
        // For simplicity, we assume other criteria are met
        
        return true;
    }

    /**
     * @dev Prepare candidate data for AI evaluation
     */
    function _prepareCandidateData(address candidate) internal view returns (bytes memory) {
        (,,,uint256 reputation,uint256 totalEarned,uint256 totalSpent,uint256 joinTimestamp,,uint256[] memory achievements) = brainSafesCore.getUserProfile(candidate);
        
        // Encode relevant data for AI
        return abi.encode(
            reputation,
            totalEarned,
            totalSpent,
            joinTimestamp,
            achievements.length,
            block.timestamp
        );
    }

    /**
     * @dev Check if user has already applied to program
     */
    function _hasAppliedToProgram(address user, uint256 programId) internal view returns (bool) {
        uint256[] memory userApps = userApplications[user];
        for (uint256 i = 0; i < userApps.length; i++) {
            if (applications[userApps[i]].programId == programId) {
                return true;
            }
        }
        return false;
    }

    // ========== ADMINISTRATION FUNCTIONS ==========
    /**
     * @dev Enable/disable AI evaluation
     */
    function setAIEvaluationEnabled(bool enabled) external onlyRole(ADMIN_ROLE) {
        aiEvaluationEnabled = enabled;
    }

    /**
     * @dev Update AI oracle address
     */
    function updateAIOracle(address newAIOracle) external onlyRole(ADMIN_ROLE) {
        require(newAIOracle != address(0), "Invalid address");
        aiOracle = IAIOracle(newAIOracle);
    }

    /**
     * @dev Emergency withdrawal of funds
     * @param programId ID of the scholarship program
     * @param amount Amount to withdraw
     * @param reason Reason for emergency withdrawal
     */
    function emergencyWithdraw(
        uint256 programId,
        uint256 amount,
        string memory reason
    ) external onlyRole(ADMIN_ROLE) {
        ScholarshipProgram storage program = scholarshipPrograms[programId];
        require(amount <= program.remainingFunding, "Amount exceeds available funds");
        
        program.remainingFunding = program.remainingFunding.sub(amount);
        eduToken.transfer(program.sponsor, amount);
        
        emit EmergencyWithdrawal(programId, amount, reason);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ========== PUBLIC EVALUATION FUNCTIONS ==========
    /**
     * @dev Scholarship eligibility evaluation with AI (called from BrainSafes)
     */
    function evaluateScholarshipAI(address student) external view returns (uint256 score, bool eligible) {
        bytes memory studentData = _prepareCandidateData(student);
        
        // AI evaluation simulation (in real implementation would be an oracle call)
        (,,,uint256 reputation,,,,,) = brainSafesCore.getUserProfile(student);
        
        score = reputation; // Simplified for the example
        eligible = score >= 70; // Minimum threshold of 70
        
        return (score, eligible);
    }

    // ========== VIEW FUNCTIONS ==========
    /**
     * @dev Get scholarship program information
     * @param programId ID of the scholarship program
     * @return ScholarshipProgram structure containing program details
     */
    function getScholarshipProgram(uint256 programId) external view returns (ScholarshipProgram memory) {
        return scholarshipPrograms[programId];
    }

    /**
     * @dev Get program milestones
     * @param programId ID of the scholarship program
     * @return Array of program milestones
     */
    function getProgramMilestones(uint256 programId) external view returns (Milestone[] memory) {
        return programMilestones[programId];
    }

    /**
     * @dev Get user applications
     * @param user Address of the user
     * @return Array of application IDs
     */
    function getUserApplications(address user) external view returns (uint256[] memory) {
        return userApplications[user];
    }

    /**
     * @dev Get scholarships received by a user
     * @param user Address of the user
     * @return Array of recipient IDs
     */
    function getUserScholarships(address user) external view returns (uint256[] memory) {
        return userReceivedScholarships[user];
    }

    /**
     * @dev Get global statistics
     * @return totalPrograms Total number of scholarship programs
     * @return totalApplications Total number of applications
     * @return totalRecipients Total number of recipients
     * @return totalFunded Total amount funded
     * @return totalDisbursed Total amount disbursed
     * @return activeRecipients Number of active recipients
     */
    function getGlobalStats() external view returns (
        uint256 totalPrograms,
        uint256 totalApplications,
        uint256 totalRecipients,
        uint256 totalFunded,
        uint256 totalDisbursed,
        uint256 activeRecipients
    ) {
        return (
            _programIdCounter.current(),
            _applicationIdCounter.current(),
            _recipientIdCounter.current(),
            totalScholarshipsFunded,
            totalAmountDisbursed,
            totalActiveRecipients
        );
    }

    /**
     * @dev Get sponsor information
     * @param sponsor Address of the sponsor
     * @return ScholarshipSponsor structure containing sponsor details
     */
    function getSponsorInfo(address sponsor) external view returns (ScholarshipSponsor memory) {
        return sponsors[sponsor];
    }

    /**
     * @dev Get programs from a sponsor
     * @param sponsor Address of the sponsor
     * @return Array of program IDs
     */
    function getSponsorPrograms(address sponsor) external view returns (uint256[] memory) {
        return sponsorPrograms[sponsor];
    }

    /**
     * @dev Setea el procesador batch
     */
    function setBatchProcessor(address _processor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_processor != address(0), "Invalid address");
        batchProcessor = AdvancedBatchProcessor(_processor);
        emit BatchProcessorSet(_processor);
    }
    /**
     * @dev Setea el cache distribuido
     */
    function setDistributedCache(address _cache) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_cache != address(0), "Invalid address");
        distributedCache = DistributedCacheV2(_cache);
        emit DistributedCacheSet(_cache);
    }
    /**
     * @dev Ejemplo: Batch de aplicaciones a becas
     */
    function batchApplyScholarships(bytes[] calldata appDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        AdvancedBatchProcessor.Call[] memory calls = new AdvancedBatchProcessor.Call[](appDatas.length);
        for (uint256 i = 0; i < appDatas.length; i++) {
            calls[i] = AdvancedBatchProcessor.Call({
                target: address(this),
                value: 0,
                data: abi.encodeWithSignature("applyForScholarship(uint256,string,string)", 0, "", "") // Placeholder for programId, essay, ipfsDocuments
            });
        }
        AdvancedBatchProcessor.CallResult[] memory callResults = batchProcessor.executeBatch(calls, false);
        results = new bool[](appDatas.length);
        for (uint256 i = 0; i < callResults.length; i++) {
            results[i] = callResults[i].success;
        }
    }
    /**
     * @dev Ejemplo: Guardar evaluación IA en cache distribuido
     */
    function cacheEvaluation(bytes32 key, bytes memory evalData, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.set(key, evalData, expiresAt);
    }
} 