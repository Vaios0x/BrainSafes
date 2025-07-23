const { ethers } = require("hardhat");
const { TenderlyApi } = require("@tenderly/sdk");
const { NodeInterface, L2TransactionReceipt } = require("@arbitrum/sdk");
const { promisify } = require("util");
const fs = require("fs").promises;

async function main() {
  console.log("Iniciando herramientas de debugging para Arbitrum...");

  // Configurar proveedores
  const provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC_URL_ARBITRUM_ONE);
  
  // Configurar Tenderly
  const tenderly = new TenderlyApi({
    accessKey: process.env.TENDERLY_ACCESS_KEY,
    projectSlug: process.env.TENDERLY_PROJECT
  });

  // Cargar contratos
  const deploymentInfo = require("../deployment-arbitrum-mainnet.json");
  const BrainSafesArbitrum = await ethers.getContractFactory("BrainSafesArbitrum");
  const EDUToken = await ethers.getContractFactory("EDUToken");
  
  const brainSafes = BrainSafesArbitrum.attach(deploymentInfo.brainSafesProxy);
  const eduToken = EDUToken.attach(deploymentInfo.eduToken);

  // Configurar NodeInterface
  const nodeInterface = NodeInterface.connect(provider);

  // Funciones de debugging

  /**
   * Analiza una transacción en detalle
   */
  async function analyzeTransaction(txHash) {
    console.log(`\nAnalizando transacción: ${txHash}`);

    try {
      // Obtener recibo de transacción
      const receipt = await provider.getTransactionReceipt(txHash);
      const tx = await provider.getTransaction(txHash);
      
      // Crear recibo L2
      const l2Receipt = new L2TransactionReceipt(receipt);
      
      // Obtener información del bloque
      const block = await provider.getBlock(receipt.blockNumber);
      const blockInfo = await nodeInterface.blockInfo();

      // Análisis de gas
      const gasAnalysis = {
        gasUsed: receipt.gasUsed.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: tx.gasPrice.toString(),
        l1GasUsed: l2Receipt.gasUsedForL1(),
        l1BaseFee: blockInfo.l1BaseFee.toString(),
        l2BaseFee: blockInfo.baseFee.toString()
      };

      // Simular transacción en Tenderly
      const simulation = await tenderly.simulateTransaction({
        network_id: "42161",
        from: tx.from,
        to: tx.to,
        input: tx.data,
        gas: tx.gasLimit.toString(),
        gas_price: tx.gasPrice.toString(),
        value: tx.value.toString()
      });

      // Analizar trazas de ejecución
      const trace = await provider.send("debug_traceTransaction", [txHash]);

      // Guardar resultados
      const analysis = {
        transaction: {
          hash: txHash,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          nonce: tx.nonce,
          timestamp: block.timestamp
        },
        receipt: {
          status: receipt.status,
          blockNumber: receipt.blockNumber,
          confirmations: receipt.confirmations,
          logs: receipt.logs.map(log => ({
            address: log.address,
            topics: log.topics,
            data: log.data
          }))
        },
        gasAnalysis,
        simulation: {
          status: simulation.status,
          gasUsed: simulation.gasUsed,
          error: simulation.error
        },
        trace
      };

      // Guardar análisis en archivo
      const filename = `debug/tx-${txHash}-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(analysis, null, 2));
      console.log(`Análisis guardado en ${filename}`);

      return analysis;
    } catch (error) {
      console.error("Error analizando transacción:", error);
      throw error;
    }
  }

  /**
   * Analiza el estado de un contrato
   */
  async function analyzeContract(contractAddress) {
    console.log(`\nAnalizando contrato: ${contractAddress}`);

    try {
      // Obtener código del contrato
      const code = await provider.getCode(contractAddress);
      
      // Obtener storage
      const storage = {};
      for (let i = 0; i < 10; i++) {
        const slot = ethers.utils.hexZeroPad(ethers.utils.hexlify(i), 32);
        storage[slot] = await provider.getStorageAt(contractAddress, slot);
      }

      // Obtener balance
      const balance = await provider.getBalance(contractAddress);

      // Obtener nonce
      const nonce = await provider.getTransactionCount(contractAddress);

      // Verificar si es un contrato proxy
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementation = await provider.getStorageAt(contractAddress, implementationSlot);

      const analysis = {
        address: contractAddress,
        codeSize: (code.length - 2) / 2, // Remover '0x' y convertir a bytes
        balance: balance.toString(),
        nonce,
        isProxy: implementation !== "0x0000000000000000000000000000000000000000000000000000000000000000",
        implementation: implementation,
        storage
      };

      // Guardar análisis
      const filename = `debug/contract-${contractAddress}-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(analysis, null, 2));
      console.log(`Análisis guardado en ${filename}`);

      return analysis;
    } catch (error) {
      console.error("Error analizando contrato:", error);
      throw error;
    }
  }

  /**
   * Analiza eventos de un contrato
   */
  async function analyzeEvents(contractAddress, fromBlock, toBlock) {
    console.log(`\nAnalizando eventos del contrato: ${contractAddress}`);

    try {
      // Obtener todos los eventos
      const events = await provider.getLogs({
        address: contractAddress,
        fromBlock,
        toBlock
      });

      const analysis = {
        address: contractAddress,
        fromBlock,
        toBlock,
        eventCount: events.length,
        events: events.map(event => ({
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          topics: event.topics,
          data: event.data
        }))
      };

      // Guardar análisis
      const filename = `debug/events-${contractAddress}-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(analysis, null, 2));
      console.log(`Análisis guardado en ${filename}`);

      return analysis;
    } catch (error) {
      console.error("Error analizando eventos:", error);
      throw error;
    }
  }

  /**
   * Analiza el gas usado por un contrato
   */
  async function analyzeGasUsage(contractAddress, fromBlock, toBlock) {
    console.log(`\nAnalizando uso de gas del contrato: ${contractAddress}`);

    try {
      // Obtener todas las transacciones
      const transactions = [];
      for (let i = fromBlock; i <= toBlock; i++) {
        const block = await provider.getBlockWithTransactions(i);
        transactions.push(...block.transactions.filter(tx => tx.to === contractAddress));
      }

      const gasAnalysis = {
        address: contractAddress,
        fromBlock,
        toBlock,
        transactionCount: transactions.length,
        totalGasUsed: "0",
        totalL1GasUsed: "0",
        averageGasPerTx: "0",
        highestGasTx: null,
        lowestGasTx: null,
        transactions: []
      };

      // Analizar cada transacción
      for (const tx of transactions) {
        const receipt = await provider.getTransactionReceipt(tx.hash);
        const l2Receipt = new L2TransactionReceipt(receipt);
        
        const txGasAnalysis = {
          hash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          gasLimit: tx.gasLimit.toString(),
          gasPrice: tx.gasPrice.toString(),
          l1GasUsed: l2Receipt.gasUsedForL1(),
          totalCost: tx.gasPrice.mul(receipt.gasUsed).toString()
        };

        gasAnalysis.transactions.push(txGasAnalysis);
        gasAnalysis.totalGasUsed = BigNumber.from(gasAnalysis.totalGasUsed).add(receipt.gasUsed).toString();
        gasAnalysis.totalL1GasUsed = BigNumber.from(gasAnalysis.totalL1GasUsed).add(l2Receipt.gasUsedForL1()).toString();
      }

      if (gasAnalysis.transactions.length > 0) {
        gasAnalysis.averageGasPerTx = BigNumber.from(gasAnalysis.totalGasUsed)
          .div(gasAnalysis.transactions.length)
          .toString();
        
        gasAnalysis.highestGasTx = gasAnalysis.transactions.reduce((a, b) => 
          BigNumber.from(a.gasUsed).gt(BigNumber.from(b.gasUsed)) ? a : b
        );
        
        gasAnalysis.lowestGasTx = gasAnalysis.transactions.reduce((a, b) => 
          BigNumber.from(a.gasUsed).lt(BigNumber.from(b.gasUsed)) ? a : b
        );
      }

      // Guardar análisis
      const filename = `debug/gas-${contractAddress}-${Date.now()}.json`;
      await fs.writeFile(filename, JSON.stringify(gasAnalysis, null, 2));
      console.log(`Análisis guardado en ${filename}`);

      return gasAnalysis;
    } catch (error) {
      console.error("Error analizando uso de gas:", error);
      throw error;
    }
  }

  // Exponer funciones de debugging
  return {
    analyzeTransaction,
    analyzeContract,
    analyzeEvents,
    analyzeGasUsage,
    provider,
    nodeInterface,
    tenderly
  };
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
    .then(debugger => {
      // Ejemplo de uso
      return debugger.analyzeContract(process.env.CONTRACT_ADDRESS);
    })
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Error en debugging:", error);
      process.exit(1);
    });
} else {
  // Exportar para uso como módulo
  module.exports = main; 