const hre = require("hardhat");
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Iniciando monitoreo del bridge...");

    // Cargar direcciones
    const network = await ethers.provider.getNetwork();
    const deploymentPath = `./deployments/${network.name}.json`;
    let deployment;
    try {
        deployment = require(deploymentPath);
    } catch (error) {
        console.error("No se encontró información de despliegue");
        process.exit(1);
    }

    // Conectar contratos
    const bridge = await ethers.getContractAt(
        "BrainSafesBridge",
        deployment.contracts.BrainSafesBridge
    );

    const brainSafesL2 = await ethers.getContractAt(
        "BrainSafesL2",
        deployment.contracts.BrainSafesL2
    );

    // Configurar filtros de eventos
    const operationFilter = bridge.filters.OperationInitiated();
    const messageFilter = bridge.filters.MessageReceived();
    const withdrawalFilter = bridge.filters.WithdrawalInitiated();

    // Monitorear eventos
    bridge.on(operationFilter, async (operationId, sender, operationType) => {
        console.log("\nNueva operación iniciada:");
        console.log("- ID:", operationId.toString());
        console.log("- Sender:", sender);
        console.log("- Tipo:", ["TOKEN_DEPOSIT", "TOKEN_WITHDRAWAL", "CERTIFICATE_BRIDGE", "DATA_BRIDGE"][operationType]);

        // Obtener detalles
        const operation = await bridge.getOperation(operationId);
        console.log("- Monto:", ethers.utils.formatEther(operation.amount));
        console.log("- Estado:", ["PENDING", "PROCESSING", "COMPLETED", "FAILED"][operation.status]);
        console.log("- Timestamp:", new Date(operation.timestamp * 1000).toLocaleString());

        // Guardar en log
        const log = {
            timestamp: new Date().toISOString(),
            event: "OperationInitiated",
            data: {
                operationId: operationId.toString(),
                sender,
                operationType: ["TOKEN_DEPOSIT", "TOKEN_WITHDRAWAL", "CERTIFICATE_BRIDGE", "DATA_BRIDGE"][operationType],
                amount: ethers.utils.formatEther(operation.amount),
                status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"][operation.status]
            }
        };
        appendToLog(log);
    });

    bridge.on(messageFilter, async (messageId, sender, data) => {
        console.log("\nNuevo mensaje recibido:");
        console.log("- ID:", messageId);
        console.log("- Sender:", sender);
        console.log("- Data:", data);

        // Verificar procesamiento
        const processed = await bridge.isMessageProcessed(messageId);
        console.log("- Procesado:", processed);

        // Guardar en log
        const log = {
            timestamp: new Date().toISOString(),
            event: "MessageReceived",
            data: {
                messageId,
                sender,
                data,
                processed
            }
        };
        appendToLog(log);
    });

    bridge.on(withdrawalFilter, async (user, amount, withdrawalTime) => {
        console.log("\nNuevo retiro iniciado:");
        console.log("- Usuario:", user);
        console.log("- Monto:", ethers.utils.formatEther(amount));
        console.log("- Tiempo de retiro:", new Date(withdrawalTime * 1000).toLocaleString());

        // Calcular tiempo restante
        const delay = await bridge.getWithdrawalDelay(user);
        console.log("- Tiempo restante:", formatDuration(delay));

        // Guardar en log
        const log = {
            timestamp: new Date().toISOString(),
            event: "WithdrawalInitiated",
            data: {
                user,
                amount: ethers.utils.formatEther(amount),
                withdrawalTime: new Date(withdrawalTime * 1000).toISOString(),
                remainingDelay: delay.toString()
            }
        };
        appendToLog(log);
    });

    // Monitorear estado del bridge
    setInterval(async () => {
        try {
            // Obtener estadísticas
            const operationCount = await bridge.operationCounter();
            const totalEscrow = await bridge.totalEscrowAmount();
            const paused = await bridge.paused();

            console.log("\nEstado del bridge:");
            console.log("- Operaciones totales:", operationCount.toString());
            console.log("- Total en escrow:", ethers.utils.formatEther(totalEscrow));
            console.log("- Pausado:", paused);

            // Verificar últimas operaciones
            const latestOps = await getLatestOperations(bridge, 5);
            console.log("\nÚltimas operaciones:");
            latestOps.forEach(op => {
                console.log(`- ID ${op.id}: ${op.type} (${op.status})`);
            });

            // Guardar métricas
            const metrics = {
                timestamp: new Date().toISOString(),
                operationCount: operationCount.toString(),
                totalEscrow: ethers.utils.formatEther(totalEscrow),
                paused,
                latestOperations: latestOps
            };
            saveMetrics(metrics);

        } catch (error) {
            console.error("Error monitoreando estado:", error);
        }
    }, 60000); // Cada minuto

    console.log("\nMonitoreo iniciado. Presiona Ctrl+C para detener.");
}

// Funciones auxiliares
function appendToLog(log) {
    const logPath = "./logs/bridge.log";
    fs.mkdirSync("./logs", { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(log) + "\n");
}

function saveMetrics(metrics) {
    const metricsPath = "./metrics/bridge.json";
    fs.mkdirSync("./metrics", { recursive: true });
    fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
}

async function getLatestOperations(bridge, count) {
    const ops = [];
    const total = await bridge.operationCounter();
    const start = Math.max(1, total.sub(count).toNumber());

    for (let i = start; i <= total; i++) {
        const op = await bridge.getOperation(i);
        ops.push({
            id: i,
            type: ["TOKEN_DEPOSIT", "TOKEN_WITHDRAWAL", "CERTIFICATE_BRIDGE", "DATA_BRIDGE"][op.operationType],
            status: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"][op.status]
        });
    }

    return ops;
}

function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// Manejo de errores y cierre
process.on("SIGINT", () => {
    console.log("\nDeteniendo monitoreo...");
    process.exit();
});

process.on("unhandledRejection", (error) => {
    console.error("Error no manejado:", error);
});

// Ejecutar monitoreo
main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 