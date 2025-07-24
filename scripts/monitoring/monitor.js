const { ethers } = require("hardhat");
const { WebSocket } = require("ws");
const { createLogger, format, transports } = require("winston");
const nodemailer = require("nodemailer");
const TelegramBot = require("node-telegram-bot-api");

// Configure logger
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ]
});

// Alert configuration
const config = {
    telegram: {
        token: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID
    },
    email: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        to: process.env.ALERT_EMAIL
    },
    thresholds: {
        gas: 2_000_000,
        tps: 1_000,
        pendingTx: 10_000,
        latency: 5000
    }
};

// Initialize notification services
const telegram = new TelegramBot(config.telegram.token);
const emailTransporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: true,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

async function main() {
    console.log("Starting BrainSafes monitoring system...");

    // Connect to contracts
    const RealTimeMonitor = await ethers.getContractFactory("RealTimeMonitor");
    const monitor = await RealTimeMonitor.attach("MONITOR_CONTRACT_ADDRESS");

    // Initialize WebSocket connection to Arbitrum node
    const ws = new WebSocket(process.env.ARBITRUM_WS_URL);
    
    // Set up event listeners
    setupSecurityAlerts(monitor);
    setupGasMonitoring(monitor);
    setupTransactionTracking(monitor);
    setupNetworkMetrics(monitor, ws);

    // Start periodic checks
    startPeriodicChecks(monitor);
}

function setupSecurityAlerts(monitor) {
    // Listen for security alerts
    monitor.on("SecurityAlertRaised", async (alertId, alertType, severity, source) => {
        const alert = await monitor.alerts(alertId);
        
        const message = `🚨 Security Alert!\n
            Type: ${alertType}
            Severity: ${severity}
            Source: ${source}
            Description: ${alert.description}
            Time: ${new Date(alert.timestamp * 1000).toISOString()}`;

        logger.error(message);
        
        // Send notifications based on severity
        if (severity >= 2) { // HIGH or CRITICAL
            await sendTelegramAlert(message);
            await sendEmailAlert("Critical Security Alert", message);
        }
    });
}

function setupGasMonitoring(monitor) {
    // Listen for gas price updates
    monitor.on("GasMetricsUpdated", async (l1BaseFee, l2GasPrice) => {
        logger.info("Gas Metrics Updated", { l1BaseFee, l2GasPrice });
        
        // Check for high gas usage
        if (l2GasPrice > config.thresholds.gas) {
            const message = `⚠️ High Gas Alert!\n
                L1 Base Fee: ${ethers.utils.formatUnits(l1BaseFee, "gwei")} gwei
                L2 Gas Price: ${ethers.utils.formatUnits(l2GasPrice, "gwei")} gwei`;
            
            await sendTelegramAlert(message);
        }
    });

    // Monitor contract-specific gas usage
    monitor.on("HighGasUsageDetected", async (contract, gasUsed) => {
        const message = `🔥 High Gas Usage Detected!\n
            Contract: ${contract}
            Gas Used: ${gasUsed.toString()}`;
        
        logger.warn(message);
        await sendTelegramAlert(message);
    });
}

function setupTransactionTracking(monitor) {
    // Track transaction metrics
    monitor.on("*", async (event) => {
        if (event.event === "Transfer" || event.event === "Approval") {
            const metrics = await monitor.getTransactionMetrics();
            logger.info("Transaction Metrics", {
                total: metrics.total.toString(),
                successful: metrics.successful.toString(),
                failed: metrics.failed.toString(),
                avgConfirmTime: metrics.avgConfirmTime.toString()
            });
        }
    });

    // Monitor failed transactions
    monitor.on("FailedTransaction", async (txHash, reason) => {
        const message = `❌ Failed Transaction\n
            Hash: ${txHash}
            Reason: ${reason}`;
        
        logger.error(message);
        await sendTelegramAlert(message);
    });
}

function setupNetworkMetrics(monitor, ws) {
    // Listen for network metrics
    monitor.on("NetworkCongestion", async (pendingTxCount, currentTps) => {
        const message = `🌐 Network Congestion Alert!\n
            Pending Transactions: ${pendingTxCount}
            Current TPS: ${currentTps}`;
        
        logger.warn(message);
        await sendTelegramAlert(message);
    });

    // WebSocket monitoring
    ws.on('message', async (data) => {
        const metrics = JSON.parse(data);
        
        // Update network metrics
        await monitor.updateNetworkMetrics(
            metrics.nodeCount,
            metrics.latency,
            metrics.pendingTxs
        );

        // Check for network issues
        if (metrics.latency > config.thresholds.latency) {
            const message = `🐢 High Network Latency: ${metrics.latency}ms`;
            await sendTelegramAlert(message);
        }
    });
}

async function startPeriodicChecks(monitor) {
    // Check system health every minute
    setInterval(async () => {
        try {
            const [gasMetrics, txMetrics, networkMetrics] = await Promise.all([
                monitor.getGasMetrics(),
                monitor.getTransactionMetrics(),
                monitor.getNetworkMetrics()
            ]);

            // Log metrics
            logger.info("System Health Check", {
                gas: {
                    l1BaseFee: gasMetrics.l1BaseFee.toString(),
                    l2GasPrice: gasMetrics.l2GasPrice.toString(),
                    avgUsage: gasMetrics.avgGasUsage.toString()
                },
                transactions: {
                    total: txMetrics.total.toString(),
                    success_rate: (txMetrics.successful * 100 / txMetrics.total).toFixed(2) + "%"
                },
                network: {
                    tps: networkMetrics.transactionsPerSecond.toString(),
                    latency: networkMetrics.latency.toString() + "ms",
                    pending: networkMetrics.pending.toString()
                }
            });

            // Check for suspicious activity
            await checkSuspiciousActivity(monitor);

        } catch (error) {
            logger.error("Error in periodic check", error);
            await sendTelegramAlert(`🔥 Monitor Error: ${error.message}`);
        }
    }, 60000);
}

async function checkSuspiciousActivity(monitor) {
    const suspiciousThreshold = 3; // Multiple of average
    const txMetrics = await monitor.getTransactionMetrics();
    const avgTxPerUser = txMetrics.total / (await monitor.getUserCount());

    // Get active users
    const activeUsers = await monitor.getActiveUsers();
    
    for (const user of activeUsers) {
        const userTxCount = await monitor.getUserTransactionCount(user);
        const userGasUsed = await monitor.getUserGasUsage(user);

        // Check for unusual patterns
        await monitor.checkSuspiciousActivity(
            user,
            userTxCount,
            userGasUsed
        );
    }
}

async function sendTelegramAlert(message) {
    try {
        await telegram.sendMessage(config.telegram.chatId, message);
    } catch (error) {
        logger.error("Failed to send Telegram alert", error);
    }
}

async function sendEmailAlert(subject, message) {
    try {
        await emailTransporter.sendMail({
            from: config.email.user,
            to: config.email.to,
            subject: `BrainSafes Alert: ${subject}`,
            text: message,
            html: message.replace(/\n/g, '<br>')
        });
    } catch (error) {
        logger.error("Failed to send email alert", error);
    }
}

// Error handling
process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
});

main()
    .then(() => console.log("Monitoring system started successfully"))
    .catch((error) => {
        console.error("Failed to start monitoring system:", error);
        process.exit(1);
    }); 