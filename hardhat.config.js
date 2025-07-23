require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@arbitrum/sdk");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 421614
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_MAINNET_RPC || "https://arb1.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY,
      arbitrumSepolia: process.env.ARBISCAN_API_KEY
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  stylus: {
    // Configuración específica para Stylus
    wasmOptimizer: {
      enabled: true,
      runs: 200
    },
    compilers: [
      {
        version: "0.4.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ],
    // Configuración para verificación de contratos Stylus
    verifier: {
      apiUrl: "https://stylus-verifier.arbitrum.io/api/v1",
      compilerVersion: "v0.4.2",
      constructorArgs: [],
      optimizerRuns: 200
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    // Configuración adicional para reportes de gas detallados
    outputFile: process.env.GAS_REPORT_FILE,
    noColors: process.env.GAS_REPORT_FILE ? true : false,
    excludeContracts: ["mocks/"],
    showMethodSig: true,
    showTimeSpent: true,
    // Comparación con otras redes
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    // Estimación en múltiples monedas
    token: ["ETH", "DAI", "USDC"],
    // Comparación L1 vs L2
    compareL1L2: true,
    l1Network: "mainnet",
    l2Network: "arbitrumOne"
  },
  // Configuración de seguridad
  security: {
    // Análisis estático
    slither: {
      enabled: true,
      exclude: ["mocks/"]
    },
    // Límites de gas
    gasLimits: {
      deploy: 8000000,
      call: 3000000
    }
  },
  // Configuración de monitoreo
  monitoring: {
    enabled: true,
    tenderly: {
      project: process.env.TENDERLY_PROJECT,
      username: process.env.TENDERLY_USERNAME,
      accessKey: process.env.TENDERLY_ACCESS_KEY
    },
    // Alertas de gas
    gasAlerts: {
      threshold: 1000000,
      notification: {
        slack: process.env.SLACK_WEBHOOK_URL,
        email: process.env.ALERT_EMAIL
      }
    }
  }
}; 