// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AddressCompressor
 * @notice Utility for compressing and decompressing addresses in BrainSafes
 * @dev Optimizes storage and gas by mapping addresses to indices
 * @author BrainSafes Team
 */
import "@arbitrum/nitro-contracts/src/precompiles/ArbAddressTable.sol";

contract AddressCompressor {
    ArbAddressTable public constant arbAddressTable = ArbAddressTable(address(0x66));

    /// @notice Emitted when an address is registered in the ArbAddressTable
    event AddressRegistered(address indexed addr, uint256 indexed index);

    /**
     * @notice Registra una dirección en la tabla y devuelve su índice
     * @param addr Dirección a registrar
     * @return index Índice asignado en la tabla
     */
    function registerAddress(address addr) external returns (uint256 index) {
        require(addr != address(0), "Dirección inválida");
        index = arbAddressTable.register(addr);
        emit AddressRegistered(addr, index);
    }

    /**
     * @notice Devuelve el índice comprimido de una dirección (debe estar registrada)
     * @param addr Dirección a comprimir
     * @return index Índice comprimido
     */
    function compressAddress(address addr) public view returns (uint256 index) {
        require(addr != address(0), "Dirección inválida");
        index = arbAddressTable.lookup(addr);
        require(index != type(uint256).max, "Dirección no registrada");
    }

    /**
     * @notice Devuelve la dirección original a partir de un índice comprimido
     * @param index Índice comprimido
     * @return addr Dirección original
     */
    function decompressAddress(uint256 index) public view returns (address addr) {
        addr = arbAddressTable.lookupIndex(index);
        require(addr != address(0), "Índice no válido");
    }
} 