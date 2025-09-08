// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../core/BrainSafesArbitrum.sol";
import "../utils/SecurityManager.sol";


contract SmartLaborContracts is AccessControl, Pausable, ReentrancyGuard {
    // Roles
    bytes32 public constant CONTRACT_MANAGER = keccak256("CONTRACT_MANAGER");
    bytes32 public constant COMPLIANCE_OFFICER = keccak256("COMPLIANCE_OFFICER");

    // Estructuras
    struct LaborContract {
        uint256 id;
        address employer;
        address employee;
        string title;
        string description;
        uint256 salary;
        uint256 startDate;
        uint256 endDate;
        uint256 hoursPerWeek;
        string[] benefits;
        string[] responsibilities;
        ContractType contractType;
        ContractStatus status;
        PaymentSchedule paymentSchedule;
        uint256 lastPayment;
        bool hasInsurance;
        string[] documents;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
        mapping(uint256 => Review) performanceReviews;
        uint256 reviewCount;
    }

    struct Milestone {
        string description;
        uint256 deadline;
        uint256 bonus;
        bool completed;
        uint256 completionDate;
    }

    struct Review {
        uint256 date;
        uint256 score;
        string feedback;
        string[] strengths;
        string[] improvements;
        bool acknowledged;
    }

    struct ComplianceCheck {
        uint256 contractId;
        address checker;
        bool passed;
        string[] violations;
        uint256 timestamp;
        string recommendation;
    }

    struct PaymentRecord {
        uint256 contractId;
        uint256 amount;
        uint256 timestamp;
        string description;
        bool isPenalty;
    }

    struct ContractTemplate {
        string name;
        string description;
        ContractType contractType;
        string[] defaultTerms;
        string[] requiredDocuments;
        bool isActive;
    }

    // Enums
    enum ContractType { 
        FullTime,
        PartTime,
        Temporary,
        Contract,
        Internship
    }

    enum ContractStatus {
        Draft,
        Pending,
        Active,
        Completed,
        Terminated,
        Disputed
    }

    enum PaymentSchedule {
        Monthly,
        Biweekly,
        Weekly,
        Milestone
    }

    // Mappings
    mapping(uint256 => LaborContract) public contracts;
    mapping(uint256 => ComplianceCheck[]) public complianceHistory;
    mapping(uint256 => PaymentRecord[]) public paymentHistory;
    mapping(string => ContractTemplate) public contractTemplates;
    mapping(address => uint256[]) public employerContracts;
    mapping(address => uint256[]) public employeeContracts;
    mapping(uint256 => mapping(address => bool)) public contractSignatures;

    // Contadores
    uint256 private contractCounter;
    uint256 private templateCounter;

    // Referencias a otros contratos
    BrainSafesArbitrum public brainSafes;
    SecurityManager public securityManager;
    IERC20 public paymentToken;

    // Constantes
    uint256 public constant MIN_CONTRACT_DURATION = 7 days;
    uint256 public constant MAX_CONTRACT_DURATION = 730 days;
    uint256 public constant COMPLIANCE_CHECK_INTERVAL = 30 days;
    uint256 public constant REVIEW_INTERVAL = 90 days;

    // Eventos
    event ContractCreated(uint256 indexed contractId, address indexed employer, address indexed employee);
    event ContractSigned(uint256 indexed contractId, address indexed signer, string role);
    event ContractActivated(uint256 indexed contractId, uint256 startDate);
    event ContractTerminated(uint256 indexed contractId, string reason);
    event PaymentProcessed(uint256 indexed contractId, uint256 amount, string description);
    event MilestoneCompleted(uint256 indexed contractId, uint256 indexed milestoneId);
    event ReviewSubmitted(uint256 indexed contractId, uint256 indexed reviewId);
    event ComplianceCheckCompleted(uint256 indexed contractId, bool passed);
    event TemplateCreated(string indexed name, ContractType contractType);

    
    constructor(
        address _brainSafes,
        address _securityManager,
        address _paymentToken
    ) {
        require(_brainSafes != address(0), "Invalid BrainSafes address");
        require(_securityManager != address(0), "Invalid SecurityManager address");
        require(_paymentToken != address(0), "Invalid payment token address");

        brainSafes = BrainSafesArbitrum(_brainSafes);
        securityManager = SecurityManager(_securityManager);
        paymentToken = IERC20(_paymentToken);

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(CONTRACT_MANAGER, msg.sender);
    }

    
    function createContract(
        address employee,
        string memory title,
        string memory description,
        uint256 salary,
        uint256 startDate,
        uint256 endDate,
        uint256 hoursPerWeek,
        string[] memory benefits,
        string[] memory responsibilities,
        ContractType contractType,
        PaymentSchedule paymentSchedule
    ) external whenNotPaused nonReentrant {
        require(employee != address(0), "Invalid employee address");
        require(salary > 0, "Invalid salary");
        require(startDate > block.timestamp, "Invalid start date");
        require(endDate > startDate, "Invalid end date");
        require(endDate - startDate >= MIN_CONTRACT_DURATION, "Duration too short");
        require(endDate - startDate <= MAX_CONTRACT_DURATION, "Duration too long");
        require(hoursPerWeek > 0 && hoursPerWeek <= 168, "Invalid hours");

        contractCounter++;
        
        LaborContract storage contract_ = contracts[contractCounter];
        contract_.id = contractCounter;
        contract_.employer = msg.sender;
        contract_.employee = employee;
        contract_.title = title;
        contract_.description = description;
        contract_.salary = salary;
        contract_.startDate = startDate;
        contract_.endDate = endDate;
        contract_.hoursPerWeek = hoursPerWeek;
        contract_.benefits = benefits;
        contract_.responsibilities = responsibilities;
        contract_.contractType = contractType;
        contract_.status = ContractStatus.Draft;
        contract_.paymentSchedule = paymentSchedule;

        employerContracts[msg.sender].push(contractCounter);
        employeeContracts[employee].push(contractCounter);

        emit ContractCreated(contractCounter, msg.sender, employee);
    }

    
    function signContract(uint256 contractId) external whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(
            msg.sender == contract_.employer || 
            msg.sender == contract_.employee,
            "Not authorized"
        );
        require(contract_.status == ContractStatus.Draft, "Invalid status");
        require(!contractSignatures[contractId][msg.sender], "Already signed");

        contractSignatures[contractId][msg.sender] = true;

        // Si ambas partes han firmado
        if (
            contractSignatures[contractId][contract_.employer] &&
            contractSignatures[contractId][contract_.employee]
        ) {
            contract_.status = ContractStatus.Pending;
        }

        string memory role = msg.sender == contract_.employer ? "employer" : "employee";
        emit ContractSigned(contractId, msg.sender, role);
    }

    
    function activateContract(
        uint256 contractId
    ) external onlyRole(CONTRACT_MANAGER) whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(contract_.status == ContractStatus.Pending, "Invalid status");
        require(block.timestamp <= contract_.startDate, "Start date passed");

        contract_.status = ContractStatus.Active;
        contract_.lastPayment = block.timestamp;

        emit ContractActivated(contractId, block.timestamp);
    }

    
    function processPayment(
        uint256 contractId,
        string memory description
    ) external whenNotPaused nonReentrant {
        LaborContract storage contract_ = contracts[contractId];
        require(contract_.status == ContractStatus.Active, "Contract not active");
        require(msg.sender == contract_.employer, "Not authorized");

        uint256 nextPayment = _calculateNextPayment(contract_);
        require(block.timestamp >= nextPayment, "Too early for payment");

        // Transferir pago
        require(
            paymentToken.transferFrom(msg.sender, contract_.employee, contract_.salary),
            "Payment failed"
        );

        contract_.lastPayment = block.timestamp;

        // Registrar pago
        paymentHistory[contractId].push(PaymentRecord({
            contractId: contractId,
            amount: contract_.salary,
            timestamp: block.timestamp,
            description: description,
            isPenalty: false
        }));

        emit PaymentProcessed(contractId, contract_.salary, description);
    }

    
    function addMilestone(
        uint256 contractId,
        string memory description,
        uint256 deadline,
        uint256 bonus
    ) external whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(msg.sender == contract_.employer, "Not authorized");
        require(contract_.status == ContractStatus.Active, "Contract not active");
        require(deadline > block.timestamp, "Invalid deadline");
        require(deadline <= contract_.endDate, "Deadline after contract end");

        contract_.milestoneCount++;
        contract_.milestones[contract_.milestoneCount] = Milestone({
            description: description,
            deadline: deadline,
            bonus: bonus,
            completed: false,
            completionDate: 0
        });
    }

    
    function completeMilestone(
        uint256 contractId,
        uint256 milestoneId
    ) external whenNotPaused nonReentrant {
        LaborContract storage contract_ = contracts[contractId];
        require(msg.sender == contract_.employer, "Not authorized");
        require(contract_.status == ContractStatus.Active, "Contract not active");

        Milestone storage milestone = contract_.milestones[milestoneId];
        require(!milestone.completed, "Already completed");
        require(block.timestamp <= milestone.deadline, "Deadline passed");

        milestone.completed = true;
        milestone.completionDate = block.timestamp;

        // Pagar bonus
        if (milestone.bonus > 0) {
            require(
                paymentToken.transferFrom(msg.sender, contract_.employee, milestone.bonus),
                "Bonus payment failed"
            );

            paymentHistory[contractId].push(PaymentRecord({
                contractId: contractId,
                amount: milestone.bonus,
                timestamp: block.timestamp,
                description: "Milestone bonus",
                isPenalty: false
            }));
        }

        emit MilestoneCompleted(contractId, milestoneId);
    }

    
    function submitPerformanceReview(
        uint256 contractId,
        uint256 score,
        string memory feedback,
        string[] memory strengths,
        string[] memory improvements
    ) external whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(msg.sender == contract_.employer, "Not authorized");
        require(contract_.status == ContractStatus.Active, "Contract not active");
        require(score <= 100, "Invalid score");

        contract_.reviewCount++;
        contract_.performanceReviews[contract_.reviewCount] = Review({
            date: block.timestamp,
            score: score,
            feedback: feedback,
            strengths: strengths,
            improvements: improvements,
            acknowledged: false
        });

        emit ReviewSubmitted(contractId, contract_.reviewCount);
    }

    
    function performComplianceCheck(
        uint256 contractId,
        bool passed,
        string[] memory violations,
        string memory recommendation
    ) external onlyRole(COMPLIANCE_OFFICER) whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(contract_.status == ContractStatus.Active, "Contract not active");

        ComplianceCheck memory check = ComplianceCheck({
            contractId: contractId,
            checker: msg.sender,
            passed: passed,
            violations: violations,
            timestamp: block.timestamp,
            recommendation: recommendation
        });

        complianceHistory[contractId].push(check);

        emit ComplianceCheckCompleted(contractId, passed);
    }

    
    function terminateContract(
        uint256 contractId,
        string memory reason
    ) external whenNotPaused {
        LaborContract storage contract_ = contracts[contractId];
        require(
            msg.sender == contract_.employer || 
            hasRole(CONTRACT_MANAGER, msg.sender),
            "Not authorized"
        );
        require(contract_.status == ContractStatus.Active, "Contract not active");

        contract_.status = ContractStatus.Terminated;

        emit ContractTerminated(contractId, reason);
    }

    
    function createContractTemplate(
        string memory name,
        string memory description,
        ContractType contractType,
        string[] memory defaultTerms,
        string[] memory requiredDocuments
    ) external onlyRole(CONTRACT_MANAGER) whenNotPaused {
        require(bytes(name).length > 0, "Invalid name");
        require(!contractTemplates[name].isActive, "Template exists");

        contractTemplates[name] = ContractTemplate({
            name: name,
            description: description,
            contractType: contractType,
            defaultTerms: defaultTerms,
            requiredDocuments: requiredDocuments,
            isActive: true
        });

        emit TemplateCreated(name, contractType);
    }

    
    function _calculateNextPayment(
        LaborContract storage contract_
    ) internal view returns (uint256) {
        if (contract_.paymentSchedule == PaymentSchedule.Monthly) {
            return contract_.lastPayment + 30 days;
        } else if (contract_.paymentSchedule == PaymentSchedule.Biweekly) {
            return contract_.lastPayment + 14 days;
        } else if (contract_.paymentSchedule == PaymentSchedule.Weekly) {
            return contract_.lastPayment + 7 days;
        } else {
            return contract_.lastPayment;
        }
    }

    
    function getContractDetails(uint256 contractId) external view returns (
        address employer,
        address employee,
        string memory title,
        uint256 salary,
        uint256 startDate,
        uint256 endDate,
        uint256 hoursPerWeek,
        ContractType contractType,
        ContractStatus status,
        PaymentSchedule paymentSchedule
    ) {
        LaborContract storage contract_ = contracts[contractId];
        return (
            contract_.employer,
            contract_.employee,
            contract_.title,
            contract_.salary,
            contract_.startDate,
            contract_.endDate,
            contract_.hoursPerWeek,
            contract_.contractType,
            contract_.status,
            contract_.paymentSchedule
        );
    }

    
    function getPaymentHistory(uint256 contractId) external view returns (PaymentRecord[] memory) {
        return paymentHistory[contractId];
    }

    
    function getComplianceHistory(uint256 contractId) external view returns (ComplianceCheck[] memory) {
        return complianceHistory[contractId];
    }

    
    function getEmployerContracts(address employer) external view returns (uint256[] memory) {
        return employerContracts[employer];
    }

    
    function getEmployeeContracts(address employee) external view returns (uint256[] memory) {
        return employeeContracts[employee];
    }

    
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
} 