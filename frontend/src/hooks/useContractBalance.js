import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../utils/contract";

export function useContractBalance(address) {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!window.ethereum || !address) return;
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = getContract(provider);
      const bal = await contract.balanceOf(address);
      setBalance(bal);
    }
    fetchBalance();
  }, [address]);

  return balance;
} 