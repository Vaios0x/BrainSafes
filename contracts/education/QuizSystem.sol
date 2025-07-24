// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface ICourseCatalog {
    function courses(uint256 id) external view returns (
        uint256, string memory, string memory, address, string memory, uint256, bool, uint256[] memory
    );
}

contract QuizSystem is AccessControl {
    bytes32 public constant INSTRUCTOR_ROLE = keccak256("INSTRUCTOR_ROLE");
    ICourseCatalog public courseCatalog;
    struct Quiz {
        uint256 id;
        uint256 courseId;
        string ipfsQuestions;
        uint256 passingScore;
        bool active;
    }

    struct Attempt {
        uint256 quizId;
        address student;
        uint256 score;
        bool passed;
        uint256 timestamp;
    }

    uint256 public nextQuizId;
    mapping(uint256 => Quiz) public quizzes;
    mapping(address => mapping(uint256 => Attempt)) public attempts;

    event QuizCreated(uint256 indexed quizId, uint256 indexed courseId);
    event QuizAttempted(address indexed student, uint256 indexed quizId, uint256 score, bool passed);

    constructor(address _courseCatalog) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        courseCatalog = ICourseCatalog(_courseCatalog);
    }

    function createQuiz(uint256 courseId, string memory ipfsQuestions, uint256 passingScore) external onlyRole(INSTRUCTOR_ROLE) returns (uint256) {
        (, , , , , , bool active, ) = courseCatalog.courses(courseId);
        require(active, "Curso inactivo");
        uint256 id = ++nextQuizId;
        quizzes[id] = Quiz({
            id: id,
            courseId: courseId,
            ipfsQuestions: ipfsQuestions,
            passingScore: passingScore,
            active: true
        });
        emit QuizCreated(id, courseId);
        return id;
    }

    function submitAttempt(uint256 quizId, uint256 score) external {
        Quiz storage q = quizzes[quizId];
        require(q.active, "Quiz inactivo");
        Attempt storage a = attempts[msg.sender][quizId];
        require(a.timestamp == 0, "Ya intentado");
        bool passed = (score >= q.passingScore);
        attempts[msg.sender][quizId] = Attempt({
            quizId: quizId,
            student: msg.sender,
            score: score,
            passed: passed,
            timestamp: block.timestamp
        });
        emit QuizAttempted(msg.sender, quizId, score, passed);
    }

    function getAttempt(address student, uint256 quizId) external view returns (Attempt memory) {
        return attempts[student][quizId];
    }
} 