// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Interface for ORA Protocol integration (future implementation)
interface IORAOracle {
    function requestCallback(bytes memory prompt) external returns (bytes32);
}

// Interface for Chainlink Functions integration (future implementation)
interface IChainlinkFunctions {
    function sendRequest(string memory source, bytes memory args) external returns (bytes32);
}

/**
 * @title SimpleAIOracle
 * @notice Basic AI Oracle for BrainSafes educational matching and assessment
 * @dev This is a simple implementation that can be upgraded to use ORA or Chainlink Functions
 */
contract SimpleAIOracle is AccessControl, ReentrancyGuard {
    bytes32 public constant ORACLE_OPERATOR_ROLE = keccak256("ORACLE_OPERATOR_ROLE");
    bytes32 public constant AI_PROCESSOR_ROLE = keccak256("AI_PROCESSOR_ROLE");

    struct AIRequest {
        bytes32 requestId;
        address requester;
        string prompt;
        string context;
        uint256 timestamp;
        bool fulfilled;
        string response;
        uint8 confidence;
    }

    struct SkillAssessment {
        address student;
        uint256 courseId;
        uint8 score; // 0-100
        string[] strengths;
        string[] improvements;
        uint8 confidence;
        uint256 timestamp;
    }

    struct JobMatch {
        uint256 jobId;
        address freelancer;
        uint8 matchScore; // 0-100
        string[] matchedSkills;
        string reasoning;
        uint8 confidence;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => AIRequest) public aiRequests;
    mapping(address => SkillAssessment[]) public studentAssessments;
    mapping(uint256 => JobMatch[]) public jobMatches;
    mapping(address => mapping(uint256 => bool)) public hasAssessment;

    uint256 public requestCounter;
    uint256 public assessmentFee = 0.001 ether; // Small fee for AI processing
    uint256 public matchingFee = 0.002 ether;

    // Events
    event AIRequestCreated(bytes32 indexed requestId, address indexed requester, string prompt);
    event AIRequestFulfilled(bytes32 indexed requestId, string response, uint8 confidence);
    event SkillAssessmentCompleted(address indexed student, uint256 indexed courseId, uint8 score);
    event JobMatchGenerated(uint256 indexed jobId, address indexed freelancer, uint8 matchScore);
    event OracleConfigUpdated(string parameter, uint256 value);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_OPERATOR_ROLE, msg.sender);
        _grantRole(AI_PROCESSOR_ROLE, msg.sender);
    }

    /**
     * @dev Request AI processing for skill assessment
     */
    function requestSkillAssessment(
        uint256 courseId,
        string memory studentData,
        string memory courseContent
    ) external payable returns (bytes32) {
        require(msg.value >= assessmentFee, "Insufficient fee");
        require(!hasAssessment[msg.sender][courseId], "Assessment already exists");

        bytes32 requestId = _generateRequestId();
        
        string memory prompt = string(abi.encodePacked(
            "Assess student skills for course ID: ",
            _uint2str(courseId),
            ". Student data: ",
            studentData,
            ". Course content: ",
            courseContent
        ));

        aiRequests[requestId] = AIRequest({
            requestId: requestId,
            requester: msg.sender,
            prompt: prompt,
            context: "SKILL_ASSESSMENT",
            timestamp: block.timestamp,
            fulfilled: false,
            response: "",
            confidence: 0
        });

        emit AIRequestCreated(requestId, msg.sender, prompt);
        return requestId;
    }

    /**
     * @dev Request AI processing for job matching
     */
    function requestJobMatching(
        uint256 jobId,
        string memory freelancerProfile,
        string memory jobRequirements
    ) external payable returns (bytes32) {
        require(msg.value >= matchingFee, "Insufficient fee");

        bytes32 requestId = _generateRequestId();
        
        string memory prompt = string(abi.encodePacked(
            "Match freelancer to job ID: ",
            _uint2str(jobId),
            ". Freelancer profile: ",
            freelancerProfile,
            ". Job requirements: ",
            jobRequirements
        ));

        aiRequests[requestId] = AIRequest({
            requestId: requestId,
            requester: msg.sender,
            prompt: prompt,
            context: "JOB_MATCHING",
            timestamp: block.timestamp,
            fulfilled: false,
            response: "",
            confidence: 0
        });

        emit AIRequestCreated(requestId, msg.sender, prompt);
        return requestId;
    }

    /**
     * @dev Fulfill AI request (called by oracle operators)
     */
    function fulfillAIRequest(
        bytes32 requestId,
        string memory response,
        uint8 confidence
    ) external onlyRole(AI_PROCESSOR_ROLE) nonReentrant {
        require(aiRequests[requestId].requestId == requestId, "Request not found");
        require(!aiRequests[requestId].fulfilled, "Request already fulfilled");
        require(confidence <= 100, "Invalid confidence level");

        aiRequests[requestId].response = response;
        aiRequests[requestId].confidence = confidence;
        aiRequests[requestId].fulfilled = true;

        // Process based on context
        if (keccak256(bytes(aiRequests[requestId].context)) == keccak256(bytes("SKILL_ASSESSMENT"))) {
            _processSkillAssessment(requestId, response, confidence);
        } else if (keccak256(bytes(aiRequests[requestId].context)) == keccak256(bytes("JOB_MATCHING"))) {
            _processJobMatching(requestId, response, confidence);
        }

        emit AIRequestFulfilled(requestId, response, confidence);
    }

    /**
     * @dev Process skill assessment response
     */
    function _processSkillAssessment(
        bytes32 requestId,
        string memory response,
        uint8 confidence
    ) internal {
        AIRequest memory request = aiRequests[requestId];
        
        // Parse AI response (simplified - in production would use more sophisticated parsing)
        uint8 score = _extractScore(response);
        string[] memory strengths = _extractStrengths(response);
        string[] memory improvements = _extractImprovements(response);
        
        // Extract course ID from context (simplified)
        uint256 courseId = _extractCourseId(request.prompt);
        
        SkillAssessment memory assessment = SkillAssessment({
            student: request.requester,
            courseId: courseId,
            score: score,
            strengths: strengths,
            improvements: improvements,
            confidence: confidence,
            timestamp: block.timestamp
        });

        studentAssessments[request.requester].push(assessment);
        hasAssessment[request.requester][courseId] = true;

        emit SkillAssessmentCompleted(request.requester, courseId, score);
    }

    /**
     * @dev Process job matching response
     */
    function _processJobMatching(
        bytes32 requestId,
        string memory response,
        uint8 confidence
    ) internal {
        AIRequest memory request = aiRequests[requestId];
        
        // Parse AI response (simplified)
        uint8 matchScore = _extractScore(response);
        string[] memory matchedSkills = _extractMatchedSkills(response);
        string memory reasoning = _extractReasoning(response);
        
        // Extract job ID from context (simplified)
        uint256 jobId = _extractJobId(request.prompt);
        
        JobMatch memory jobMatch = JobMatch({
            jobId: jobId,
            freelancer: request.requester,
            matchScore: matchScore,
            matchedSkills: matchedSkills,
            reasoning: reasoning,
            confidence: confidence,
            timestamp: block.timestamp
        });

        jobMatches[jobId].push(jobMatch);

        emit JobMatchGenerated(jobId, request.requester, matchScore);
    }

    /**
     * @dev Get skill assessment for a student and course
     */
    function getSkillAssessment(
        address student,
        uint256 courseId
    ) external view returns (SkillAssessment memory) {
        require(hasAssessment[student][courseId], "Assessment not found");
        
        SkillAssessment[] memory assessments = studentAssessments[student];
        for (uint i = 0; i < assessments.length; i++) {
            if (assessments[i].courseId == courseId) {
                return assessments[i];
            }
        }
        revert("Assessment not found");
    }

    /**
     * @dev Get job matches for a specific job
     */
    function getJobMatches(uint256 jobId) external view returns (JobMatch[] memory) {
        return jobMatches[jobId];
    }

    /**
     * @dev Get all assessments for a student
     */
    function getStudentAssessments(address student) external view returns (SkillAssessment[] memory) {
        return studentAssessments[student];
    }

    /**
     * @dev Update oracle configuration
     */
    function updateFees(uint256 _assessmentFee, uint256 _matchingFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        assessmentFee = _assessmentFee;
        matchingFee = _matchingFee;
        
        emit OracleConfigUpdated("assessmentFee", _assessmentFee);
        emit OracleConfigUpdated("matchingFee", _matchingFee);
    }

    /**
     * @dev Withdraw collected fees
     */
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }

    // Helper functions for parsing AI responses (simplified implementations)
    function _extractScore(string memory response) internal pure returns (uint8) {
        // Simplified: return a default score
        // In production, would parse AI response to extract actual score
        return 75;
    }

    function _extractStrengths(string memory) internal pure returns (string[] memory) {
        string[] memory strengths = new string[](2);
        strengths[0] = "Problem solving";
        strengths[1] = "Technical skills";
        return strengths;
    }

    function _extractImprovements(string memory) internal pure returns (string[] memory) {
        string[] memory improvements = new string[](1);
        improvements[0] = "Communication skills";
        return improvements;
    }

    function _extractMatchedSkills(string memory) internal pure returns (string[] memory) {
        string[] memory skills = new string[](2);
        skills[0] = "JavaScript";
        skills[1] = "React";
        return skills;
    }

    function _extractReasoning(string memory) internal pure returns (string memory) {
        return "Good match based on technical skills and experience";
    }

    function _extractCourseId(string memory prompt) internal pure returns (uint256) {
        // Simplified extraction - in production would parse the prompt properly
        return 1;
    }

    function _extractJobId(string memory prompt) internal pure returns (uint256) {
        // Simplified extraction - in production would parse the prompt properly
        return 1;
    }

    function _generateRequestId() internal returns (bytes32) {
        requestCounter++;
        return keccak256(abi.encodePacked(block.timestamp, msg.sender, requestCounter));
    }

    function _uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) return "0";
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
}