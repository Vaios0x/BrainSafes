// Script para desplegar BrainSafes en Arbitrum
const { ethers, upgrades } = require("hardhat");
const { getL1Network } = require("@arbitrum/sdk");
const { providers } = require("ethers");

async function main() {
  console.log("Iniciando despliegue en Arbitrum...");

  // Obtener las cuentas de despliegue
  const [deployer] = await ethers.getSigners();
  console.log(`Desplegando contratos con la cuenta: ${deployer.address}`);
  console.log(`Saldo de la cuenta: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  // Verificar que estamos en la red Arbitrum
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`ID de red actual: ${chainId}`);
  
  // Validar que estamos en Arbitrum (mainnet o testnet)
  const isArbitrumOne = chainId === 42161;
  const isArbitrumSepolia = chainId === 421614;
  
  if (!isArbitrumOne && !isArbitrumSepolia) {
    throw new Error("Este script debe ejecutarse en la red Arbitrum (mainnet o Sepolia testnet)");
  }
  
  console.log(`Desplegando en Arbitrum ${isArbitrumOne ? "One (mainnet)" : "Sepolia (testnet)"}`);

  // Configurar la conexión con L1 (Ethereum)
  const l1Provider = new providers.JsonRpcProvider(
    isArbitrumOne 
      ? process.env.L1_RPC_URL 
      : "https://sepolia.infura.io/v3/" + process.env.INFURA_API_KEY
  );
  
  const l1Network = await getL1Network(l1Provider);
  console.log(`Conectado a L1 (${l1Network.name})`);

  // Desplegar contratos de tokens
  console.log("Desplegando EDUToken...");
  const EDUToken = await ethers.getContractFactory("EDUToken");
  const eduToken = await EDUToken.deploy();
  await eduToken.deployed();
  console.log(`EDUToken desplegado en: ${eduToken.address}`);

  console.log("Desplegando CertificateNFT...");
  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const certificateNFT = await CertificateNFT.deploy();
  await certificateNFT.deployed();
  console.log(`CertificateNFT desplegado en: ${certificateNFT.address}`);

  // Desplegar AIOracle
  console.log("Desplegando AIOracle...");
  const AIOracle = await ethers.getContractFactory("AIOracle");
  const aiOracle = await AIOracle.deploy();
  await aiOracle.deployed();
  console.log(`AIOracle desplegado en: ${aiOracle.address}`);

  // Desplegar ScholarshipManager
  console.log("Desplegando ScholarshipManager...");
  const ScholarshipManager = await ethers.getContractFactory("ScholarshipManager");
  const scholarshipManager = await ScholarshipManager.deploy(eduToken.address);
  await scholarshipManager.deployed();
  console.log(`ScholarshipManager desplegado en: ${scholarshipManager.address}`);

  // Desplegar JobMarketplace
  console.log("Desplegando JobMarketplace...");
  const JobMarketplace = await ethers.getContractFactory("JobMarketplace");
  const jobMarketplace = await JobMarketplace.deploy(eduToken.address);
  await jobMarketplace.deployed();
  console.log(`JobMarketplace desplegado en: ${jobMarketplace.address}`);

  // Desplegar el contrato principal BrainSafesArbitrum como upgradeable
  console.log("Desplegando BrainSafesArbitrum (upgradeable)...");
  const BrainSafesArbitrum = await ethers.getContractFactory("BrainSafesArbitrum");
  
  // Dirección del contrato en L1 (si existe)
  const l1ContractAddress = process.env.L1_CONTRACT_ADDRESS || ethers.constants.AddressZero;
  
  // Desplegar como proxy upgradeable
  const brainSafesArbitrum = await upgrades.deployProxy(
    BrainSafesArbitrum, 
    [l1ContractAddress], 
    { 
      initializer: 'initialize',
      kind: 'uups',
      gasPrice: isArbitrumOne ? ethers.utils.parseUnits('0.1', 'gwei') : undefined,
      gasLimit: 8000000
    }
  );
  
  await brainSafesArbitrum.deployed();
  console.log(`BrainSafesArbitrum desplegado en: ${brainSafesArbitrum.address}`);

  // Configurar roles y permisos
  console.log("Configurando roles y permisos...");
  
  // Otorgar rol de minter al contrato principal
  const MINTER_ROLE = await eduToken.MINTER_ROLE();
  await eduToken.grantRole(MINTER_ROLE, brainSafesArbitrum.address);
  console.log(`Rol MINTER_ROLE otorgado a BrainSafesArbitrum`);
  
  // Otorgar rol de bridge al deployer para configuración inicial
  const BRIDGE_ROLE = await eduToken.BRIDGE_ROLE();
  await eduToken.grantRole(BRIDGE_ROLE, deployer.address);
  console.log(`Rol BRIDGE_ROLE otorgado al deployer`);
  
  // Configurar dirección de L1 en el token EDU
  if (l1ContractAddress !== ethers.constants.AddressZero) {
    await eduToken.setL1TokenAddress(l1ContractAddress);
    console.log(`Dirección de L1 configurada en EDUToken: ${l1ContractAddress}`);
  }

  // Configurar contratos en BrainSafesArbitrum
  console.log("Configurando referencias de contratos en BrainSafesArbitrum...");
  await brainSafesArbitrum.setEDUToken(eduToken.address);
  await brainSafesArbitrum.setCertificateNFT(certificateNFT.address);
  await brainSafesArbitrum.setAIOracle(aiOracle.address);
  await brainSafesArbitrum.setScholarshipManager(scholarshipManager.address);
  await brainSafesArbitrum.setJobMarketplace(jobMarketplace.address);
  console.log("Referencias de contratos configuradas correctamente");

  // Verificar la implementación
  console.log("Verificando implementación...");
  const implAddress = await upgrades.erc1967.getImplementationAddress(brainSafesArbitrum.address);
  console.log(`Dirección de implementación: ${implAddress}`);

  // Calcular el costo de gas estimado para las operaciones comunes
  console.log("Calculando costos de gas para operaciones comunes...");
  
  // Ejemplo: Crear un certificado
  const createCertTx = await brainSafesArbitrum.estimateGas.createCertificate(
    deployer.address,
    "https://example.com/certificate/1",
    100
  ).catch(e => console.log("Error al estimar gas para createCertificate:", e.message));
  
  if (createCertTx) {
    console.log(`Gas estimado para createCertificate: ${createCertTx.toString()}`);
  }

  // Imprimir resumen de despliegue
  console.log("\n=== RESUMEN DE DESPLIEGUE EN ARBITRUM ===");
  console.log(`Red: ${isArbitrumOne ? "Arbitrum One (mainnet)" : "Arbitrum Sepolia (testnet)"}`);
  console.log(`EDUToken: ${eduToken.address}`);
  console.log(`CertificateNFT: ${certificateNFT.address}`);
  console.log(`AIOracle: ${aiOracle.address}`);
  console.log(`ScholarshipManager: ${scholarshipManager.address}`);
  console.log(`JobMarketplace: ${jobMarketplace.address}`);
  console.log(`BrainSafesArbitrum (Proxy): ${brainSafesArbitrum.address}`);
  console.log(`BrainSafesArbitrum (Impl): ${implAddress}`);
  console.log("=====================================\n");

  // Guardar las direcciones para verificación
  const fs = require("fs");
  const deploymentInfo = {
    network: isArbitrumOne ? "arbitrum_one" : "arbitrum_sepolia",
    chainId: chainId,
    timestamp: new Date().toISOString(),
    eduToken: eduToken.address,
    certificateNFT: certificateNFT.address,
    aiOracle: aiOracle.address,
    scholarshipManager: scholarshipManager.address,
    jobMarketplace: jobMarketplace.address,
    brainSafesProxy: brainSafesArbitrum.address,
    brainSafesImpl: implAddress
  };

  fs.writeFileSync(
    `deployment-arbitrum-${isArbitrumOne ? "mainnet" : "sepolia"}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Información de despliegue guardada en archivo JSON");
  console.log("Despliegue en Arbitrum completado con éxito!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el despliegue:", error);
    process.exit(1);
  }); 