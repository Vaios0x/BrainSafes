# BrainSafes API Reference

## Core Contract (BrainSafes.sol)

### User Management

#### `registerUser`
```solidity
function registerUser(
    string memory name,
    string memory email,
    string memory ipfsProfile
) external
```
Registers a new user in the system.
- **Parameters**
  - `name`: User's full name
  - `email`: User's email address
  - `ipfsProfile`: IPFS hash containing additional profile data
- **Events**
  - `UserRegistered(address indexed user, string name, uint256 timestamp)`
- **Requirements**
  - User must not be already registered
  - Name and email must not be empty

#### `getUserProfile`
```solidity
function getUserProfile(address user) 
    external 
    view 
    returns (UserProfile memory)
```
Retrieves a user's profile information.
- **Parameters**
  - `user`: Address of the user
- **Returns**
  - UserProfile struct containing user details

### Course Management

#### `createCourse`
```solidity
function createCourse(
    string memory title,
    string memory description,
    string memory ipfsContent,
    uint256 price,
    uint256 duration,
    uint256 maxStudents,
    string[] memory skills,
    uint256 difficulty
) external returns (uint256)
```
Creates a new course.
- **Parameters**
  - `title`: Course title
  - `description`: Course description
  - `ipfsContent`: IPFS hash of course content
  - `price`: Course price in EDU tokens
  - `duration`: Course duration in days
  - `maxStudents`: Maximum number of students
  - `skills`: Array of skills taught
  - `difficulty`: Course difficulty (1-5)
- **Returns**
  - Course ID
- **Events**
  - `CourseCreated(uint256 indexed courseId, address indexed instructor)`
- **Requirements**
  - Caller must have INSTRUCTOR_ROLE
  - Price must be greater than 0
  - Difficulty must be between 1 and 5

#### `enrollInCourse`
```solidity
function enrollInCourse(uint256 courseId) 
    external 
    payable
```
Enrolls a student in a course.
- **Parameters**
  - `courseId`: ID of the course
- **Events**
  - `StudentEnrolled(uint256 indexed courseId, address indexed student)`
- **Requirements**
  - Course must be active
  - Course must not be full
  - Student must have sufficient EDU tokens

### Certificate Management

#### `completeCourse`
```solidity
function completeCourse(
    uint256 courseId,
    uint256 score,
    bytes32 proofOfCompletion
) external
```
Marks a course as completed and issues certificate.
- **Parameters**
  - `courseId`: ID of the completed course
  - `score`: Final score (0-100)
  - `proofOfCompletion`: Proof of course completion
- **Events**
  - `CourseCompleted(uint256 indexed courseId, address indexed student)`
  - `CertificateIssued(address indexed student, uint256 indexed courseId)`
- **Requirements**
  - Student must be enrolled
  - Course must not be already completed
  - Score must be between 0 and 100

### AI Integration

#### `predictStudentPerformance`
```solidity
function predictStudentPerformance(
    address student,
    uint256 courseId
) external view returns (uint256)
```
Predicts student's performance in a course.
- **Parameters**
  - `student`: Student's address
  - `courseId`: Course ID
- **Returns**
  - Predicted score (0-100)
- **Requirements**
  - AI integration must be enabled
  - Student must be registered

#### `generateLearningPath`
```solidity
function generateLearningPath(address student) 
    external 
    view 
    returns (uint256[] memory)
```
Generates personalized learning path.
- **Parameters**
  - `student`: Student's address
- **Returns**
  - Array of recommended course IDs
- **Requirements**
  - Student must be registered
  - AI integration must be enabled

### Scholarship System

#### `applyForScholarship`
```solidity
function applyForScholarship(
    uint256 amount,
    string memory reason
) external
```
Applies for a scholarship.
- **Parameters**
  - `amount`: Requested amount in EDU tokens
  - `reason`: Reason for scholarship request
- **Events**
  - `ScholarshipRequested(address indexed student, uint256 amount)`
- **Requirements**
  - Student must be registered
  - Amount must be reasonable

### Job Marketplace

