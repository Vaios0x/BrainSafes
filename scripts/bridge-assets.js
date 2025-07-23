// Script para hacer puente de activos entre Ethereum (L1) y Arbitrum (L2)
const { ethers } = require("hardhat");
const { 
  L1ToL2MessageGasEstimator,
  L1TransactionReceipt,
  L1ToL2MessageStatus,
  EthBridger,
  getL2Network
} = require("@arbitrum/sdk");
const { getL1Network } = require("@arbitrum/sdk/dist/lib/dataEntities/networks");
const { BigNumber } = require("ethers");

async function main() {
  console.log("Iniciando proceso de puente de activos entre L1 y L2...");
  
  // Obtener las cuentas de despliegue
  const [deployer] = await ethers.getSigners();
  console.log(`Cuenta utilizada: ${deployer.address}`);
  console.log(`Saldo de la cuenta: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Verificar que tenemos la configuración necesaria
  if (!process.env.L1_RPC_URL) {
    throw new Error("L1_RPC_URL no está configurado en el archivo .env");
  }

  if (!process.env.L2_RPC_URL) {
    throw new Error("L2_RPC_URL no está configurado en el archivo .env");
  }

  // Configurar proveedores para L1 y L2
  const l1Provider = new ethers.providers.JsonRpcProvider(process.env.L1_RPC_URL);
  const l2Provider = new ethers.providers.JsonRpcProvider(process.env.L2_RPC_URL);

  // Crear wallets para L1 y L2
  const l1Wallet = new ethers.Wallet(process.env.PRIVATE_KEY, l1Provider);
  const l2Wallet = new ethers.Wallet(process.env.PRIVATE_KEY, l2Provider);

  // Obtener información de las redes
  const l1Network = await getL1Network(l1Provider);
  const l2Network = await getL2Network(l2Provider);
  console.log(`Conectado a L1: ${l1Network.name}`);
  console.log(`Conectado a L2: ${l2Network.name}`);

  // Cargar direcciones de contratos desde el archivo de despliegue
  const fs = require("fs");
  const deploymentFilePath = process.env.DEPLOYMENT_FILE_PATH;
  
  if (!deploymentFilePath) {
    throw new Error("DEPLOYMENT_FILE_PATH no está configurado en el archivo .env");
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFilePath, "utf8"));
  console.log("Información de despliegue cargada correctamente");

  // Cargar contratos
  const l1EDUTokenAddress = process.env.L1_EDU_TOKEN_ADDRESS;
  const l2EDUTokenAddress = deploymentInfo.eduToken;
  
  if (!l1EDUTokenAddress) {
    throw new Error("L1_EDU_TOKEN_ADDRESS no está configurado en el archivo .env");
  }

  console.log(`L1 EDU Token: ${l1EDUTokenAddress}`);
  console.log(`L2 EDU Token: ${l2EDUTokenAddress}`);

  // Crear instancias de contratos
  const L1EDUTokenABI = require("../artifacts/contracts/tokens/EDUToken.sol/EDUToken.json").abi;
  const L2EDUTokenABI = require("../artifacts/contracts/tokens/EDUToken.sol/EDUToken.json").abi;
  
  const l1EDUToken = new ethers.Contract(l1EDUTokenAddress, L1EDUTokenABI, l1Wallet);
  const l2EDUToken = new ethers.Contract(l2EDUTokenAddress, L2EDUTokenABI, l2Wallet);

  // Crear instancia del EthBridger
  const ethBridger = new EthBridger(l2Network);

  // Menú de opciones
  console.log("\n=== MENÚ DE OPCIONES ===");
  console.log("1. Depositar ETH de L1 a L2");
  console.log("2. Retirar ETH de L2 a L1");
  console.log("3. Puente de EDU Token de L1 a L2");
  console.log("4. Puente de EDU Token de L2 a L1");
  console.log("5. Verificar estado de mensajes pendientes");
  console.log("6. Finalizar retiro pendiente");
  console.log("========================\n");

  const option = parseInt(process.env.BRIDGE_OPTION || "1");
  const amount = ethers.utils.parseEther(process.env.BRIDGE_AMOUNT || "0.1");

  console.log(`Opción seleccionada: ${option}`);
  console.log(`Cantidad: ${ethers.utils.formatEther(amount)} ETH/EDU`);

  switch (option) {
    case 1:
      await depositEthToL2(ethBridger, l1Wallet, l2Wallet, amount);
      break;
    case 2:
      await withdrawEthFromL2(ethBridger, l1Wallet, l2Wallet, amount);
      break;
    case 3:
      await bridgeEDUTokenToL2(l1EDUToken, l2EDUToken, l1Wallet, l2Wallet, amount);
      break;
    case 4:
      await bridgeEDUTokenToL1(l1EDUToken, l2EDUToken, l1Wallet, l2Wallet, amount);
      break;
    case 5:
      await checkPendingMessages(l1Provider, l2Provider, l1Wallet.address);
      break;
    case 6:
      await finalizeWithdrawal(l1Provider, l2Provider, process.env.TX_HASH);
      break;
    default:
      console.log("Opción no válida");
  }
}

async function depositEthToL2(ethBridger, l1Wallet, l2Wallet, amount) {
  console.log("\nIniciando depósito de ETH de L1 a L2...");
  
  // Estimar el costo de gas
  const l1ToL2MessageGasEstimate = new L1ToL2MessageGasEstimator(l2Wallet.provider);
  
  // Obtener el gas necesario para el depósito
  const gasEstimateResults = await l1ToL2MessageGasEstimate.estimateAll(
    ethBridger.getDepositRequest(l2Wallet.address, amount)
  );

  console.log(`Gas estimado para el depósito: ${gasEstimateResults.gasLimit.toString()}`);
  console.log(`Costo de L2 (en L1): ${ethers.utils.formatEther(gasEstimateResults.maxSubmissionCost)} ETH`);
  
  // Realizar el depósito
  console.log("Enviando transacción de depósito...");
  const depositTx = await ethBridger.deposit({
    amount: amount,
    l1Signer: l1Wallet,
    l2Provider: l2Wallet.provider
  });

  console.log(`Transacción enviada: ${depositTx.hash}`);
  console.log("Esperando confirmación...");
  
  const depositRec = await depositTx.wait();
  console.log(`Transacción confirmada en el bloque ${depositRec.blockNumber}`);
  
  // Esperar a que el mensaje se procese en L2
  console.log("Esperando a que el depósito se procese en L2...");
  const l1TxReceipt = new L1TransactionReceipt(depositRec);
  
  const messages = await l1TxReceipt.getL1ToL2Messages(l2Wallet);
  const message = messages[0];
  
  const messageStatus = await message.waitForStatus();
  console.log(`Estado del mensaje: ${L1ToL2MessageStatus[messageStatus]}`);
  
  if (messageStatus === L1ToL2MessageStatus.REDEEMED) {
    console.log("¡Depósito completado con éxito!");
    console.log(`L2 TX Hash: ${await message.getL2TxHash()}`);
  } else {
    console.log("El depósito no se ha completado correctamente.");
    console.log("Por favor, verifica el estado del mensaje más tarde.");
  }
}

async function withdrawEthFromL2(ethBridger, l1Wallet, l2Wallet, amount) {
  console.log("\nIniciando retiro de ETH de L2 a L1...");
  
  // Realizar el retiro
  console.log("Enviando transacción de retiro...");
  const withdrawTx = await ethBridger.withdraw({
    amount: amount,
    l2Signer: l2Wallet,
    destinationAddress: l1Wallet.address
  });

  console.log(`Transacción enviada: ${withdrawTx.hash}`);
  console.log("Esperando confirmación...");
  
  const withdrawRec = await withdrawTx.wait();
  console.log(`Transacción confirmada en el bloque ${withdrawRec.blockNumber}`);
  
  console.log("\nIMPORTANTE: El proceso de retiro tiene dos pasos:");
  console.log("1. Iniciar retiro (completado)");
  console.log("2. Finalizar retiro después del período de disputa (7 días en mainnet, menos en testnets)");
  console.log("\nPara finalizar el retiro después del período de disputa, ejecuta este script con la opción 6");
  console.log(`y establece TX_HASH=${withdrawTx.hash} en el archivo .env`);
}

async function bridgeEDUTokenToL2(l1EDUToken, l2EDUToken, l1Wallet, l2Wallet, amount) {
  console.log("\nIniciando puente de EDU Token de L1 a L2...");
  
  // Verificar balance y allowance
  const balance = await l1EDUToken.balanceOf(l1Wallet.address);
  console.log(`Balance de EDU en L1: ${ethers.utils.formatEther(balance)} EDU`);
  
  if (balance.lt(amount)) {
    throw new Error("Balance insuficiente de EDU Token en L1");
  }
  
  // Verificar si el contrato tiene el rol BRIDGE_ROLE
  const BRIDGE_ROLE = await l2EDUToken.BRIDGE_ROLE();
  const hasBridgeRole = await l2EDUToken.hasRole(BRIDGE_ROLE, l2Wallet.address);
  
  if (!hasBridgeRole) {
    console.log("ADVERTENCIA: La cuenta no tiene el rol BRIDGE_ROLE en L2. El puente puede fallar.");
  }
  
  // Generar un ID de mensaje único
  const messageId = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256"],
      [l1Wallet.address, l2Wallet.address, amount, Date.now()]
    )
  );
  
  console.log(`ID de mensaje generado: ${messageId}`);
  
  // Paso 1: Bloquear tokens en L1
  console.log("Bloqueando tokens en L1...");
  const lockTx = await l1EDUToken.bridgeToL2(l2Wallet.address, amount);
  console.log(`Transacción enviada: ${lockTx.hash}`);
  await lockTx.wait();
  console.log("Tokens bloqueados en L1");
  
  // Paso 2: Acuñar tokens en L2
  console.log("Acuñando tokens en L2...");
  const mintTx = await l2EDUToken.processL1ToL2Transfer(messageId, l2Wallet.address, amount);
  console.log(`Transacción enviada: ${mintTx.hash}`);
  await mintTx.wait();
  console.log("Tokens acuñados en L2");
  
  // Verificar balance en L2
  const l2Balance = await l2EDUToken.balanceOf(l2Wallet.address);
  console.log(`Nuevo balance de EDU en L2: ${ethers.utils.formatEther(l2Balance)} EDU`);
  
  console.log("¡Puente de tokens completado con éxito!");
}

async function bridgeEDUTokenToL1(l1EDUToken, l2EDUToken, l1Wallet, l2Wallet, amount) {
  console.log("\nIniciando puente de EDU Token de L2 a L1...");
  
  // Verificar balance en L2
  const balance = await l2EDUToken.balanceOf(l2Wallet.address);
  console.log(`Balance de EDU en L2: ${ethers.utils.formatEther(balance)} EDU`);
  
  if (balance.lt(amount)) {
    throw new Error("Balance insuficiente de EDU Token en L2");
  }
  
  // Verificar si el contrato tiene el rol BRIDGE_ROLE en L1
  const BRIDGE_ROLE = await l1EDUToken.BRIDGE_ROLE();
  const hasBridgeRole = await l1EDUToken.hasRole(BRIDGE_ROLE, l1Wallet.address);
  
  if (!hasBridgeRole) {
    console.log("ADVERTENCIA: La cuenta no tiene el rol BRIDGE_ROLE en L1. El puente puede fallar.");
  }
  
  // Paso 1: Quemar tokens en L2
  console.log("Quemando tokens en L2...");
  const burnTx = await l2EDUToken.bridgeToL1(l1Wallet.address, amount);
  console.log(`Transacción enviada: ${burnTx.hash}`);
  await burnTx.wait();
  console.log("Tokens quemados en L2");
  
  // Generar un ID de mensaje único
  const messageId = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256", "uint256"],
      [l2Wallet.address, l1Wallet.address, amount, Date.now()]
    )
  );
  
  // Paso 2: Desbloquear tokens en L1 (esto normalmente requeriría un oráculo o un relayer)
  console.log("Desbloqueando tokens en L1...");
  console.log("NOTA: En un entorno de producción, este paso requeriría un oráculo o relayer");
  
  const unlockTx = await l1EDUToken.processL2ToL1Transfer(messageId, l1Wallet.address, amount);
  console.log(`Transacción enviada: ${unlockTx.hash}`);
  await unlockTx.wait();
  console.log("Tokens desbloqueados en L1");
  
  // Verificar balance en L1
  const l1Balance = await l1EDUToken.balanceOf(l1Wallet.address);
  console.log(`Nuevo balance de EDU en L1: ${ethers.utils.formatEther(l1Balance)} EDU`);
  
  console.log("¡Puente de tokens completado con éxito!");
}

async function checkPendingMessages(l1Provider, l2Provider, address) {
  console.log("\nVerificando mensajes pendientes...");
  
  // Esta función requeriría una implementación más compleja para rastrear todos los mensajes
  // Para una implementación completa, se necesitaría indexar eventos o usar un servicio como Arbitrum Scan
  
  console.log("Esta función es un placeholder. Para una implementación completa:");
  console.log("1. Usa la API de Arbitrum para rastrear mensajes");
  console.log("2. Indexa eventos de los contratos de puente");
  console.log("3. Consulta el estado de los mensajes usando L1ToL2MessageReader");
  
  console.log("\nPara verificar manualmente un retiro pendiente, usa la opción 6 con el hash de la transacción.");
}

async function finalizeWithdrawal(l1Provider, l2Provider, txHash) {
  if (!txHash) {
    throw new Error("TX_HASH no está configurado en el archivo .env");
  }
  
  console.log(`\nFinalizando retiro para la transacción: ${txHash}`);
  
  // Obtener el recibo de la transacción en L2
  const l2Receipt = await l2Provider.getTransactionReceipt(txHash);
  if (!l2Receipt) {
    throw new Error("No se encontró la transacción en L2");
  }
  
  // Crear un objeto L2TransactionReceipt
  const l2TxReceipt = new L2TransactionReceipt(l2Receipt);
  
  // Obtener mensajes de retiro
  const messages = await l2TxReceipt.getWithdrawals();
  if (messages.length === 0) {
    throw new Error("No se encontraron mensajes de retiro en esta transacción");
  }
  
  console.log(`Se encontraron ${messages.length} mensajes de retiro`);
  
  // Procesar cada mensaje de retiro
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log(`\nProcesando mensaje ${i + 1}/${messages.length}`);
    
    // Verificar si el mensaje está listo para ser finalizado
    const status = await message.status(l1Provider);
    console.log(`Estado del mensaje: ${status}`);
    
    if (status === L1ToL2MessageStatus.CONFIRMED) {
      console.log("El mensaje está confirmado y listo para ser finalizado");
      
      // Finalizar el retiro
      console.log("Finalizando retiro...");
      const finalizeTx = await message.execute(l1Provider);
      console.log(`Transacción enviada: ${finalizeTx.hash}`);
      
      const finalizeRec = await finalizeTx.wait();
      console.log(`Retiro finalizado en el bloque ${finalizeRec.blockNumber}`);
    } else if (status === L1ToL2MessageStatus.EXECUTED) {
      console.log("El mensaje ya ha sido ejecutado");
    } else {
      console.log("El mensaje no está listo para ser finalizado");
      console.log("Espera a que termine el período de disputa e intenta nuevamente");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  }); 