// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbAddressTable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";


contract AddressCompressor {
    ArbAddressTable constant arbAddressTable = ArbAddressTable(address(0x66));
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    ArbSys constant arbsys = ArbSys(address(0x64));

    mapping(address => uint256) public compressedAddresses;
    mapping(uint256 => address) public decompressedAddresses;

    event AddressCompressed(address indexed original, uint256 indexed compressed);
    event AddressDecompressed(uint256 indexed compressed, address indexed original);

    
    function compressAddress(address addr) public returns (uint256) {
        require(addr != address(0), "Cannot compress zero address");
        
        if (compressedAddresses[addr] != 0) {
            return compressedAddresses[addr];
        }

        uint256 index = arbAddressTable.register(addr);
        compressedAddresses[addr] = index;
        decompressedAddresses[index] = addr;
        
        emit AddressCompressed(addr, index);
        return index;
    }

    
    function decompressAddress(uint256 index) public view returns (address) {
        address addr = decompressedAddresses[index];
        require(addr != address(0), "Address not found");
        return addr;
    }

    
    function batchCompressAddresses(address[] calldata addrs) external returns (uint256[] memory) {
        uint256[] memory indices = new uint256[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            indices[i] = compressAddress(addrs[i]);
        }
        return indices;
    }
} 