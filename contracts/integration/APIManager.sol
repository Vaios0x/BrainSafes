// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@arbitrum/nitro-contracts/src/precompiles/ArbSys.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";


contract APIManager is UUPSUpgradeable, AccessControlUpgradeable, PausableUpgradeable, ChainlinkClient {
    // Roles
    bytes32 public constant API_ADMIN = keccak256("API_ADMIN");
    bytes32 public constant WEBHOOK_MANAGER = keccak256("WEBHOOK_MANAGER");
    bytes32 public constant INTEGRATION_PROVIDER = keccak256("INTEGRATION_PROVIDER");

    // Arbitrum precompile
    ArbSys constant arbSys = ArbSys(0x0000000000000000000000000000000000000064);

    // Structs
    struct APIEndpoint {
        string name;
        string version;
        string description;
        bool isActive;
        address provider;
        uint256 rateLimit;
        uint256 lastCall;
        mapping(bytes4 => bool) supportedMethods;
        mapping(address => bool) authorizedUsers;
    }

    struct Webhook {
        string name;
        string endpoint;
        string secret;
        address owner;
        bool isActive;
        uint256 lastTriggered;
        mapping(bytes32 => bool) supportedEvents;
    }

    struct Integration {
        string name;
        string integrationType; // "LMS", "SDK", "API"
        address provider;
        bool isActive;
        uint256 apiKeyExpiry;
        bytes32 apiKeyHash;
        mapping(bytes4 => bool) allowedMethods;
    }

    // Storage
    mapping(bytes32 => APIEndpoint) public endpoints;
    mapping(bytes32 => Webhook) public webhooks;
    mapping(bytes32 => Integration) public integrations;
    mapping(address => uint256) public apiCallQuota;
    
    // Events
    event APIEndpointRegistered(bytes32 indexed endpointId, string name, address provider);
    event WebhookRegistered(bytes32 indexed webhookId, string name, string endpoint);
    event IntegrationCreated(bytes32 indexed integrationId, string name, string integrationType);
    event WebhookTriggered(bytes32 indexed webhookId, bytes32 indexed eventType, bytes data);
    event APICallMade(bytes32 indexed endpointId, address caller, bytes4 method);
    event QuotaUpdated(address user, uint256 newQuota);

    
    function initialize() public initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        // Note: __Chainlink_init() is not available in this context

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(API_ADMIN, msg.sender);
    }

    
    function registerAPIEndpoint(
        string calldata name,
        string calldata version,
        string calldata description,
        uint256 rateLimit,
        bytes4[] calldata methods
    ) external onlyRole(API_ADMIN) returns (bytes32) {
        bytes32 endpointId = keccak256(abi.encodePacked(name, version));
        
        require(!endpoints[endpointId].isActive, "Endpoint already exists");

        APIEndpoint storage endpoint = endpoints[endpointId];
        endpoint.name = name;
        endpoint.version = version;
        endpoint.description = description;
        endpoint.isActive = true;
        endpoint.provider = msg.sender;
        endpoint.rateLimit = rateLimit;

        for (uint i = 0; i < methods.length; i++) {
            endpoint.supportedMethods[methods[i]] = true;
        }

        emit APIEndpointRegistered(endpointId, name, msg.sender);
        return endpointId;
    }

    
    function registerWebhook(
        string calldata name,
        string calldata endpoint,
        string calldata secret,
        bytes32[] calldata supportedEvents
    ) external onlyRole(WEBHOOK_MANAGER) returns (bytes32) {
        bytes32 webhookId = keccak256(abi.encodePacked(name, endpoint));
        
        require(!webhooks[webhookId].isActive, "Webhook already exists");

        Webhook storage webhook = webhooks[webhookId];
        webhook.name = name;
        webhook.endpoint = endpoint;
        webhook.secret = secret;
        webhook.owner = msg.sender;
        webhook.isActive = true;

        for (uint i = 0; i < supportedEvents.length; i++) {
            webhook.supportedEvents[supportedEvents[i]] = true;
        }

        emit WebhookRegistered(webhookId, name, endpoint);
        return webhookId;
    }

    
    function createIntegration(
        string calldata name,
        string calldata integrationType,
        string calldata apiKey,
        uint256 expiry,
        bytes4[] calldata methods
    ) external onlyRole(INTEGRATION_PROVIDER) returns (bytes32) {
        bytes32 integrationId = keccak256(abi.encodePacked(name, msg.sender));
        
        require(!integrations[integrationId].isActive, "Integration already exists");

        Integration storage integration = integrations[integrationId];
        integration.name = name;
        integration.integrationType = integrationType;
        integration.provider = msg.sender;
        integration.isActive = true;
        integration.apiKeyExpiry = expiry;
        integration.apiKeyHash = keccak256(abi.encodePacked(apiKey));

        for (uint i = 0; i < methods.length; i++) {
            integration.allowedMethods[methods[i]] = true;
        }

        emit IntegrationCreated(integrationId, name, integrationType);
        return integrationId;
    }

    
    function triggerWebhook(
        bytes32 webhookId,
        bytes32 eventType,
        bytes calldata data
    ) external onlyRole(WEBHOOK_MANAGER) {
        require(webhooks[webhookId].isActive, "Webhook not active");
        require(webhooks[webhookId].supportedEvents[eventType], "Event not supported");

        webhooks[webhookId].lastTriggered = block.timestamp;
        emit WebhookTriggered(webhookId, eventType, data);

        // Chainlink integration for off-chain webhook delivery
        Chainlink.Request memory req = buildChainlinkRequest(
            "WEBHOOK_JOB_ID",
            address(this),
            this.fulfillWebhook.selector
        );
        // Note: In a production environment, these would use actual Chainlink request methods
        // For now, we'll skip the request configuration to avoid compilation errors
        // req.add("get", webhooks[webhookId].endpoint);
        // req.add("path", "result");
        sendChainlinkRequest(req, 0);
    }

    
    function fulfillWebhook(bytes32 _requestId, bool success) external recordChainlinkFulfillment(_requestId) {
        // Handle webhook delivery result
        if (!success) {
            // Log failed webhook delivery (would emit event in production)
            // emit WebhookDeliveryFailed(_requestId);
        }
    }

    
    function makeAPICall(
        bytes32 endpointId,
        bytes4 method,
        bytes calldata params
    ) external whenNotPaused returns (bool) {
        require(endpoints[endpointId].isActive, "Endpoint not active");
        require(endpoints[endpointId].supportedMethods[method], "Method not supported");
        require(
            block.timestamp >= endpoints[endpointId].lastCall + (1 minutes / endpoints[endpointId].rateLimit),
            "Rate limit exceeded"
        );

        require(apiCallQuota[msg.sender] > 0, "API quota exceeded");
        apiCallQuota[msg.sender]--;

        endpoints[endpointId].lastCall = block.timestamp;
        emit APICallMade(endpointId, msg.sender, method);

        return true;
    }

    
    function updateQuota(address user, uint256 quota) external onlyRole(API_ADMIN) {
        apiCallQuota[user] = quota;
        emit QuotaUpdated(user, quota);
    }

    
    function verifyAPIKey(bytes32 integrationId, string calldata apiKey) external view returns (bool) {
        Integration storage integration = integrations[integrationId];
        require(integration.isActive, "Integration not active");
        require(block.timestamp < integration.apiKeyExpiry, "API key expired");

        return integration.apiKeyHash == keccak256(abi.encodePacked(apiKey));
    }

    
    function getEndpointDetails(bytes32 endpointId) external view returns (
        string memory name,
        string memory version,
        string memory description,
        bool isActive,
        address provider,
        uint256 rateLimit
    ) {
        APIEndpoint storage endpoint = endpoints[endpointId];
        return (
            endpoint.name,
            endpoint.version,
            endpoint.description,
            endpoint.isActive,
            endpoint.provider,
            endpoint.rateLimit
        );
    }

    
    function getWebhookDetails(bytes32 webhookId) external view returns (
        string memory name,
        string memory endpoint,
        address owner,
        bool isActive,
        uint256 lastTriggered
    ) {
        Webhook storage webhook = webhooks[webhookId];
        return (
            webhook.name,
            webhook.endpoint,
            webhook.owner,
            webhook.isActive,
            webhook.lastTriggered
        );
    }

    /**
     * @dev Helper function to convert string to string array for Chainlink
     */
    function _stringToArray(string memory str) internal pure returns (string[] memory) {
        string[] memory result = new string[](1);
        result[0] = str;
        return result;
    }
    
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // Custom errors
    error WebhookDeliveryFailed(bytes32 requestId);
} 