import React, { useState } from "react";
import { ethers } from "ethers";
import ABI from "../../artifacts/contracts/GenericNFTBridge.json";

const BRIDGE_ADDRESS = process.env.REACT_APP_BRIDGE_ADDRESS;
const NETWORKS = [
  { id: 137, name: "Polygon" },
  { id: 56, name: "BSC" },
  { id: 42161, name: "Arbitrum" }
];

export default function NFTBridgePanel({ user }) {
  const [tokenId, setTokenId] = useState("");
  const [targetChain, setTargetChain] = useState(NETWORKS[0].name);
  const [status, setStatus] = useState("");

  const handleBridge = async (e) => {
    e.preventDefault();
    setStatus("Enviando transacción...");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(BRIDGE_ADDRESS, ABI.abi, signer);
      const tx = await contract.requestBridge(tokenId, targetChain);
      await tx.wait();
      setStatus("Solicitud de puente enviada. Espera la confirmación en la red destino.");
    } catch (err) {
      setStatus("Error: " + (err.reason || err.message));
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto" }}>
      <h3>Puente NFT Multi-Chain</h3>
      <form onSubmit={handleBridge}>
        <input
          value={tokenId}
          onChange={e => setTokenId(e.target.value)}
          placeholder="Token ID"
          required
        />
        <select value={targetChain} onChange={e => setTargetChain(e.target.value)}>
          {NETWORKS.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
        </select>
        <button type="submit">Solicitar Puente</button>
      </form>
      {status && <div style={{ marginTop: 20 }}>{status}</div>}
      <div style={{ marginTop: 30, fontSize: 12, color: '#888' }}>
        <b>Nota:</b> El NFT será bloqueado en la red actual y minteado en la red destino por el oráculo/bridge.<br />
        Requiere que el usuario apruebe la transferencia del NFT al contrato bridge.
      </div>
    </div>
  );
} 