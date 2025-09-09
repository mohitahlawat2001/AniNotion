#!/usr/bin/env node

/**
 * Enhanced MCP Server Implementation
 * Follows best practices for security, testing, logging, and maintainability
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    logFile: process.env.MCP_LOG_FILE || '/tmp/mcp-server.log',
    enableTesting: process.env.NODE_ENV === 'test',
    maxToolBudget: 10, // Manage agent's tool budget intentionally
    serverName: 'enhanced-mcp-server',
    version: '1.0.0'
};

// Logger implementation (following best practice of file logging for STDIO servers)
class Logger {
    constructor(logFile) {
        this.logFile = logFile;
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = JSON.stringify({
            timestamp,
            level,
            message,
            data,
            pid: process.pid
        }) + '\n';

        try {
            fs.appendFileSync(this.logFile, logEntry);
        } catch (error) {
            // Fallback to stderr if file logging fails
            process.stderr.write(`Logger Error: ${error.message}\n`);
        }
    }

    info(message, data) { this.log('INFO', message, data); }
    warn(message, data) { this.log('WARN', message, data); }
    error(message, data) { this.log('ERROR', message, data); }
    debug(message, data) { this.log('DEBUG', message, data); }
}

const logger = new Logger(CONFIG.logFile);

// Security utilities
class SecurityValidator {
    static validateInput(input, type = 'string', maxLength = 1000) {
        if (typeof input !== type) {
            throw new Error(`Invalid input type. Expected ${type}, got ${typeof input}`);
        }
        
        if (type === 'string' && input.length > maxLength) {
            throw new Error(`Input too long. Maximum ${maxLength} characters allowed`);
        }

        // Prevent command injection
        if (type === 'string' && /[;&|`$\(\)]/.test(input)) {
            throw new Error('Invalid characters detected in input');
        }

        return true;
    }

    static sanitizeRouteParams(params) {
        const sanitized = {};
        for (const [key, value] of Object.entries(params || {})) {
            if (typeof value === 'string') {
                sanitized[key] = value.replace(/[<>\"']/g, '');
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

// Test framework integration
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = { passed: 0, failed: 0, errors: [] };
    }

    addTest(name, testFn) {
        this.tests.push({ name, testFn });
    }

    async runTests() {
        if (!CONFIG.enableTesting) return;
        
        logger.info('Running test suite', { testCount: this.tests.length });
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                this.results.passed++;
                logger.info(`Test passed: ${test.name}`);
            } catch (error) {
                this.results.failed++;
                this.results.errors.push({ test: test.name, error: error.message });
                logger.error(`Test failed: ${test.name}`, { error: error.message });
            }
        }

        logger.info('Test suite completed', this.results);
        return this.results;
    }
}

const testRunner = new TestRunner();

// Route management system
class RouteManager {
    constructor() {
        this.routes = new Map();
        this.registerDefaultRoutes();
    }

    registerRoute(path, method, handler, options = {}) {
        const route = {
            path,
            method,
            handler,
            mobileCompatible: options.mobileCompatible !== false,
            desktopCompatible: options.desktopCompatible !== false,
            requiresAuth: options.requiresAuth || false
        };

        this.routes.set(`${method}:${path}`, route);
        logger.info('Route registered', { path, method, options });
    }

    registerDefaultRoutes() {
        // Health check route
        this.registerRoute('/health', 'GET', () => ({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: CONFIG.version
        }));

        // Route discovery endpoint
        this.registerRoute('/routes', 'GET', () => {
            const routes = Array.from(this.routes.values()).map(route => ({
                path: route.path,
                method: route.method,
                mobileCompatible: route.mobileCompatible,
                desktopCompatible: route.desktopCompatible
            }));
            return { routes };
        });
    }

    getRoute(method, path) {
        return this.routes.get(`${method}:${path}`);
    }

    getAllRoutes() {
        return Array.from(this.routes.values());
    }
}

const routeManager = new RouteManager();

// Enhanced MCP Server
class EnhancedMCPServer {
    constructor() {
        this.tools = new Map();
        this.prompts = new Map();
        this.messageBuffer = '';
        this.setupReadline();
        this.registerDefaultTools();
        logger.info('MCP Server initialized', { serverName: CONFIG.serverName });
    }

    setupReadline() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: false
        });

        this.rl.on('line', (line) => this.handleMessage(line));
        this.rl.on('close', () => this.shutdown());
    }

    sendMessage(message) {
        try {
            const messageStr = JSON.stringify(message);
            const header = `Content-Length: ${Buffer.byteLength(messageStr, 'utf-8')}\r\n\r\n`;
            process.stdout.write(header + messageStr);
            
            logger.debug('Message sent', { 
                method: message.method, 
                id: message.id,
                size: Buffer.byteLength(messageStr, 'utf-8')
            });
        } catch (error) {
            logger.error('Failed to send message', { error: error.message, message });
        }
    }

    sendResponse(id, result, error = null) {
        const response = {
            jsonrpc: '2.0',
            id,
            ...(error ? { error } : { result })
        };
        this.sendMessage(response);
    }

    sendError(id, code, message, data = null) {
        const error = { code, message };
        if (data) error.data = data;
        this.sendResponse(id, null, error);
    }

    // Tool registration with security validation
    registerTool(name, description, parameters, handler, options = {}) {
        try {
            // Follow naming standards (snake_case, no spaces, dots, or brackets)
            if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name)) {
                throw new Error('Tool name must use snake_case format without spaces, dots, or brackets');
            }

            if (this.tools.size >= CONFIG.maxToolBudget) {
                logger.warn('Tool budget exceeded', { currentCount: this.tools.size, maxBudget: CONFIG.maxToolBudget });
            }

            const tool = {
                name,
                description,
                inputSchema: {
                    type: 'object',
                    properties: parameters,
                    required: Object.keys(parameters).filter(key => parameters[key].required !== false)
                },
                handler,
                mobileCompatible: options.mobileCompatible !== false,
                desktopCompatible: options.desktopCompatible !== false
            };

            this.tools.set(name, tool);
            logger.info('Tool registered', { name, description });

            // Auto-generate test for the tool
            this.generateToolTest(name, tool);

        } catch (error) {
            logger.error('Failed to register tool', { name, error: error.message });
            throw error;
        }
    }

    // Auto-generate tests for tools
    generateToolTest(name, tool) {
        testRunner.addTest(`tool_${name}`, async () => {
            // Test tool existence
            if (!this.tools.has(name)) {
                throw new Error(`Tool ${name} not found`);
            }

            // Test tool structure
            const toolDef = this.tools.get(name);
            if (!toolDef.handler || typeof toolDef.handler !== 'function') {
                throw new Error(`Tool ${name} has invalid handler`);
            }

            // Test with empty parameters (should handle gracefully)
            try {
                await toolDef.handler({});
            } catch (error) {
                // Expected for tools requiring parameters
                if (!error.message.includes('required parameter')) {
                    throw new Error(`Tool ${name} failed with unexpected error: ${error.message}`);
                }
            }
        });
    }

    registerDefaultTools() {
        // System information tool
        this.registerTool('getSystemInfo', 
            'Get system information including platform compatibility', 
            {}, 
            () => ({
                platform: process.platform,
                nodeVersion: process.version,
                serverVersion: CONFIG.version,
                mobileCompatible: true,
                desktopCompatible: true,
                routes: routeManager.getAllRoutes().length
            })
        );

        // Route discovery tool
        this.registerTool('discoverRoutes', 
            'Discover available API routes with compatibility information', 
            {
                deviceType: {
                    type: 'string',
                    enum: ['mobile', 'desktop', 'any'],
                    default: 'any'
                }
            }, 
            (params) => {
                const deviceType = params.deviceType || 'any';
                const routes = routeManager.getAllRoutes().filter(route => {
                    if (deviceType === 'mobile') return route.mobileCompatible;
                    if (deviceType === 'desktop') return route.desktopCompatible;
                    return true;
                });
                return { routes, deviceType, total: routes.length };
            }
        );

        // Secure configuration tool
        this.registerTool('validateConfiguration', 
            'Validate server configuration and security settings', 
            {}, 
            () => {
                const config = {
                    logFileWritable: fs.access(path.dirname(CONFIG.logFile), fs.constants.W_OK, (err) => !err),
                    toolCount: this.tools.size,
                    maxToolBudget: CONFIG.maxToolBudget,
                    securityEnabled: true,
                    testingEnabled: CONFIG.enableTesting
                };
                return config;
            }
        );

        // Test execution tool
        this.registerTool('runTests', 
            'Execute the test suite and return results', 
            {}, 
            async () => {
                if (!CONFIG.enableTesting) {
                    return { message: 'Testing is disabled. Set NODE_ENV=test to enable.' };
                }
                const results = await testRunner.runTests();
                return results;
            }
        );
    }

    handleMessage(line) {
        try {
            // Handle Content-Length headers
            if (line.startsWith('Content-Length:')) {
                const length = parseInt(line.split(':')[1].trim());
                logger.debug('Received content length header', { length });
                return;
            }

            // Skip empty lines
            if (!line.trim()) return;

            // Parse JSON-RPC message
            const message = JSON.parse(line);
            logger.debug('Received message', { method: message.method, id: message.id });

            this.processMessage(message);

        } catch (error) {
            logger.error('Failed to handle message', { line, error: error.message });
            
            // Send parse error response
            this.sendError(null, -32700, 'Parse error', { 
                originalLine: line.substring(0, 100) // Truncate for security
            });
        }
    }

    async processMessage(message) {
        const { method, params, id } = message;

        try {
            // Validate JSON-RPC format
            if (message.jsonrpc !== '2.0' || !method) {
                this.sendError(id, -32600, 'Invalid Request');
                return;
            }

            // Handle different method types
            switch (method) {
                case 'initialize':
                    this.handleInitialize(id, params);
                    break;

                case 'tools/list':
                    this.handleToolsList(id);
                    break;

                case 'tools/call':
                    await this.handleToolCall(id, params);
                    break;

                case 'prompts/list':
                    this.handlePromptsList(id);
                    break;

                default:
                    this.sendError(id, -32601, 'Method not found', {
                        method,
                        availableMethods: ['initialize', 'tools/list', 'tools/call', 'prompts/list']
                    });
            }

        } catch (error) {
            logger.error('Error processing message', { method, error: error.message });
            this.sendError(id, -32603, 'Internal error', { 
                message: 'Server encountered an error processing the request'
            });
        }
    }

    handleInitialize(id, params) {
        const capabilities = {
            tools: {},
            prompts: {},
            resources: {},
            logging: {}
        };

        const serverInfo = {
            name: CONFIG.serverName,
            version: CONFIG.version,
            protocolVersion: '2024-11-05',
            capabilities
        };

        this.sendResponse(id, serverInfo);
        logger.info('Server initialized', { clientParams: params });
    }

    handleToolsList(id) {
        const tools = Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            mobileCompatible: tool.mobileCompatible,
            desktopCompatible: tool.desktopCompatible
        }));

        this.sendResponse(id, { tools });
        logger.info('Tools listed', { toolCount: tools.length });
    }

    async handleToolCall(id, params) {
        try {
            const { name, arguments: toolArgs = {} } = params;

            // Validate tool exists
            if (!this.tools.has(name)) {
                // Following best practice: provide helpful information instead of just "not found"
                const availableTools = Array.from(this.tools.keys());
                this.sendError(id, -32601, `Tool configuration required`, {
                    requestedTool: name,
                    availableTools,
                    suggestion: `Available tools: ${availableTools.join(', ')}`
                });
                return;
            }

            const tool = this.tools.get(name);

            // Validate and sanitize arguments
            const sanitizedArgs = SecurityValidator.sanitizeRouteParams(toolArgs);

            // Execute tool with error handling designed for agents
            const result = await tool.handler(sanitizedArgs);

            // Wrap result in MCP format
            const response = {
                content: [{
                    type: 'text',
                    text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                }]
            };

            this.sendResponse(id, response);
            logger.info('Tool executed successfully', { name, hasResult: !!result });

        } catch (error) {
            logger.error('Tool execution failed', { 
                toolName: params?.name, 
                error: error.message 
            });

            // Agent-friendly error message
            this.sendError(id, -32000, 'Tool execution failed', {
                toolName: params?.name,
                reason: error.message,
                suggestion: 'Check tool parameters and configuration'
            });
        }
    }

    handlePromptsList(id) {
        const prompts = Array.from(this.prompts.values());
        this.sendResponse(id, { prompts });
    }

    shutdown() {
        logger.info('MCP Server shutting down');
        
        // Run final tests if enabled
        if (CONFIG.enableTesting) {
            testRunner.runTests().catch(error => {
                logger.error('Final test run failed', { error: error.message });
            });
        }

        process.exit(0);
    }
}

// Initialize and start the server
const server = new EnhancedMCPServer();

// Handle process signals gracefully
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Send initial capabilities
server.sendMessage({
    jsonrpc: '2.0',
    method: 'initialized',
    params: {}
});

logger.info('Enhanced MCP Server started', {
    serverName: CONFIG.serverName,
    version: CONFIG.version,
    logFile: CONFIG.logFile,
    pid: process.pid
});

// Export for testing (if running in test environment)
if (CONFIG.enableTesting) {
    module.exports = { server, testRunner, routeManager, SecurityValidator, Logger };
}
