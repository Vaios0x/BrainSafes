// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 value);
    event Submit(uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event Confirm(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId);
    event Revoke(address indexed owner, uint256 indexed txId);

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint8 public required;

    struct Tx {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint8 confirmations;
    }
    Tx[] public txs;
    mapping(uint256 => mapping(address => bool)) public confirmed;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "No owner");
        _;
    }

    constructor(address[] memory _owners, uint8 _required) {
        require(_owners.length > 0 && _required > 0 && _required <= _owners.length, "Invalid params");
        for (uint i = 0; i < _owners.length; i++) {
            require(!isOwner[_owners[i]], "Owner not unique");
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }

    receive() external payable { emit Deposit(msg.sender, msg.value); }

    function submit(address to, uint256 value, bytes calldata data) external onlyOwner {
        txs.push(Tx({to: to, value: value, data: data, executed: false, confirmations: 0}));
        emit Submit(txs.length - 1, to, value, data);
    }

    function confirm(uint256 txId) external onlyOwner {
        require(!confirmed[txId][msg.sender], "Already confirmed");
        require(!txs[txId].executed, "Already executed");
        confirmed[txId][msg.sender] = true;
        unchecked { txs[txId].confirmations++; }
        emit Confirm(msg.sender, txId);
    }

    function execute(uint256 txId) external onlyOwner {
        Tx storage t = txs[txId];
        require(!t.executed, "Already executed");
        require(t.confirmations >= required, "Not enough confirmations");
        t.executed = true;
        (bool ok, ) = t.to.call{value: t.value}(t.data);
        require(ok, "Tx failed");
        emit Execute(txId);
    }

    function revoke(uint256 txId) external onlyOwner {
        require(confirmed[txId][msg.sender], "Not confirmed");
        require(!txs[txId].executed, "Already executed");
        confirmed[txId][msg.sender] = false;
        unchecked { txs[txId].confirmations--; }
        emit Revoke(msg.sender, txId);
    }

    function getOwners() external view returns (address[] memory) { return owners; }
    function getTxCount() external view returns (uint256) { return txs.length; }
    function getTx(uint256 txId) external view returns (address, uint256, bytes memory, bool, uint8) {
        Tx storage t = txs[txId];
        return (t.to, t.value, t.data, t.executed, t.confirmations);
    }
} 