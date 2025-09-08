// Contract addresses on Arbitrum Sepolia
export const CONTRACT_ADDRESSES = {
  ARBITRUM_SEPOLIA: {
    chainId: 421614,
    SimpleEDUToken: "0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2",
    SimpleCertificateNFT: "0x15164c7C1E5ced9788c2fB82424fe595950ee261",
    SimpleCourseNFT: "0x0E98bc946F105e0371AD6D338d6814A4fcBBaC27",
    SimpleJobMarketplace: "0x367C47E8f43649155720E30c5Cbdd4A10953a19A"
  }
};

// Network configuration
export const SUPPORTED_NETWORKS = {
  421614: {
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    nativeCurrency: {
      name: "ETH",
      symbol: "ETH",
      decimals: 18
    }
  }
};

// Contract ABIs (simplified versions for the deployed simple contracts)
export const CONTRACT_ABIS = {
  SimpleEDUToken: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],
  
  SimpleCertificateNFT: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function issueCertificate(address recipient, string courseName, string studentName, string ipfsHash) returns (uint256)",
    "function getCertificate(uint256 tokenId) view returns (tuple(string courseName, string studentName, uint256 issueDate, string ipfsHash, bool isVerified))",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event CertificateIssued(uint256 indexed tokenId, address indexed recipient, string courseName)"
  ],
  
  SimpleCourseNFT: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address owner) view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function createCourse(string title, string description, uint256 price, uint256 duration, string ipfsHash) returns (uint256)",
    "function enrollInCourse(uint256 courseId) payable",
    "function getCourse(uint256 courseId) view returns (tuple(string title, string description, address instructor, uint256 price, uint256 duration, string ipfsHash, bool isActive, uint256 enrolledCount))",
    "function isEnrolled(uint256 courseId, address student) view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event CourseCreated(uint256 indexed courseId, address indexed instructor, string title)",
    "event StudentEnrolled(uint256 indexed courseId, address indexed student)"
  ],
  
  SimpleJobMarketplace: [
    "function postJob(string title, string description, uint256 budget, uint256 deadline, string[] requiredSkills) returns (uint256)",
    "function applyForJob(uint256 jobId, string proposal, uint256 proposedBudget)",
    "function assignJob(uint256 jobId, address freelancer)",
    "function completeJob(uint256 jobId)",
    "function getJob(uint256 jobId) view returns (tuple(uint256 jobId, address employer, string title, string description, uint256 budget, uint256 deadline, uint8 status, address assignedFreelancer, string[] requiredSkills, uint256 createdAt))",
    "function getJobApplications(uint256 jobId) view returns (tuple(address freelancer, string proposal, uint256 proposedBudget, uint256 appliedAt, bool isAccepted)[])",
    "function getActiveJobs() view returns (uint256[])",
    "event JobPosted(uint256 indexed jobId, address indexed employer, string title, uint256 budget)",
    "event ApplicationSubmitted(uint256 indexed jobId, address indexed freelancer, uint256 proposedBudget)",
    "event JobAssigned(uint256 indexed jobId, address indexed freelancer)",
    "event JobCompleted(uint256 indexed jobId)"
  ]
};

// Get contract address for current network
export const getContractAddress = (contractName, chainId = 421614) => {
  const network = chainId === 421614 ? 'ARBITRUM_SEPOLIA' : null;
  if (!network || !CONTRACT_ADDRESSES[network]) {
    throw new Error(`Unsupported network: ${chainId}`);
  }
  return CONTRACT_ADDRESSES[network][contractName];
};

// Get contract ABI
export const getContractABI = (contractName) => {
  if (!CONTRACT_ABIS[contractName]) {
    throw new Error(`ABI not found for contract: ${contractName}`);
  }
  return CONTRACT_ABIS[contractName];
};