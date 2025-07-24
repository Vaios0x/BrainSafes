// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract MentorshipProgram is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MENTOR_ROLE = keccak256("MENTOR_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");

    enum MentorshipStatus { Requested, Active, Rejected, Ended }

    struct Mentorship {
        address mentor;
        address student;
        uint32 startedAt;
        uint32 endedAt;
        uint8 status;
        uint8 rating;
        bytes16 feedbackHash;
    }

    uint256 public mentorshipCounter;
    mapping(uint256 => Mentorship) public mentorships;
    mapping(address => bool) public isMentor;
    mapping(address => uint256[]) public mentorHistory;
    mapping(address => uint256[]) public studentHistory;

    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    event MentorRegistered(address indexed mentor);
    event MentorshipRequested(uint256 indexed mentorshipId, address indexed student, address indexed mentor);
    event MentorshipAccepted(uint256 indexed mentorshipId);
    event MentorshipRejected(uint256 indexed mentorshipId);
    event MentorshipEnded(uint256 indexed mentorshipId);
    event FeedbackSubmitted(uint256 indexed mentorshipId, address indexed student, uint8 rating, bytes16 feedbackHash);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function registerMentor() external {
        require(!isMentor[msg.sender], "Ya es mentor");
        isMentor[msg.sender] = true;
        _grantRole(MENTOR_ROLE, msg.sender);
        emit MentorRegistered(msg.sender);
    }

    function requestMentorship(address mentor) external onlyRole(STUDENT_ROLE) returns (uint256) {
        require(isMentor[mentor], "No es mentor registrado");
        mentorshipCounter++;
        mentorships[mentorshipCounter] = Mentorship({
            mentor: mentor,
            student: msg.sender,
            startedAt: 0,
            endedAt: 0,
            status: uint8(MentorshipStatus.Requested),
            rating: 0,
            feedbackHash: 0
        });
        mentorHistory[mentor].push(mentorshipCounter);
        studentHistory[msg.sender].push(mentorshipCounter);
        emit MentorshipRequested(mentorshipCounter, msg.sender, mentor);
        return mentorshipCounter;
    }

    function acceptMentorship(uint256 mentorshipId) external onlyRole(MENTOR_ROLE) {
        Mentorship storage m = mentorships[mentorshipId];
        require(m.mentor == msg.sender, "Solo el mentor puede aceptar");
        require(m.status == uint8(MentorshipStatus.Requested), "No está pendiente");
        m.status = uint8(MentorshipStatus.Active);
        m.startedAt = uint32(block.timestamp);
        emit MentorshipAccepted(mentorshipId);
    }

    function rejectMentorship(uint256 mentorshipId) external onlyRole(MENTOR_ROLE) {
        Mentorship storage m = mentorships[mentorshipId];
        require(m.mentor == msg.sender, "Solo el mentor puede rechazar");
        require(m.status == uint8(MentorshipStatus.Requested), "No está pendiente");
        m.status = uint8(MentorshipStatus.Rejected);
        emit MentorshipRejected(mentorshipId);
    }

    function endMentorship(uint256 mentorshipId) external {
        Mentorship storage m = mentorships[mentorshipId];
        require(m.status == uint8(MentorshipStatus.Active), "No está activa");
        require(msg.sender == m.mentor || msg.sender == m.student, "No autorizado");
        m.status = uint8(MentorshipStatus.Ended);
        m.endedAt = uint32(block.timestamp);
        emit MentorshipEnded(mentorshipId);
    }

    function submitFeedback(uint256 mentorshipId, uint8 rating, string memory feedback) external onlyRole(STUDENT_ROLE) {
        Mentorship storage m = mentorships[mentorshipId];
        require(m.student == msg.sender, "Solo el estudiante puede calificar");
        require(m.status == uint8(MentorshipStatus.Ended), "Mentoría no finalizada");
        require(m.rating == 0, "Feedback ya enviado");
        require(rating >= 1 && rating <= 5, "Rating fuera de rango");
        m.rating = rating;
        m.feedbackHash = bytes16(keccak256(bytes(feedback)));
        emit FeedbackSubmitted(mentorshipId, msg.sender, rating, m.feedbackHash);
    }

    function getMentorHistory(address mentor) external view returns (uint256[] memory) {
        return mentorHistory[mentor];
    }

    function getStudentHistory(address student) external view returns (uint256[] memory) {
        return studentHistory[student];
    }
} 