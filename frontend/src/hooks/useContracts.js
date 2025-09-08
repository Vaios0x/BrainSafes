import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS, getContractAddress, getContractABI } from '../config/contracts';

export const useContracts = () => {
  const { address, isConnected, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [contracts, setContracts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contracts when wallet is connected
  useEffect(() => {
    const initializeContracts = async () => {
      if (!isConnected || !walletClient || !chainId) {
        setContracts({});
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if we're on a supported network
        if (chainId !== 421614) {
          throw new Error('Please switch to Arbitrum Sepolia network');
        }

        // Create provider from wallet client
        const provider = new ethers.BrowserProvider(walletClient);
        const signer = await provider.getSigner();

        // Initialize all contracts
        const contractInstances = {
          eduToken: new ethers.Contract(
            getContractAddress('SimpleEDUToken', chainId),
            getContractABI('SimpleEDUToken'),
            signer
          ),
          certificateNFT: new ethers.Contract(
            getContractAddress('SimpleCertificateNFT', chainId),
            getContractABI('SimpleCertificateNFT'),
            signer
          ),
          courseNFT: new ethers.Contract(
            getContractAddress('SimpleCourseNFT', chainId),
            getContractABI('SimpleCourseNFT'),
            signer
          ),
          jobMarketplace: new ethers.Contract(
            getContractAddress('SimpleJobMarketplace', chainId),
            getContractABI('SimpleJobMarketplace'),
            signer
          )
        };

        setContracts(contractInstances);
      } catch (err) {
        console.error('Error initializing contracts:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContracts();
  }, [isConnected, walletClient, chainId]);

  // Contract interaction helpers
  const callContract = useCallback(async (contractName, methodName, args = [], options = {}) => {
    try {
      if (!contracts[contractName]) {
        throw new Error(`Contract ${contractName} not initialized`);
      }

      const contract = contracts[contractName];
      const method = contract[methodName];

      if (!method) {
        throw new Error(`Method ${methodName} not found on contract ${contractName}`);
      }

      // Check if method is payable and handle value
      const tx = await method(...args, options);
      
      // If it's a transaction, wait for confirmation
      if (tx && typeof tx.wait === 'function') {
        const receipt = await tx.wait();
        return receipt;
      }
      
      // If it's a view function, return the result directly
      return tx;
    } catch (err) {
      console.error(`Error calling ${contractName}.${methodName}:`, err);
      throw err;
    }
  }, [contracts]);

  // EDU Token helpers
  const getEDUBalance = useCallback(async (userAddress = address) => {
    if (!userAddress) return '0';
    try {
      const balance = await callContract('eduToken', 'balanceOf', [userAddress]);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error('Error getting EDU balance:', err);
      return '0';
    }
  }, [address, callContract]);

  const approveEDU = useCallback(async (spenderAddress, amount) => {
    const amountInWei = ethers.parseEther(amount.toString());
    return callContract('eduToken', 'approve', [spenderAddress, amountInWei]);
  }, [callContract]);

  // Certificate NFT helpers
  const issueCertificate = useCallback(async (recipient, courseName, studentName, ipfsHash) => {
    return callContract('certificateNFT', 'issueCertificate', [recipient, courseName, studentName, ipfsHash]);
  }, [callContract]);

  const getCertificate = useCallback(async (tokenId) => {
    return callContract('certificateNFT', 'getCertificate', [tokenId]);
  }, [callContract]);

  // Course NFT helpers
  const createCourse = useCallback(async (title, description, price, duration, ipfsHash) => {
    const priceInWei = ethers.parseEther(price.toString());
    return callContract('courseNFT', 'createCourse', [title, description, priceInWei, duration, ipfsHash]);
  }, [callContract]);

  const enrollInCourse = useCallback(async (courseId, price) => {
    const priceInWei = ethers.parseEther(price.toString());
    return callContract('courseNFT', 'enrollInCourse', [courseId], { value: priceInWei });
  }, [callContract]);

  const getCourse = useCallback(async (courseId) => {
    return callContract('courseNFT', 'getCourse', [courseId]);
  }, [callContract]);

  const isEnrolled = useCallback(async (courseId, studentAddress = address) => {
    if (!studentAddress) return false;
    return callContract('courseNFT', 'isEnrolled', [courseId, studentAddress]);
  }, [address, callContract]);

  // Job Marketplace helpers
  const postJob = useCallback(async (title, description, budget, deadline, requiredSkills) => {
    const budgetInWei = ethers.parseEther(budget.toString());
    return callContract('jobMarketplace', 'postJob', [title, description, budgetInWei, deadline, requiredSkills]);
  }, [callContract]);

  const applyForJob = useCallback(async (jobId, proposal, proposedBudget) => {
    const budgetInWei = ethers.parseEther(proposedBudget.toString());
    return callContract('jobMarketplace', 'applyForJob', [jobId, proposal, budgetInWei]);
  }, [callContract]);

  const assignJob = useCallback(async (jobId, freelancerAddress) => {
    return callContract('jobMarketplace', 'assignJob', [jobId, freelancerAddress]);
  }, [callContract]);

  const completeJob = useCallback(async (jobId) => {
    return callContract('jobMarketplace', 'completeJob', [jobId]);
  }, [callContract]);

  const getJob = useCallback(async (jobId) => {
    return callContract('jobMarketplace', 'getJob', [jobId]);
  }, [callContract]);

  const getActiveJobs = useCallback(async () => {
    return callContract('jobMarketplace', 'getActiveJobs');
  }, [callContract]);

  const getJobApplications = useCallback(async (jobId) => {
    return callContract('jobMarketplace', 'getJobApplications', [jobId]);
  }, [callContract]);

  return {
    // Contract instances
    contracts,
    isLoading,
    error,
    isConnected: isConnected && Object.keys(contracts).length > 0,
    
    // Generic contract caller
    callContract,
    
    // EDU Token functions
    getEDUBalance,
    approveEDU,
    
    // Certificate NFT functions
    issueCertificate,
    getCertificate,
    
    // Course NFT functions
    createCourse,
    enrollInCourse,
    getCourse,
    isEnrolled,
    
    // Job Marketplace functions
    postJob,
    applyForJob,
    assignJob,
    completeJob,
    getJob,
    getActiveJobs,
    getJobApplications,
    
    // Contract addresses for reference
    addresses: CONTRACT_ADDRESSES.ARBITRUM_SEPOLIA
  };
};