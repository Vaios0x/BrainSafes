import { useState } from "react";
import { ethers } from "ethers";
import LoanManagerABI from "../artifacts/LoanManager.json";

export function useLoanManager(contractAddress) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, LoanManagerABI, signer);
  };

  const requestLoan = async (amount, interest, duration) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.requestLoan(amount, interest, duration);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const fundLoan = async (loanId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.fundLoan(loanId);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const repayLoan = async (loanId, amount) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.repayLoan(loanId, amount);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const markDefault = async (loanId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.markDefault(loanId);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const liquidateLoan = async (loanId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.liquidateLoan(loanId);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const getLoanStatus = async (loanId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const status = await contract.getLoanStatus(loanId);
      setLoading(false);
      return Number(status);
    } catch (err) {
      setLoading(false); setError(err.message);
      return null;
    }
  };

  return {
    requestLoan,
    fundLoan,
    repayLoan,
    markDefault,
    liquidateLoan,
    getLoanStatus,
    loading,
    error
  };
} 