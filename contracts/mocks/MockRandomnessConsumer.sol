// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../random/GelatoVRF.sol";

/**
 * @title MockRandomnessConsumer
 * @dev Contrato mock para probar integración con GelatoVRF
 */
contract MockRandomnessConsumer is IRandomnessConsumer {
    GelatoVRF public immutable vrf;
    
    // Mappings
    mapping(uint256 => uint256[]) public randomWords;
    mapping(uint256 => bool) public fulfilled;
    
    // Eventos
    event RandomnessRequested(uint256 indexed requestId, uint256 numWords);
    event RandomnessFulfilled(uint256 indexed requestId, uint256[] randomWords);
    
    constructor(address _vrf) {
        vrf = GelatoVRF(_vrf);
    }
    
    /**
     * @dev Solicita aleatoriedad
     */
    function requestRandomness(uint256 numWords) external returns (uint256) {
        bytes32 requestType = bytes32("TEST");
        uint256 requestId = vrf.requestRandomWords(numWords, requestType);
        
        emit RandomnessRequested(requestId, numWords);
        return requestId;
    }
    
    /**
     * @dev Callback para recibir aleatoriedad
     */
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory _randomWords
    ) external override {
        require(msg.sender == address(vrf), "Only VRF can fulfill");
        require(!fulfilled[requestId], "Request already fulfilled");
        
        randomWords[requestId] = _randomWords;
        fulfilled[requestId] = true;
        
        emit RandomnessFulfilled(requestId, _randomWords);
    }
    
    /**
     * @dev Obtiene palabras aleatorias
     */
    function getRandomWords(uint256 requestId) external view returns (uint256[] memory) {
        require(fulfilled[requestId], "Request not fulfilled");
        return randomWords[requestId];
    }
    
    /**
     * @dev Verifica si una solicitud está cumplida
     */
    function isFulfilled(uint256 requestId) external view returns (bool) {
        return fulfilled[requestId];
    }
} 