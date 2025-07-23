const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Iniciando monitoreo de gas...");

    // Leer información del despliegue
    const network = hre.network.name;
    const deploymentPath = `./deployments/${network}.json`;
    
    if (!fs.existsSync(deploymentPath)) {
        throw new Error(`No se encontró información de despliegue para la red ${network}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    const contracts = deployment.contracts;

    // Obtener instancias de contratos
    const aiProcessor = await hre.ethers.getContractAt("AIProcessor", contracts.AIProcessor);
    const aiOracle = await hre.ethers.getContractAt("AIOracle", contracts.AIOracle);
    const brainSafes = await hre.ethers.getContractAt("BrainSafes", contracts.BrainSafes);

    // Preparar datos de prueba
    const [owner, student] = await hre.ethers.getSigners();
    const testData = hre.ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256"],
        [student.address, 1]
    );

    console.log("\nMidiendo uso de gas para operaciones comunes:");

    // 1. Procesamiento individual vs lote
    console.log("\n1. Comparación de procesamiento individual vs lote:");
    
    // Individual
    const singleTx = await aiProcessor.estimateGas.processInference(1, testData);
    console.log(`Gas para procesamiento individual: ${singleTx.toString()}`);

    // Lote
    const batchData = [testData, testData, testData];
    const batchTx = await aiProcessor.estimateGas.batchProcess(1, batchData);
    console.log(`Gas para procesamiento en lote: ${batchTx.toString()}`);
    console.log(`Gas por operación en lote: ${Math.floor(batchTx / batchData.length)}`);
    console.log(`Ahorro de gas por operación: ${Math.floor((singleTx - (batchTx / batchData.length)) / singleTx * 100)}%`);

    // 2. Comparación con implementación anterior
    console.log("\n2. Comparación con implementación anterior:");
    
    // Stylus (nuevo)
    const stylusTx = await aiOracle.estimateGas.predictStudentPerformance(student.address, 1);
    console.log(`Gas con Stylus: ${stylusTx.toString()}`);

    // Solidity (anterior - simulado con valores típicos)
    const solidityGas = 150000; // Valor típico para operaciones similares en Solidity
    console.log(`Gas con Solidity (estimado): ${solidityGas}`);
    console.log(`Mejora con Stylus: ${Math.floor((solidityGas - stylusTx) / solidityGas * 100)}%`);

    // 3. Monitoreo de estadísticas
    console.log("\n3. Estadísticas de procesamiento:");
    const stats = await aiProcessor.getProcessingStats(1);
    console.log(`Total de solicitudes: ${stats.totalRequests}`);
    console.log(`Gas total usado: ${stats.totalGasUsed}`);
    console.log(`Tiempo promedio de procesamiento: ${stats.avgProcessingTime}`);
    console.log(`Tasa de éxito: ${stats.successRate}%`);

    // 4. Costos en USD
    console.log("\n4. Costos estimados en USD:");
    
    // Obtener precio de gas actual
    const gasPrice = await hre.ethers.provider.getGasPrice();
    const ethPrice = 2000; // USD por ETH (actualizar según necesidad)
    
    function calculateUSD(gas) {
        const ethCost = gas.mul(gasPrice).div(hre.ethers.BigNumber.from(10).pow(18));
        return ethCost.mul(ethPrice);
    }

    console.log(`Precio de gas actual: ${hre.ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
    console.log(`Costo por operación individual: $${calculateUSD(singleTx)}`);
    console.log(`Costo por operación en lote: $${calculateUSD(batchTx.div(batchData.length))}`);

    // 5. Guardar resultados
    const results = {
        timestamp: new Date().toISOString(),
        network: network,
        gasMetrics: {
            singleProcessing: singleTx.toString(),
            batchProcessing: batchTx.toString(),
            batchPerOperation: Math.floor(batchTx / batchData.length).toString(),
            stylusImplementation: stylusTx.toString(),
            solidityEstimate: solidityGas.toString()
        },
        stats: {
            totalRequests: stats.totalRequests.toString(),
            totalGasUsed: stats.totalGasUsed.toString(),
            avgProcessingTime: stats.avgProcessingTime.toString(),
            successRate: stats.successRate.toString()
        },
        costs: {
            gasPrice: gasPrice.toString(),
            ethPrice: ethPrice,
            singleOpCostUSD: calculateUSD(singleTx).toString(),
            batchOpCostUSD: calculateUSD(batchTx.div(batchData.length)).toString()
        }
    };

    // Guardar resultados
    const resultsPath = `./gas-reports/${network}-${Date.now()}.json`;
    fs.mkdirSync("./gas-reports", { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResultados guardados en ${resultsPath}`);

    console.log("\n✅ Monitoreo de gas completado");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 