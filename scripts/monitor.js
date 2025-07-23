const { ethers } = require("hardhat");
const { TenderlyApi } = require("@tenderly/sdk");
const { NodeInterface } = require("@arbitrum/sdk");

async function main() {
  console.log("Iniciando monitoreo de contratos en Arbitrum...");

  // Configurar proveedores
  const provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC_URL_ARBITRUM_ONE);
  const wsProvider = new ethers.providers.WebSocketProvider(process.env.L2_WS_URL_ARBITRUM_ONE);

  // Configurar Tenderly
  const tenderly = new TenderlyApi({
    accessKey: process.env.TENDERLY_ACCESS_KEY,
    projectSlug: process.env.TENDERLY_PROJECT
  });

  // Cargar contratos
  const BrainSafesArbitrum = await ethers.getContractFactory("BrainSafesArbitrum");
  const EDUToken = await ethers.getContractFactory("EDUToken");

  // Obtener direcciones desde el archivo de despliegue
  const deploymentInfo = require("../deployment-arbitrum-mainnet.json");
  const brainSafes = BrainSafesArbitrum.attach(deploymentInfo.brainSafesProxy);
  const eduToken = EDUToken.attach(deploymentInfo.eduToken);

  // Configurar NodeInterface para monitoreo de gas
  const nodeInterface = NodeInterface.connect(provider);

  // Monitorear eventos
  console.log("Configurando monitores de eventos...");

  // Monitor de gas
  provider.on("block", async (blockNumber) => {
    try {
      const blockInfo = await nodeInterface.blockInfo();
      const gasPrice = await provider.getGasPrice();
      
      console.log(`\nBloque ${blockNumber}:`);
      console.log(`- Gas precio L2: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
      console.log(`- L1 Base Fee: ${ethers.utils.formatUnits(blockInfo.l1BaseFee, "gwei")} gwei`);
      
      // Alertar si el gas está alto
      if (gasPrice.gt(ethers.utils.parseUnits("1", "gwei"))) {
        await sendAlert("Gas Alert", `Gas precio alto en Arbitrum: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);
      }
    } catch (error) {
      console.error("Error monitoreando gas:", error);
    }
  });

  // Monitor de transacciones
  const monitorTransaction = async (tx) => {
    try {
      const receipt = await tx.wait();
      
      // Enviar a Tenderly para análisis
      const simulation = await tenderly.simulateTransaction({
        network_id: "42161", // Arbitrum One
        from: tx.from,
        to: tx.to,
        input: tx.data,
        gas: tx.gasLimit.toString(),
        gas_price: tx.gasPrice.toString(),
        value: tx.value.toString()
      });

      // Analizar simulación
      if (simulation.status) {
        console.log(`Transacción exitosa: ${tx.hash}`);
        console.log("Gas usado:", simulation.gasUsed);
      } else {
        console.error(`Transacción fallida: ${tx.hash}`);
        console.error("Error:", simulation.error);
        await sendAlert("Transaction Alert", `Transacción fallida: ${tx.hash}\nError: ${simulation.error}`);
      }
    } catch (error) {
      console.error("Error monitoreando transacción:", error);
    }
  };

  // Monitorear eventos específicos
  brainSafes.on("CertificateCreated", async (user, certId, event) => {
    console.log(`\nNuevo certificado creado:`);
    console.log(`- Usuario: ${user}`);
    console.log(`- ID: ${certId}`);
    await monitorTransaction(event.transactionHash);
  });

  eduToken.on("Transfer", async (from, to, amount, event) => {
    console.log(`\nTransferencia de EDU:`);
    console.log(`- De: ${from}`);
    console.log(`- A: ${to}`);
    console.log(`- Cantidad: ${ethers.utils.formatEther(amount)} EDU`);
    await monitorTransaction(event.transactionHash);
  });

  // Monitor de errores y excepciones
  wsProvider.on("error", async (error) => {
    console.error("Error en el proveedor WebSocket:", error);
    await sendAlert("Provider Alert", `Error en WebSocket: ${error.message}`);
    
    // Reconectar WebSocket
    setTimeout(() => {
      wsProvider.connect();
    }, 5000);
  });

  // Funciones auxiliares
  async function sendAlert(title, message) {
    // Enviar a Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*${title}*\n${message}`
          })
        });
      } catch (error) {
        console.error("Error enviando alerta a Slack:", error);
      }
    }

    // Enviar por email
    if (process.env.ALERT_EMAIL) {
      // Implementar envío de email
    }

    // Registrar en Tenderly
    try {
      await tenderly.addAlert({
        title,
        description: message,
        severity: "warning"
      });
    } catch (error) {
      console.error("Error registrando alerta en Tenderly:", error);
    }
  }

  // Monitor de estado de salud
  setInterval(async () => {
    try {
      // Verificar sincronización
      const isSyncing = await provider.send("eth_syncing", []);
      if (isSyncing) {
        await sendAlert("Sync Alert", "Nodo Arbitrum no está sincronizado");
      }

      // Verificar latencia
      const start = Date.now();
      await provider.getBlockNumber();
      const latency = Date.now() - start;
      
      if (latency > 5000) {
        await sendAlert("Latency Alert", `Alta latencia en RPC: ${latency}ms`);
      }

      // Verificar estado de contratos
      const isPaused = await brainSafes.paused();
      if (isPaused) {
        await sendAlert("Contract Alert", "BrainSafes está pausado");
      }
    } catch (error) {
      console.error("Error en health check:", error);
      await sendAlert("Health Check Alert", `Error: ${error.message}`);
    }
  }, 60000); // Cada minuto

  console.log("Monitoreo iniciado exitosamente");
}

main()
  .then(() => console.log("Monitoreo en ejecución..."))
  .catch((error) => {
    console.error("Error iniciando monitoreo:", error);
    process.exit(1);
  }); 