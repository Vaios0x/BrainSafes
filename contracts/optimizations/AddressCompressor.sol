// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arbitrum/nitro-contracts/src/precompiles/ArbAddressTable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbGasInfo.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";

/**
 * @title AddressCompressor (Optimizations)
 * @notice Optimized address compression utility for BrainSafes
 * @dev Provides advanced address mapping and storage reduction
 * @author BrainSafes Team
 */
contract AddressCompressor {
    ArbAddressTable constant arbAddressTable = ArbAddressTable(address(0x66));
    ArbGasInfo constant arbGasInfo = ArbGasInfo(address(0x6c));
    ArbSys constant arbsys = ArbSys(address(0x64));

    mapping(address => uint256) public compressedAddresses;
    mapping(uint256 => address) public decompressedAddresses;

    event AddressCompressed(address indexed original, uint256 indexed compressed);
    event AddressDecompressed(uint256 indexed compressed, address indexed original);

    /**
     * @notice Compresses an address to a unique identifier.
     * @dev Registers the address in the ArbAddressTable if not already present.
     * @param addr The address to compress.
     * @return uint256 The compressed identifier.
     */
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

    /**
     * @notice Decompresses a compressed identifier back to the original address.
     * @dev Retrieves the address from the decompressedAddresses mapping.
     * @param index The compressed identifier.
     * @return address The original address.
     */
    function decompressAddress(uint256 index) public view returns (address) {
        address addr = decompressedAddresses[index];
        require(addr != address(0), "Address not found");
        return addr;
    }

    /**
     * @notice Compresses a batch of addresses in a single transaction.
     * @dev Iterates through the provided addresses and calls compressAddress for each.
     * @param addrs The array of addresses to compress.
     * @return uint256[] memory An array of compressed identifiers.
     */
    function batchCompressAddresses(address[] calldata addrs) external returns (uint256[] memory) {
        uint256[] memory indices = new uint256[](addrs.length);
        for (uint256 i = 0; i < addrs.length; i++) {
            indices[i] = compressAddress(addrs[i]);
        }
        return indices;
    }
} 