// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/// @title BrainSafes - Sistema centralizado de gestión de permisos y roles
/// @author Equipo BrainSafes
/// @notice Este contrato gestiona los roles admin, issuer y validator on-chain
/// @dev Ejemplo de documentación NatSpec para funciones principales
contract BrainSafes is AccessControl, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;

    // ========== ROLES AND PERMISSIONS ==========
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant ORGANIZATION_ROLE = keccak256("ORGANIZATION_ROLE");
    bytes32 public constant AI_ORACLE_ROLE = keccak256("AI_ORACLE_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

    // ========== CONTRACT INTERFACES ==========
    interface IEDUToken {
        function mint(address to, uint256 amount) external;
        function burn(address from, uint256 amount) external;
        function transfer(address to, uint256 amount) external returns (bool);
        function transferFrom(address from, address to, uint256 amount) external returns (bool);
        function balanceOf(address account) external view returns (uint256);
    }

    interface ICourseNFT {
        function mintCourse(address to, string memory uri, uint256 price) external returns (uint256);
        function getCourseInfo(uint256 tokenId) external view returns (address instructor, uint256 price, bool active);
    }

    interface ICertificateNFT {
        function mintCertificate(address to, uint256 courseId, string memory uri, uint256 score) external returns (uint256);
    }

    interface IScholarshipManager {
        function applyForScholarship(address student, uint256 amount, string memory reason) external;
        function evaluateScholarshipAI(address student) external view returns (uint256 score, bool eligible);
    }

    interface IAIOracle {
        function predictStudentPerformance(address student, uint256 courseId) external view returns (uint256 prediction);
        function generateLearningPath(address student) external view returns (uint256[] memory courseIds);
        function detectFraud(address user, bytes32 activityHash) external view returns (bool isFraud);
        function batchPredictPerformance(address[] calldata students, uint256[] calldata courseIds) external view returns (uint256[] memory);
    }

    // ========== DATA STRUCTURES ==========
    struct UserProfile {
        string name;
        string email;
        string ipfsProfile;
        uint256 reputation;
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 joinTimestamp;
        bool isActive;
        uint256[] achievements;
    }

    struct Course {
        uint256 id;
        address instructor;
        string title;
        string description;
        string ipfsContent;
        uint256 price;
        uint256 duration; // in days
        uint256 maxStudents;
        uint256 currentStudents;
        uint256 totalEarnings;
        bool isActive;
        string[] skills;
        uint256 difficulty; // 1-5
        uint256 createdAt;
    }

    struct Enrollment {
        uint256 courseId;
        address student;
        uint256 enrolledAt;
        uint256 progress; // 0-100
        uint256 score;
        bool completed;
        bool certificateIssued;
    }

    struct Achievement {
        uint256 id;
        string name;
        string description;
        string ipfsMetadata;
        uint256 requiredPoints;
        uint256 reward;
        bool isActive;
    }

    struct AIInsight {
        address user;
        uint256 performancePrediction;
        uint256[] recommendedCourses;
        string learningStyle;
        uint256 riskScore;
        uint256 lastUpdated;
    }

    // ========== STATE VARIABLES ==========
    IEDUToken public immutable eduToken;
    ICourseNFT public immutable courseNFT;
    ICertificateNFT public immutable certificateNFT;
    IScholarshipManager public immutable scholarshipManager;
    IAIOracle public immutable aiOracle;

    // System configuration
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 250; // 2.5%
    uint256 public constant INSTRUCTOR_REWARD_PERCENTAGE = 7500; // 75%
    uint256 public constant STUDENT_REWARD_PERCENTAGE = 500; // 5%
    uint256 public constant MINIMUM_STAKE_AMOUNT = 100 * 10**18; // 100 EDU tokens
    uint256 public constant MAX_COURSES_PER_INSTRUCTOR = 50;

    // ========== EVENTS ==========
    event UserRegistered(address indexed user, string name, uint256 timestamp);
    event CourseCreated(uint256 indexed courseId, address indexed instructor, string title, uint256 price);
    event StudentEnrolled(uint256 indexed courseId, address indexed student, uint256 timestamp);
    event CourseCompleted(uint256 indexed courseId, address indexed student, uint256 score, bool certificateIssued);
    event RewardDistributed(address indexed recipient, uint256 amount, string reason);
    event AchievementUnlocked(address indexed user, uint256 indexed achievementId, uint256 reward);
    event AIInsightUpdated(address indexed user, uint256 performancePrediction);
    event EmergencyPaused(address indexed admin, string reason);
    event PlatformConfigUpdated(string parameter, uint256 newValue);

    // ========== MODIFIERS ==========
    modifier onlyValidUser(address user) {
        require(userProfiles[user].isActive, "User not registered or inactive");
        _;
    }

    modifier onlyActiveCourse(uint256 courseId) {
        require(courses[courseId].isActive, "Course not active");
        _;
    }

    modifier onlyInstructor(uint256 courseId) {
        require(courses[courseId].instructor == msg.sender, "Only the instructor can perform this action");
        _;
    }

    modifier onlyEnrolledStudent(uint256 courseId) {
        require(hasEnrolled[msg.sender][courseId], "You are not enrolled in this course");
        _;
    }

    modifier aiEnabled() {
        require(aiIntegrationEnabled, "AI integration disabled");
        _;
    }

    // ========== CONSTRUCTOR ==========
    /**
     * @dev Contract constructor - immutable version
     * @param _eduToken Address of EDU token contract
     * @param _courseNFT Address of Course NFT contract
     * @param _certificateNFT Address of Certificate NFT contract
     * @param _scholarshipManager Address of Scholarship Manager contract
     * @param _aiOracle Address of AI Oracle contract
     */
    constructor(
        address _eduToken,
        address _courseNFT,
        address _certificateNFT,
        address _scholarshipManager,
        address _aiOracle
    ) {
        require(_eduToken != address(0), "Invalid EDU token address");
        require(_courseNFT != address(0), "Invalid Course NFT address");
        require(_certificateNFT != address(0), "Invalid Certificate NFT address");
        require(_scholarshipManager != address(0), "Invalid Scholarship Manager address");
        require(_aiOracle != address(0), "Invalid AI Oracle address");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        eduToken = IEDUToken(_eduToken);
        courseNFT = ICourseNFT(_courseNFT);
        certificateNFT = ICertificateNFT(_certificateNFT);
        scholarshipManager = IScholarshipManager(_scholarshipManager);
        aiOracle = IAIOracle(_aiOracle);
    }

    // ========== CORE FUNCTIONS ==========
    // All core functions from BrainSafesUpgradeable.sol should be included here
    // but marked as immutable (remove virtual keywords, etc.)
    // The functionality remains the same but without upgrade capability

    // Add remaining functions...

    // ========== REGISTRATION FUNCTIONS ==========
    /**
     * @dev Registers a new user on the platform
     * @param _name The name of the user.
     * @param _email The email address of the user.
     * @param _ipfsProfile The IPFS hash of the user's profile.
     */
    function registerUser(
        string memory _name,
        string memory _email,
        string memory _ipfsProfile
    ) external whenNotPaused {
        require(!userProfiles[msg.sender].isActive, "User already registered");
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_email).length > 0, "Email required");

        userProfiles[msg.sender] = UserProfile({
            name: _name,
            email: _email,
            ipfsProfile: _ipfsProfile,
            reputation: 100, // Initial reputation
            totalEarned: 0,
            totalSpent: 0,
            joinTimestamp: block.timestamp,
            isActive: true,
            achievements: new uint256[](0)
        });

        // Registration reward
        eduToken.mint(msg.sender, 50 * 10**18); // 50 EDU tokens

        emit UserRegistered(msg.sender, _name, block.timestamp);
    }

    /**
     * @dev Registers an instructor
     * @param instructor The address of the instructor to register.
     */
    function registerInstructor(address instructor) external onlyRole(ADMIN_ROLE) {
        require(userProfiles[instructor].isActive, "User must be registered first");
        _grantRole(INSTRUCTOR_ROLE, instructor);
        userProfiles[instructor].reputation += 50; // Bonus for being an instructor
    }

    /**
     * @dev Registers an organization
     * @param organization The address of the organization to register.
     */
    function registerOrganization(address organization) external onlyRole(ADMIN_ROLE) {
        require(userProfiles[organization].isActive, "User must be registered first");
        _grantRole(ORGANIZATION_ROLE, organization);
    }

    // ========== COURSE FUNCTIONS ==========
    /**
     * @dev Creates a new course
     * @param _title The title of the course.
     * @param _description The description of the course.
     * @param _ipfsContent The IPFS hash of the course content.
     * @param _price The price of the course.
     * @param _duration The duration of the course in days.
     * @param _maxStudents The maximum number of students for the course.
     * @param _skills An array of skills associated with the course.
     * @param _difficulty The difficulty level of the course (1-5).
     * @return The ID of the created course.
     */
    function createCourse(
        string memory _title,
        string memory _description,
        string memory _ipfsContent,
        uint256 _price,
        uint256 _duration,
        uint256 _maxStudents,
        string[] memory _skills,
        uint256 _difficulty
    ) external onlyRole(INSTRUCTOR_ROLE) whenNotPaused returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_price > 0, "Price must be greater than 0");
        require(_difficulty >= 1 && _difficulty <= 5, "Difficulty must be 1-5");
        require(userCourses[msg.sender].length < MAX_COURSES_PER_INSTRUCTOR, "Course limit reached");

        _courseIdCounter.increment();
        uint256 courseId = _courseIdCounter.current();

        courses[courseId] = Course({
            id: courseId,
            instructor: msg.sender,
            title: _title,
            description: _description,
            ipfsContent: _ipfsContent,
            price: _price,
            duration: _duration,
            maxStudents: _maxStudents,
            currentStudents: 0,
            totalEarnings: 0,
            isActive: true,
            skills: _skills,
            difficulty: _difficulty,
            createdAt: block.timestamp
        });

        userCourses[msg.sender].push(courseId);

        // Mint course NFT
        courseNFT.mintCourse(msg.sender, _ipfsContent, _price);

        emit CourseCreated(courseId, msg.sender, _title, _price);
        return courseId;
    }

    /**
     * @dev Enroll in a course
     * @param courseId The ID of the course to enroll in.
     */
    function enrollInCourse(uint256 courseId) external payable onlyValidUser(msg.sender) onlyActiveCourse(courseId) whenNotPaused {
        Course storage course = courses[courseId];
        require(!hasEnrolled[msg.sender][courseId], "You are already enrolled in this course");
        require(course.currentStudents < course.maxStudents, "Course is full");
        require(eduToken.balanceOf(msg.sender) >= course.price, "Insufficient funds");

        // Transfer tokens
        eduToken.transferFrom(msg.sender, address(this), course.price);

        // Create enrollment
        _enrollmentIdCounter.increment();
        uint256 enrollmentId = _enrollmentIdCounter.current();

        enrollments[enrollmentId] = Enrollment({
            courseId: courseId,
            student: msg.sender,
            enrolledAt: block.timestamp,
            progress: 0,
            score: 0,
            completed: false,
            certificateIssued: false
        });

        hasEnrolled[msg.sender][courseId] = true;
        course.currentStudents++;
        courseStudents[courseId].push(msg.sender);
        userProfiles[msg.sender].totalSpent += course.price;

        // Distribute payments
        _distributePayments(courseId, course.price);

        // Update AI insights
        if (aiIntegrationEnabled) {
            _updateAIInsights(msg.sender);
        }

        emit StudentEnrolled(courseId, msg.sender, block.timestamp);
    }

    /**
     * @dev Complete a course
     * @param courseId The ID of the course to complete.
     * @param score The score achieved by the student.
     * @param proofOfCompletion A proof of completion (e.g., hash of a document).
     */
    function completeCourse(
        uint256 courseId,
        uint256 score,
        bytes32 proofOfCompletion
    ) external onlyEnrolledStudent(courseId) whenNotPaused {
        require(score >= 0 && score <= 100, "Score must be 0-100");
        
        // Find enrollment
        uint256 enrollmentId = _findEnrollmentId(courseId, msg.sender);
        Enrollment storage enrollment = enrollments[enrollmentId];
        require(!enrollment.completed, "Course already completed");

        // Validate proof of completion (simulated)
        require(proofOfCompletion != bytes32(0), "Proof of completion required");

        enrollment.completed = true;
        enrollment.score = score;
        enrollment.progress = 100;

        Course storage course = courses[courseId];
        
        // Completion rewards
        uint256 reward = _calculateCompletionReward(course.price, score);
        if (reward > 0) {
            eduToken.mint(msg.sender, reward);
            userProfiles[msg.sender].totalEarned += reward;
        }

        // Instructor reward
        uint256 instructorBonus = course.price * INSTRUCTOR_REWARD_PERCENTAGE / 10000;
        eduToken.mint(course.instructor, instructorBonus);
        userProfiles[course.instructor].totalEarned += instructorBonus;

        // Issue NFT certificate if score is sufficient
        bool certificateIssued = false;
        if (score >= 70) {
            certificateNFT.mintCertificate(msg.sender, courseId, course.ipfsContent, score);
            enrollment.certificateIssued = true;
            certificateIssued = true;
            
            // Certification bonus
            eduToken.mint(msg.sender, 25 * 10**18);
        }

        // Update reputation
        userProfiles[msg.sender].reputation += score / 10;

        // Check achievements
        _checkAchievements(msg.sender);

        emit CourseCompleted(courseId, msg.sender, score, certificateIssued);
    }

    // ========== AI FUNCTIONS ==========
    /**
     * @dev Predict student performance using AI
     * @param student The address of the student.
     * @param courseId The ID of the course.
     * @return The predicted performance score.
     */
    function predictStudentPerformance(address student, uint256 courseId) public view returns (uint256) {
        require(aiIntegrationEnabled, "AI integration disabled");
        return aiOracle.predictStudentPerformance(student, courseId);
    }

    /**
     * @dev Get personalized learning path with AI
     * @param student The address of the student.
     * @return An array of course IDs recommended for the student.
     */
    function getPersonalizedLearningPath(address student) public view returns (uint256[] memory) {
        require(aiIntegrationEnabled, "AI integration disabled");
        return aiOracle.generateLearningPath(student);
    }

    /**
     * @dev Detect fraudulent activity
     * @param user The address of the user.
     * @param activityHash A hash of the activity to detect fraud for.
     * @return True if the activity is fraudulent, false otherwise.
     */
    function detectFraudulentActivity(address user, bytes32 activityHash) public view returns (bool) {
        require(aiIntegrationEnabled, "AI integration disabled");
        return aiOracle.detectFraud(user, activityHash);
    }

    /**
     * @dev Batch predict student performance
     * @param students An array of student addresses.
     * @param courseIds An array of course IDs.
     * @return An array of predicted performance scores.
     */
    function batchPredictPerformance(
        address[] calldata students,
        uint256[] calldata courseIds
    ) external view returns (uint256[] memory) {
        require(aiIntegrationEnabled, "AI integration disabled");
        return aiOracle.batchPredictPerformance(students, courseIds);
    }

    /**
     * @dev Update AI insights for a user
     * @param user The address of the user.
     */
    function _updateAIInsights(address user) internal aiEnabled {
        uint256 prediction = aiOracle.predictStudentPerformance(user, 0); // General prediction
        uint256[] memory recommendations = aiOracle.generateLearningPath(user);
        
        aiInsights[user] = AIInsight({
            user: user,
            performancePrediction: prediction,
            recommendedCourses: recommendations,
            learningStyle: "adaptive", // Could be determined with AI
            riskScore: prediction < 50 ? 1 : 0, // High risk if prediction < 50%
            lastUpdated: block.timestamp
        });

        emit AIInsightUpdated(user, prediction);
    }

    // ========== SCHOLARSHIP FUNCTIONS ==========
    /**
     * @dev Apply for a scholarship automatically
     * @param amount The amount of scholarship to apply for.
     * @param reason A reason for the scholarship application.
     */
    function applyForScholarship(uint256 amount, string memory reason) external onlyValidUser(msg.sender) {
        scholarshipManager.applyForScholarship(msg.sender, amount, reason);
    }

    /**
     * @dev Evaluate scholarship eligibility with AI
     * @param student The address of the student to evaluate.
     * @return The calculated score and eligibility status.
     */
    function evaluateScholarshipEligibility(address student) external view returns (uint256 score, bool eligible) {
        return scholarshipManager.evaluateScholarshipAI(student);
    }

    // ========== ACHIEVEMENT FUNCTIONS ==========
    /**
     * @dev Create a new achievement
     * @param _name The name of the achievement.
     * @param _description A description of the achievement.
     * @param _ipfsMetadata The IPFS hash of the achievement metadata.
     * @param _requiredPoints The reputation points required to unlock the achievement.
     * @param _reward The reward amount in EDU tokens.
     */
    function createAchievement(
        string memory _name,
        string memory _description,
        string memory _ipfsMetadata,
        uint256 _requiredPoints,
        uint256 _reward
    ) external onlyRole(ADMIN_ROLE) {
        _achievementIdCounter.increment();
        uint256 achievementId = _achievementIdCounter.current();

        achievements[achievementId] = Achievement({
            id: achievementId,
            name: _name,
            description: _description,
            ipfsMetadata: _ipfsMetadata,
            requiredPoints: _requiredPoints,
            reward: _reward,
            isActive: true
        });
    }

    /**
     * @dev Check and award achievements
     * @param user The address of the user to check achievements for.
     */
    function _checkAchievements(address user) internal {
        UserProfile storage profile = userProfiles[user];
        
        // Check all active achievements
        for (uint256 i = 1; i <= _achievementIdCounter.current(); i++) {
            Achievement storage achievement = achievements[i];
            if (!achievement.isActive) continue;
            
            // Check if user already has this achievement
            bool hasAchievement = false;
            for (uint256 j = 0; j < profile.achievements.length; j++) {
                if (profile.achievements[j] == i) {
                    hasAchievement = true;
                    break;
                }
            }
            
            if (!hasAchievement && profile.reputation >= achievement.requiredPoints) {
                profile.achievements.push(i);
                if (achievement.reward > 0) {
                    eduToken.mint(user, achievement.reward);
                    profile.totalEarned += achievement.reward;
                }
                emit AchievementUnlocked(user, i, achievement.reward);
            }
        }
    }

    // ========== HELPER FUNCTIONS ==========
    /**
     * @dev Calculate course completion reward
     * @param coursePrice The price of the course.
     * @param score The score achieved by the student.
     * @return The calculated reward amount.
     */
    function _calculateCompletionReward(uint256 coursePrice, uint256 score) internal pure returns (uint256) {
        if (score < 60) return 0;
        if (score < 80) return coursePrice * 5 / 100; // 5% of price
        if (score < 95) return coursePrice * 10 / 100; // 10% of price
        return coursePrice * 15 / 100; // 15% of price for excellence
    }

    /**
     * @dev Distribute payments among stakeholders
     * @param courseId The ID of the course.
     * @param amount The total amount to distribute.
     */
    function _distributePayments(uint256 courseId, uint256 amount) internal {
        Course storage course = courses[courseId];
        
        // Platform fee
        uint256 platformFee = amount * PLATFORM_FEE_PERCENTAGE / 10000;
        
        // Payment to instructor
        uint256 instructorPayment = amount - platformFee;
        eduToken.transfer(course.instructor, instructorPayment);
        
        course.totalEarnings += instructorPayment;
        userProfiles[course.instructor].totalEarned += instructorPayment;

        emit RewardDistributed(course.instructor, instructorPayment, "Course enrollment");
    }

    /**
     * @dev Find enrollment ID
     * @param courseId The ID of the course.
     * @param student The address of the student.
     * @return The ID of the enrollment.
     */
    function _findEnrollmentId(uint256 courseId, address student) internal view returns (uint256) {
        for (uint256 i = 1; i <= _enrollmentIdCounter.current(); i++) {
            if (enrollments[i].courseId == courseId && enrollments[i].student == student) {
                return i;
            }
        }
        revert("Enrollment not found");
    }

    // ========== ADMINISTRATION FUNCTIONS ==========
    /**
     * @dev Update platform configuration
     * @param _platformFeePercentage The new platform fee percentage (0-1000).
     * @param _instructorRewardPercentage The new instructor reward percentage (0-10000).
     * @param _studentRewardPercentage The new student reward percentage (0-1000).
     * @param _minimumStakeAmount The new minimum stake amount in EDU tokens.
     * @param _maxCoursesPerInstructor The new maximum courses per instructor.
     */
    function updatePlatformConfig(
        uint256 _platformFeePercentage,
        uint256 _instructorRewardPercentage,
        uint256 _studentRewardPercentage,
        uint256 _minimumStakeAmount,
        uint256 _maxCoursesPerInstructor
    ) external onlyRole(ADMIN_ROLE) {
        require(_platformFeePercentage <= 1000, "Platform fee too high"); // Max 10%
        
        PLATFORM_FEE_PERCENTAGE = _platformFeePercentage;
        INSTRUCTOR_REWARD_PERCENTAGE = _instructorRewardPercentage;
        STUDENT_REWARD_PERCENTAGE = _studentRewardPercentage;
        MINIMUM_STAKE_AMOUNT = _minimumStakeAmount;
        MAX_COURSES_PER_INSTRUCTOR = _maxCoursesPerInstructor;

        emit PlatformConfigUpdated("platform_config", block.timestamp);
    }

    /**
     * @dev Emergency pause/unpause contracts
     * @param reason The reason for the emergency pause.
     */
    function emergencyPause(string memory reason) external onlyRole(ADMIN_ROLE) {
        _pause();
        emit EmergencyPaused(msg.sender, reason);
    }

    function emergencyUnpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Enable/disable AI integration
     */
    function toggleAIIntegration() external onlyRole(ADMIN_ROLE) {
        aiIntegrationEnabled = !aiIntegrationEnabled;
    }

    // ========== VIEW FUNCTIONS ==========
    /**
     * @dev Get user information
     * @param user The address of the user.
     * @return The user's profile information.
     */
    function getUserProfile(address user) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @dev Get user courses
     * @param user The address of the user.
     * @return An array of course IDs the user is enrolled in.
     */
    function getUserCourses(address user) external view returns (uint256[] memory) {
        return userCourses[user];
    }

    /**
     * @dev Get course students
     * @param courseId The ID of the course.
     * @return An array of student addresses enrolled in the course.
     */
    function getCourseStudents(uint256 courseId) external view returns (address[] memory) {
        return courseStudents[courseId];
    }

    /**
     * @dev Get user AI insights
     * @param user The address of the user.
     * @return The user's AI insights.
     */
    function getAIInsights(address user) external view returns (AIInsight memory) {
        return aiInsights[user];
    }

    /**
     * @dev Get platform statistics
     * @return The total number of courses, enrollments, achievements, and users.
     */
    function getPlatformStats() external view returns (
        uint256 totalCourses,
        uint256 totalEnrollments,
        uint256 totalAchievements,
        uint256 totalUsers
    ) {
        return (
            _courseIdCounter.current(),
            _enrollmentIdCounter.current(),
            _achievementIdCounter.current(),
            0 // Could keep a user counter
        );
    }

    // ========== UPGRADE FUNCTIONS ==========
    /**
     * @dev Update external contract address
     * @param contractName The name of the contract to update.
     * @param newAddress The new address for the contract.
     */
    function updateContractAddress(string memory contractName, address newAddress) external onlyRole(ADMIN_ROLE) {
        require(newAddress != address(0), "Invalid address");
        
        if (keccak256(bytes(contractName)) == keccak256(bytes("eduToken"))) {
            eduToken = IEDUToken(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("courseNFT"))) {
            courseNFT = ICourseNFT(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("certificateNFT"))) {
            certificateNFT = ICertificateNFT(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("scholarshipManager"))) {
            scholarshipManager = IScholarshipManager(newAddress);
        } else if (keccak256(bytes(contractName)) == keccak256(bytes("aiOracle"))) {
            aiOracle = IAIOracle(newAddress);
        } else {
            revert("Contract not recognized");
        }
    }

    // Nuevos módulos de optimización
    AdvancedBatchProcessor public batchProcessor;
    DistributedCacheV2 public distributedCache;

    event BatchProcessorSet(address indexed processor);
    event DistributedCacheSet(address indexed cache);

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
     * @dev Ejemplo: Batch de registro de usuarios
     */
    function batchRegisterUsers(bytes[] calldata userDatas) external returns (bool[] memory results) {
        require(address(batchProcessor) != address(0), "BatchProcessor not set");
        AdvancedBatchProcessor.Call[] memory calls = new AdvancedBatchProcessor.Call[](userDatas.length);
        for (uint256 i = 0; i < userDatas.length; i++) {
            calls[i] = AdvancedBatchProcessor.Call({
                target: address(this),
                value: 0,
                data: abi.encodeWithSignature("registerUser(bytes)", userDatas[i])
            });
        }
        AdvancedBatchProcessor.CallResult[] memory callResults = batchProcessor.executeBatch(calls, false);
        results = new bool[](userDatas.length);
        for (uint256 i = 0; i < callResults.length; i++) {
            results[i] = callResults[i].success;
        }
    }
    /**
     * @dev Ejemplo: Guardar datos globales en cache distribuido
     */
    function cacheGlobalData(bytes32 key, bytes memory data, uint256 expiresAt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(distributedCache) != address(0), "Cache not set");
        distributedCache.set(key, data, expiresAt);
    }

    /// @notice Verifica si una dirección es admin
    /// @param account Dirección a consultar
    /// @return true si la dirección es admin
    function isAdmin(address account) public view returns (bool) {
        return hasRole(ADMIN_ROLE, account);
    }

    /// @notice Verifica si una dirección es issuer
    /// @param account Dirección a consultar
    /// @return true si la dirección es issuer
    function isIssuer(address account) public view returns (bool) {
        return hasRole(INSTRUCTOR_ROLE, account);
    }

    /// @notice Verifica si una dirección es validator
    /// @param account Dirección a consultar
    /// @return true si la dirección es validator
    function isValidator(address account) public view returns (bool) {
        return hasRole(STUDENT_ROLE, account);
    }

    /// @notice Asigna el rol admin a una dirección
    /// @param account Dirección a la que se le asigna el rol
    function grantAdmin(address account) public {
        _grantRole(ADMIN_ROLE, account);
    }

    /// @notice Revoca el rol admin de una dirección
    /// @param account Dirección a la que se le revoca el rol
    function revokeAdmin(address account) public {
        _revokeRole(ADMIN_ROLE, account);
    }
} 