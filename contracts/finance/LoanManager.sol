// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IRateOracle {
    function getCurrentRate() external view returns (uint256);
}

contract LoanManager is AccessControl, ReentrancyGuard {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LENDER_ROLE = keccak256("LENDER_ROLE");
    bytes32 public constant STUDENT_ROLE = keccak256("STUDENT_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC20 public immutable token;
    IRateOracle public rateOracle;
    uint64 public loanCounter;
    address public guardian;
    modifier onlyGuardian() { require(msg.sender == guardian, "Solo guardian"); _; }

    enum LoanStatus { Requested, Funded, Repaid, Defaulted, Liquidated }

    struct Loan {
        address student;
        address lender;
        uint128 amount;
        uint64 interest; // basis points (bps)
        uint32 dueDate;
        uint128 repaid;
        uint8 status;
    }

    mapping(uint64 => Loan) public loans;

    error InvalidAmount();
    error InvalidDuration();
    error NotAvailable();
    error AlreadyFunded();
    error NotFunded();
    error NotStudent();
    error NotLender();
    error NotAdmin();
    error NotLiquidator();
    error NotDefaulted();
    error AlreadyRepaid();
    error NotAuthorized();
    error TransferFailed();
    error LoanNotExpired();
    error InvalidStatus();

    event LoanRequested(uint64 indexed loanId, address indexed student, uint128 amount, uint64 interest, uint32 dueDate);
    event LoanFunded(uint64 indexed loanId, address indexed lender);
    event LoanRepaid(uint64 indexed loanId, uint128 amount);
    event LoanDefaulted(uint64 indexed loanId);
    event LoanLiquidated(uint64 indexed loanId);

    constructor(address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        token = IERC20(_token);
        guardian = msg.sender;
    }

    function setGuardian(address _guardian) external onlyGuardian {
        guardian = _guardian;
    }

    function setRateOracle(address _oracle) external onlyGuardian {
        rateOracle = IRateOracle(_oracle);
    }

    function requestLoan(uint128 amount, uint64 interest, uint32 duration) external onlyRole(STUDENT_ROLE) returns (uint64) {
        if (amount == 0) revert InvalidAmount();
        if (duration == 0) revert InvalidDuration();
        unchecked { loanCounter++; }
        loans[loanCounter] = Loan({
            student: msg.sender,
            lender: address(0),
            amount: amount,
            interest: interest,
            dueDate: 0,
            repaid: 0,
            status: uint8(LoanStatus.Requested)
        });
        emit LoanRequested(loanCounter, msg.sender, amount, interest, uint32(block.timestamp + duration));
        return loanCounter;
    }

    function requestLoanWithOracle(uint128 amount, uint32 duration) external onlyRole(STUDENT_ROLE) returns (uint64) {
        uint64 oracleRate = rateOracle != IRateOracle(address(0)) ? uint64(rateOracle.getCurrentRate()) : 0;
        return requestLoan(amount, oracleRate, duration);
    }

    function fundLoan(uint64 loanId) external onlyRole(LENDER_ROLE) nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.status != uint8(LoanStatus.Requested)) revert NotAvailable();
        if (loan.lender != address(0)) revert AlreadyFunded();
        loan.lender = msg.sender;
        loan.dueDate = uint32(block.timestamp + 30 days);
        loan.status = uint8(LoanStatus.Funded);
        // Assembly transfer
        address tokenAddr = address(token);
        address studentAddr = loan.student;
        uint128 amt = loan.amount;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), studentAddr)
            mstore(add(ptr, 36), amt)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        emit LoanFunded(loanId, msg.sender);
    }

    function repayLoan(uint64 loanId, uint128 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        if (loan.status != uint8(LoanStatus.Funded)) revert NotFunded();
        if (msg.sender != loan.student) revert NotStudent();
        if (amount == 0) revert InvalidAmount();
        if (loan.repaid >= loan.amount + (loan.amount * loan.interest / 10000)) revert AlreadyRepaid();
        // Assembly transfer
        address tokenAddr = address(token);
        address lenderAddr = loan.lender;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0xa9059cbb)
            mstore(add(ptr, 4), lenderAddr)
            mstore(add(ptr, 36), amount)
            let result := call(gas(), tokenAddr, 0, ptr, 68, 0, 0)
            if iszero(result) { revert(0, 0) }
        }
        unchecked { loan.repaid += amount; }
        emit LoanRepaid(loanId, amount);
        if (loan.repaid >= loan.amount + (loan.amount * loan.interest / 10000)) {
            loan.status = uint8(LoanStatus.Repaid);
        }
    }

    function markDefault(uint64 loanId) external onlyRole(ADMIN_ROLE) {
        Loan storage loan = loans[loanId];
        if (loan.status != uint8(LoanStatus.Funded)) revert NotFunded();
        if (block.timestamp <= loan.dueDate) revert LoanNotExpired();
        loan.status = uint8(LoanStatus.Defaulted);
        emit LoanDefaulted(loanId);
    }

    function liquidateLoan(uint64 loanId) external onlyRole(LIQUIDATOR_ROLE) {
        Loan storage loan = loans[loanId];
        if (loan.status != uint8(LoanStatus.Defaulted)) revert NotDefaulted();
        loan.status = uint8(LoanStatus.Liquidated);
        emit LoanLiquidated(loanId);
    }

    function getLoanStatus(uint64 loanId) external view returns (uint8) {
        return loans[loanId].status;
    }
} 