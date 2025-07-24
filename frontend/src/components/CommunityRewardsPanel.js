import React, { useState } from "react";
import { useCommunityRewards } from "../hooks/useCommunityRewards";

export default function CommunityRewardsPanel({ contractAddress }) {
  const {
    assignPoints,
    assignPointsOracle,
    claimTokenReward,
    claimBadge,
    getPoints,
    loading,
    error
  } = useCommunityRewards(contractAddress);

  const [user, setUser] = useState("");
  const [pts, setPts] = useState("");
  const [amount, setAmount] = useState("");
  const [badgeURI, setBadgeURI] = useState("");
  const [pointsResult, setPointsResult] = useState("");

  return (
    <div>
      <h3>Asignar Puntos (Admin)</h3>
      <input value={user} onChange={e => setUser(e.target.value)} placeholder="Dirección usuario" />
      <input value={pts} onChange={e => setPts(e.target.value)} placeholder="Puntos" />
      <button onClick={() => assignPoints(user, pts)} disabled={loading}>Asignar</button>
      <button onClick={() => assignPointsOracle(user, pts)} disabled={loading}>Asignar (Oráculo)</button>
      <h3>Reclamar Tokens</h3>
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Cantidad" />
      <button onClick={() => claimTokenReward(amount)} disabled={loading}>Reclamar</button>
      <h3>Reclamar Badge</h3>
      <input value={badgeURI} onChange={e => setBadgeURI(e.target.value)} placeholder="Badge URI" />
      <button onClick={() => claimBadge(badgeURI)} disabled={loading}>Reclamar Badge</button>
      <h3>Consultar Puntos</h3>
      <button onClick={async () => setPointsResult(await getPoints(user))} disabled={loading}>Consultar</button>
      {pointsResult && <div>Puntos: {pointsResult}</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
    </div>
  );
} 