#### `postJob`
```solidity
function postJob(
    string memory title,
    string memory description,
    string memory location,
    JobType jobType,
    uint256 salary,
    string[] memory requiredSkills
) external returns (uint256)
```
Posts a new job listing.
- **Parameters**
  - `title`: Job title
  - `description`: Job description
  - `location`: Job location
  - `jobType`: Type of job (enum)
  - `salary`: Annual salary in EDU tokens
  - `requiredSkills`: Required skills
- **Returns**
  - Job ID
- **Events**
  - `JobPosted(uint256 indexed jobId, address indexed employer)`
- **Requirements**
  - Caller must have ORGANIZATION_ROLE
  - Salary must be greater than 0

### System Administration

#### `pause`
```solidity
function pause() external
```
Pauses the system.
- **Requirements**
  - Caller must have ADMIN_ROLE

#### `unpause`
```solidity
function unpause() external
```
Unpauses the system.
- **Requirements**
  - Caller must have ADMIN_ROLE

#### `updatePlatformConfig`
```solidity
function updatePlatformConfig(
    uint256 _platformFeePercentage,
    uint256 _instructorRewardPercentage,
    uint256 _studentRewardPercentage,
    uint256 _minimumStakeAmount,
    uint256 _maxCoursesPerInstructor
) external
```
Updates platform configuration.
- **Parameters**
  - `_platformFeePercentage`: New platform fee (max 10%)
  - `_instructorRewardPercentage`: New instructor reward
  - `_studentRewardPercentage`: New student reward
  - `_minimumStakeAmount`: New minimum stake
  - `_maxCoursesPerInstructor`: New course limit
- **Requirements**
  - Caller must have ADMIN_ROLE
  - Platform fee must not exceed 10%

## Events Reference

### Core Events
```solidity
event UserRegistered(address indexed user, string name, uint256 timestamp);
event CourseCreated(uint256 indexed courseId, address indexed instructor);
event StudentEnrolled(uint256 indexed courseId, address indexed student);
event CourseCompleted(uint256 indexed courseId, address indexed student);
event CertificateIssued(address indexed student, uint256 indexed courseId);
event RewardDistributed(address indexed recipient, uint256 amount, string reason);
event EmergencyPaused(address indexed admin, string reason);
```

### Scholarship Events
```solidity
event ScholarshipRequested(address indexed student, uint256 amount);
event ScholarshipApproved(address indexed student, uint256 amount);
event ScholarshipDenied(address indexed student, string reason);
```

### Job Marketplace Events
```solidity
event JobPosted(uint256 indexed jobId, address indexed employer);
event JobApplicationSubmitted(uint256 indexed jobId, address indexed applicant);
event JobFilled(uint256 indexed jobId, address indexed employee);
```

## Error Codes

### User Management
- `USER_ALREADY_REGISTERED`: User is already registered
- `INVALID_USER_DATA`: Invalid user registration data
- `USER_NOT_FOUND`: User profile not found

### Course Management
- `COURSE_NOT_FOUND`: Course does not exist
- `COURSE_FULL`: Course has reached maximum capacity
- `INSUFFICIENT_FUNDS`: Insufficient EDU tokens for enrollment
- `ALREADY_ENROLLED`: Student already enrolled in course

### Certificate Management
- `NOT_ENROLLED`: Student not enrolled in course
- `ALREADY_COMPLETED`: Course already completed
- `INVALID_SCORE`: Invalid completion score

### Scholarship System
- `INVALID_AMOUNT`: Invalid scholarship amount
- `ALREADY_APPLIED`: Already applied for scholarship
- `INSUFFICIENT_FUNDS`: Insufficient funds in scholarship pool

### Job Marketplace
- `INVALID_JOB_DATA`: Invalid job posting data
- `JOB_NOT_FOUND`: Job posting does not exist
- `ALREADY_APPLIED`: Already applied for job

### System
- `UNAUTHORIZED`: Caller lacks required role
- `SYSTEM_PAUSED`: System is paused
- `INVALID_PARAMETER`: Invalid parameter value 