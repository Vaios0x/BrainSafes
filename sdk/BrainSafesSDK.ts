import { ethers } from 'ethers';
import axios from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

interface BrainSafesConfig {
    apiKey: string;
    apiEndpoint: string;
    websocketEndpoint: string;
    chainId: number;
    provider?: ethers.providers.Provider;
}

interface APIEndpoint {
    id: string;
    name: string;
    version: string;
    description: string;
    methods: string[];
}

interface WebhookConfig {
    name: string;
    endpoint: string;
    secret: string;
    events: string[];
}

interface IntegrationConfig {
    name: string;
    type: 'LMS' | 'SDK' | 'API';
    methods: string[];
}

/**
 * BrainSafes SDK for platform integration
 */
export class BrainSafesSDK extends EventEmitter {
    private config: BrainSafesConfig;
    private provider: ethers.providers.Provider;
    private apiManager: ethers.Contract;
    private ws: WebSocket | null = null;
    private apiEndpoints: Map<string, APIEndpoint> = new Map();
    private webhooks: Map<string, WebhookConfig> = new Map();

    constructor(config: BrainSafesConfig) {
        super();
        this.config = config;
        this.provider = config.provider || new ethers.providers.JsonRpcProvider(config.apiEndpoint);
        this.initializeContracts();
        this.setupWebSocket();
    }

    /**
     * Initialize contract instances
     */
    private async initializeContracts() {
        // Contract ABIs
        const apiManagerABI = require('./abis/APIManager.json');
        
        // Initialize contracts
        this.apiManager = new ethers.Contract(
            'API_MANAGER_ADDRESS',
            apiManagerABI,
            this.provider
        );

        // Set up event listeners
        this.apiManager.on('APIEndpointRegistered', this.handleEndpointRegistered.bind(this));
        this.apiManager.on('WebhookTriggered', this.handleWebhookTriggered.bind(this));
    }

    /**
     * Set up WebSocket connection
     */
    private setupWebSocket() {
        this.ws = new WebSocket(this.config.websocketEndpoint);
        
        this.ws.on('open', () => {
            this.emit('connected');
            this.ws?.send(JSON.stringify({
                type: 'auth',
                apiKey: this.config.apiKey
            }));
        });

        this.ws.on('message', (data: string) => {
            const message = JSON.parse(data);
            this.emit('message', message);
        });

        this.ws.on('close', () => {
            this.emit('disconnected');
            setTimeout(() => this.setupWebSocket(), 5000);
        });
    }

    /**
     * Register a new API endpoint
     */
    public async registerEndpoint(config: {
        name: string;
        version: string;
        description: string;
        rateLimit: number;
        methods: string[];
    }): Promise<string> {
        try {
            const tx = await this.apiManager.registerAPIEndpoint(
                config.name,
                config.version,
                config.description,
                config.rateLimit,
                config.methods.map(m => ethers.utils.id(m).slice(0, 10))
            );
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'APIEndpointRegistered');
            return event?.args?.endpointId;
        } catch (error) {
            throw new Error(`Failed to register endpoint: ${error.message}`);
        }
    }

    /**
     * Register a new webhook
     */
    public async registerWebhook(config: WebhookConfig): Promise<string> {
        try {
            const tx = await this.apiManager.registerWebhook(
                config.name,
                config.endpoint,
                config.secret,
                config.events.map(e => ethers.utils.id(e))
            );
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'WebhookRegistered');
            return event?.args?.webhookId;
        } catch (error) {
            throw new Error(`Failed to register webhook: ${error.message}`);
        }
    }

    /**
     * Create a new integration
     */
    public async createIntegration(config: IntegrationConfig): Promise<string> {
        try {
            const apiKey = ethers.utils.id(Date.now().toString()).slice(2, 34);
            const tx = await this.apiManager.createIntegration(
                config.name,
                config.type,
                apiKey,
                Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year expiry
                config.methods.map(m => ethers.utils.id(m).slice(0, 10))
            );
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === 'IntegrationCreated');
            return event?.args?.integrationId;
        } catch (error) {
            throw new Error(`Failed to create integration: ${error.message}`);
        }
    }

    /**
     * Make an API call
     */
    public async makeAPICall(
        endpointId: string,
        method: string,
        params: any
    ): Promise<any> {
        try {
            const methodSelector = ethers.utils.id(method).slice(0, 10);
            const encodedParams = ethers.utils.defaultAbiCoder.encode(
                ['bytes'],
                [ethers.utils.defaultAbiCoder.encode(params.types, params.values)]
            );

            const tx = await this.apiManager.makeAPICall(
                endpointId,
                methodSelector,
                encodedParams
            );
            await tx.wait();

            // Make HTTP request to API endpoint
            const response = await axios.post(
                `${this.config.apiEndpoint}/api/v1/${method}`,
                params.values,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'X-Transaction-Hash': tx.hash
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(`API call failed: ${error.message}`);
        }
    }

    /**
     * Subscribe to webhook events
     */
    public subscribeToEvents(events: string[], callback: (event: any) => void) {
        events.forEach(event => {
            this.on(event, callback);
        });

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                events
            }));
        }
    }

    /**
     * Handle registered endpoint event
     */
    private handleEndpointRegistered(endpointId: string, name: string, provider: string) {
        this.apiEndpoints.set(endpointId, {
            id: endpointId,
            name,
            version: '',
            description: '',
            methods: []
        });
        this.emit('endpointRegistered', { endpointId, name, provider });
    }

    /**
     * Handle webhook triggered event
     */
    private handleWebhookTriggered(webhookId: string, eventType: string, data: any) {
        this.emit('webhookTriggered', { webhookId, eventType, data });
    }

    /**
     * Get API endpoint details
     */
    public async getEndpointDetails(endpointId: string): Promise<APIEndpoint> {
        const details = await this.apiManager.getEndpointDetails(endpointId);
        return {
            id: endpointId,
            name: details.name,
            version: details.version,
            description: details.description,
            methods: []
        };
    }

    /**
     * Get webhook details
     */
    public async getWebhookDetails(webhookId: string): Promise<WebhookConfig> {
        const details = await this.apiManager.getWebhookDetails(webhookId);
        return {
            name: details.name,
            endpoint: details.endpoint,
            secret: '',
            events: []
        };
    }

    /**
     * Verify API key
     */
    public async verifyAPIKey(integrationId: string, apiKey: string): Promise<boolean> {
        return this.apiManager.verifyAPIKey(integrationId, apiKey);
    }

    /**
     * Close connections
     */
    public disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.removeAllListeners();
    }
}

// Export types
export type {
    BrainSafesConfig,
    APIEndpoint,
    WebhookConfig,
    IntegrationConfig
}; 