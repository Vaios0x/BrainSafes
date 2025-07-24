import { useState } from "react";
import { ethers } from "ethers";
import MentorshipABI from "../artifacts/MentorshipProgram.json";

export function useMentorship(contractAddress) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, MentorshipABI, signer);
  };

  const registerMentor = async () => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.registerMentor();
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const requestMentorship = async (mentor) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.requestMentorship(mentor);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const acceptMentorship = async (mentorshipId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.acceptMentorship(mentorshipId);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const endMentorship = async (mentorshipId) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.endMentorship(mentorshipId);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  const submitFeedback = async (mentorshipId, rating, feedback) => {
    setLoading(true); setError(null);
    try {
      const contract = await getContract();
      const tx = await contract.submitFeedback(mentorshipId, rating, feedback);
      await tx.wait();
      setLoading(false);
      return { success: true, txHash: tx.hash };
    } catch (err) {
      setLoading(false); setError(err.message);
      return { error: err.message };
    }
  };

  return {
    registerMentor,
    requestMentorship,
    acceptMentorship,
    endMentorship,
    submitFeedback,
    loading,
    error
  };
} 