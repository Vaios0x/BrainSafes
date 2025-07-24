import { useState } from "react";
import { ethers } from "ethers";
import CommunityRewardsABI from "../artifacts/CommunityRewards.json";

export function useCommunityRewards(contractAddress) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, CommunityRewardsABI, signer);
  };

  const assignPoints = async (user, pts) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.assignPoints(user, pts);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const assignPointsOracle = async (user, pts) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.assignPointsOracle(user, pts);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const claimTokenReward = async (amount) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.claimTokenReward(amount);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const claimBadge = async (badgeURI) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.claimBadge(badgeURI);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const getPoints = async (user) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const pts = await contract.getPoints(user);
      setLoading(false);
      return pts.toString();
    } catch (err) {
      setLoading(false); setError(err.message);
      return null;
    }
  };

  return {
    assignPoints,
    assignPointsOracle,
    claimTokenReward,
    claimBadge,
    getPoints,
    loading,
    error
  };
} 