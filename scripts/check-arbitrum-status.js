const { ethers, network } = require("hardhat");

/**
 * Script para verificar el estado y salud de las redes Arbitrum
 */
async function main() {
  console.log("🔍 BrainSafes - Arbitrum Status Checker");
  console.log("=========================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("Checking from wallet:", deployer.address);
  
  // Configuración de redes
  const arbitrumNetworks = {
    arbitrumOne: {
      name: "Arbitrum One",
      rpc: process.env.ARBITRUM_URL || "https://arb1.arbitrum.io/rpc",
      chainId: 42161,
      explorer: "https://arbiscan.io",
      bridge: "https://bridge.arbitrum.io"
    },
    arbitrumSepolia: {
      name: "Arbitrum Sepolia",
      rpc: process.env.ARBITRUM_SEPOLIA_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      explorer: "https://sepolia.arbiscan.io",
      bridge: "https://bridge.arbitrum.io"
    },
    arbitrumGoerli: {
      name: "Arbitrum Goerli",
      rpc: process.env.ARBITRUM_GOERLI_URL || "https://goerli-rollup.arbitrum.io/rpc",
      chainId: 421613,
      explorer: "https://goerli.arbiscan.io",
      bridge: "https://bridge.arbitrum.io"
    }
  };

  console.log("\n🌐 ESTADO DE REDES ARBITRUM:");
  console.log("=".repeat(60));

  for (const [key, networkConfig] of Object.entries(arbitrumNetworks)) {
    console.log(`\n🔗 ${networkConfig.name} (Chain ID: ${networkConfig.chainId})`);
    console.log("-".repeat(40));
    
    try {
      const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
      
      // Test de conectividad básica
      const startTime = Date.now();
      const network = await provider.getNetwork();
      const latency = Date.now() - startTime;
      
      console.log(`✅ Conectividad: OK (${latency}ms)`);
      console.log(`🆔 Chain ID confirmado: ${network.chainId}`);
      
      // Verificar último bloque
      const blockNumber = await provider.getBlockNumber();
      const latestBlock = await provider.getBlock(blockNumber);
      const blockAge = Math.floor((Date.now() / 1000) - Number(latestBlock.timestamp));
      
      console.log(`📦 Último bloque: #${blockNumber}`);
      console.log(`⏰ Edad del bloque: ${blockAge} segundos`);
      
      if (blockAge < 10) {
        console.log("🟢 Red activa y sincronizada");
      } else if (blockAge < 60) {
        console.log("🟡 Red ligeramente desfasada");
      } else {
        console.log("🔴 Red posiblemente con problemas");
      }
      
      // Verificar balance del wallet
      const balance = await provider.getBalance(deployer.address);
      const balanceETH = parseFloat(ethers.formatEther(balance));
      
      console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
      
      if (balanceETH >= 0.01) {
        console.log("💚 Balance suficiente para despliegue");
      } else if (balanceETH >= 0.005) {
        console.log("💛 Balance marginal");
      } else {
        console.log("💙 Balance bajo - considera añadir fondos");
      }
      
      // Verificar gas price
      const feeData = await provider.getFeeData();
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0, 'gwei');
      
      console.log(`⛽ Gas Price: ${gasPriceGwei} gwei`);
      
      // Estimar costo de despliegue
      const estimatedDeploymentCost = (Number(feeData.gasPrice) * 15000000) / 1e18; // ~15M gas estimado
      console.log(`💵 Costo estimado despliegue: ~${estimatedDeploymentCost.toFixed(6)} ETH`);
      
      // Enlaces útiles
      console.log(`🔗 Explorer: ${networkConfig.explorer}`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      console.log(`🔗 RPC URL: ${networkConfig.rpc}`);
    }
  }

  // Verificar el estado actual de la red configurada
  if (network.name.toLowerCase().includes('arbitrum')) {
    console.log("\n🎯 RED ACTUAL CONFIGURADA:");
    console.log("=".repeat(60));
    
    try {
      const currentProvider = deployer.provider;
      const networkInfo = await currentProvider.getNetwork();
      const currentBalance = await currentProvider.getBalance(deployer.address);
      
      console.log(`📍 Red: ${network.name}`);
      console.log(`🆔 Chain ID: ${networkInfo.chainId}`);
      console.log(`💰 Balance: ${ethers.formatEther(currentBalance)} ETH`);
      
      // Verificar si podemos desplegar
      const balanceNum = parseFloat(ethers.formatEther(currentBalance));
      
      console.log("\n🚀 ESTADO DE PREPARACIÓN PARA DESPLIEGUE:");
      console.log("-".repeat(40));
      
      if (balanceNum >= 0.01) {
        console.log("✅ Balance: Suficiente");
        console.log("🎯 Listo para desplegar en producción");
      } else if (balanceNum >= 0.005) {
        console.log("⚠️  Balance: Marginal");
        console.log("🎯 Suficiente para testnet, considera más para mainnet");
      } else {
        console.log("❌ Balance: Insuficiente");
        console.log("🎯 Necesitas hacer bridge de más ETH");
      }
      
      // Verificar configuración de environment variables
      console.log("\n📋 CONFIGURACIÓN DE ENVIRONMENT:");
      console.log("-".repeat(40));
      
      const requiredVars = [
        'PRIVATE_KEY',
        'ARBITRUM_URL',
        'ARBITRUM_SEPOLIA_URL',
        'ARBISCAN_API_KEY'
      ];
      
      for (const varName of requiredVars) {
        if (process.env[varName]) {
          console.log(`✅ ${varName}: Configurado`);
        } else {
          console.log(`❌ ${varName}: Faltante`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error verificando red actual: ${error.message}`);
    }
  }

  // Información específica sobre Arbitrum
  console.log("\n📊 INFORMACIÓN ARBITRUM:");
  console.log("=".repeat(60));
  console.log("🔹 Arbitrum One es una solución Layer 2 Optimistic Rollup");
  console.log("🔹 Costos de gas ~95% más baratos que Ethereum");
  console.log("🔹 Transacciones confirmadas en ~1 segundo");
  console.log("🔹 Compatibilidad 100% con EVM y herramientas Ethereum");
  console.log("🔹 Finalidad de transacciones: ~1 semana para withdrawals a L1");

  console.log("\n🛠️ HERRAMIENTAS RECOMENDADAS:");
  console.log("-".repeat(40));
  console.log("• Bridge oficial: https://bridge.arbitrum.io/");
  console.log("• Arbiscan explorer: https://arbiscan.io/");
  console.log("• Gas tracker: https://arbiscan.io/gastracker");
  console.log("• Faucet testnet: https://faucet.quicknode.com/arbitrum/sepolia");
  console.log("• Status page: https://arbiscan.io/");

  console.log("\n💡 CONSEJOS PARA BRAINSAFES:");
  console.log("-".repeat(40));
  console.log("• Usa Arbitrum Sepolia para testing inicial");
  console.log("• Los microtransacciones educativas son viables en Arbitrum");
  console.log("• Considera batching de transacciones para mayor eficiencia");
  console.log("• Los NFTs de certificados son muy baratos de mintear");
  console.log("• Las recompensas diarias son económicamente viables");

  console.log("\n🎯 PRÓXIMOS PASOS:");
  console.log("-".repeat(40));
  if (network.name.toLowerCase().includes('arbitrum')) {
    const currentBalance = await deployer.provider.getBalance(deployer.address);
    const balanceNum = parseFloat(ethers.formatEther(currentBalance));
    
    if (balanceNum >= 0.005) {
      console.log("✅ Listo para desplegar:");
      console.log("   npm run deploy:testnet     # Para Arbitrum Sepolia");
      console.log("   npm run deploy:arbitrum    # Para Arbitrum One");
    } else {
      console.log("🌉 Primero haz bridge de ETH:");
      console.log("   npm run arbitrum:bridge    # Verificar balances");
      console.log("   Luego ve a: https://bridge.arbitrum.io/");
    }
  } else {
    console.log("⚙️  Configura Arbitrum primero:");
    console.log("   npx hardhat console --network arbitrumSepolia");
    console.log("   npm run arbitrum:bridge");
  }
}

// Ejecutar script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 