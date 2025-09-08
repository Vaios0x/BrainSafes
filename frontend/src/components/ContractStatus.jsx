import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContracts } from '../hooks/useContracts';

const ContractStatus = () => {
  const { address, isConnected, chainId } = useAccount();
  const { contracts, isLoading, error, getEDUBalance, addresses } = useContracts();
  const [eduBalance, setEduBalance] = useState('0');
  const [contractsInfo, setContractsInfo] = useState({});

  useEffect(() => {
    const loadContractInfo = async () => {
      if (!isConnected || isLoading || error) return;

      try {
        // Load EDU balance
        const balance = await getEDUBalance();
        setEduBalance(balance);

        // Load basic contract info
        if (contracts.eduToken) {
          const eduName = await contracts.eduToken.name();
          const eduSymbol = await contracts.eduToken.symbol();
          const totalSupply = await contracts.eduToken.totalSupply();

          setContractsInfo(prev => ({
            ...prev,
            eduToken: {
              name: eduName,
              symbol: eduSymbol,
              totalSupply: totalSupply.toString()
            }
          }));
        }

        if (contracts.certificateNFT) {
          const certName = await contracts.certificateNFT.name();
          const certSymbol = await contracts.certificateNFT.symbol();

          setContractsInfo(prev => ({
            ...prev,
            certificateNFT: {
              name: certName,
              symbol: certSymbol
            }
          }));
        }

        if (contracts.courseNFT) {
          const courseName = await contracts.courseNFT.name();
          const courseSymbol = await contracts.courseNFT.symbol();

          setContractsInfo(prev => ({
            ...prev,
            courseNFT: {
              name: courseName,
              symbol: courseSymbol
            }
          }));
        }

      } catch (err) {
        console.error('Error loading contract info:', err);
      }
    };

    loadContractInfo();
  }, [isConnected, isLoading, error, contracts, getEDUBalance]);

  const getNetworkName = (chainId) => {
    switch (chainId) {
      case 421614: return 'Arbitrum Sepolia';
      case 42161: return 'Arbitrum One';
      default: return `Chain ${chainId}`;
    }
  };

  const getExplorerUrl = (address, chainId) => {
    switch (chainId) {
      case 421614: return `https://sepolia.arbiscan.io/address/${address}`;
      case 42161: return `https://arbiscan.io/address/${address}`;
      default: return '#';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Wallet Not Connected</h3>
        <p className="text-yellow-600">Please connect your wallet to interact with BrainSafes contracts.</p>
      </div>
    );
  }

  if (chainId !== 421614) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-800 mb-2">Wrong Network</h3>
        <p className="text-red-600">Please switch to Arbitrum Sepolia network to use BrainSafes.</p>
        <p className="text-sm text-red-500 mt-1">Current network: {getNetworkName(chainId)}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <p className="text-blue-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-red-800 mb-2">Contract Error</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-green-800 mb-4">✅ BrainSafes Contracts Connected</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-medium text-gray-900 mb-2">Network Info</h4>
          <p className="text-sm text-gray-600">Network: {getNetworkName(chainId)}</p>
          <p className="text-sm text-gray-600">Chain ID: {chainId}</p>
          <p className="text-sm text-gray-600">Your Address: {address}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-medium text-gray-900 mb-2">Your Balance</h4>
          <p className="text-lg font-bold text-green-600">{parseFloat(eduBalance).toFixed(2)} EDU</p>
          <p className="text-sm text-gray-600">
            {contractsInfo.eduToken && `${contractsInfo.eduToken.name} (${contractsInfo.eduToken.symbol})`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Deployed Contracts</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">EDU Token</span>
              <a 
                href={getExplorerUrl(addresses.SimpleEDUToken, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View ↗
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">{addresses.SimpleEDUToken}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Certificate NFT</span>
              <a 
                href={getExplorerUrl(addresses.SimpleCertificateNFT, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View ↗
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">{addresses.SimpleCertificateNFT}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Course NFT</span>
              <a 
                href={getExplorerUrl(addresses.SimpleCourseNFT, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View ↗
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">{addresses.SimpleCourseNFT}</p>
          </div>

          <div className="bg-white rounded-lg p-3 border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Job Marketplace</span>
              <a 
                href={getExplorerUrl(addresses.SimpleJobMarketplace, chainId)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                View ↗
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-mono">{addresses.SimpleJobMarketplace}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractStatus;