import React, { useEffect, useState } from "react";

export default function BadgeHistory({ userAddress, badgeContract, accreditationContract }) {
  const [revoked, setRevoked] = useState([]);
  const [endorsements, setEndorsements] = useState([]);

  useEffect(() => {
    if (!userAddress || !badgeContract) return;
    const fetchRevoked = async () => {
      // Consulta eventos BadgeRevoked del contrato
      const provider = new window.ethers.providers.JsonRpcProvider("https://arbitrum-mainnet.infura.io/v3/tu-api-key");
      const contract = new window.ethers.Contract(badgeContract, [
        "event BadgeRevoked(address indexed from, uint256 indexed tokenId)"
      ], provider);
      const filter = contract.filters.BadgeRevoked(userAddress);
      const events = await contract.queryFilter(filter);
      setRevoked(events.map(e => ({ tokenId: e.args.tokenId.toString(), block: e.blockNumber })));
    };
    fetchRevoked();
  }, [userAddress, badgeContract]);

  useEffect(() => {
    if (!accreditationContract || !userAddress) return;
    const fetchEndorsements = async () => {
      // Consulta endorsements del backend o contrato
      const res = await fetch(`/api/accreditation/endorsements/${userAddress}`);
      const data = await res.json();
      setEndorsements(data);
    };
    fetchEndorsements();
  }, [accreditationContract, userAddress]);

  return (
    <div>
      <h3>Historial de revocaciones</h3>
      {revoked.length === 0 ? <p>No tienes badges revocados.</p> : (
        <ul>
          {revoked.map(r => (
            <li key={r.tokenId}>Badge #{r.tokenId} revocado (block {r.block})</li>
          ))}
        </ul>
      )}
      <h3>Endorsements recibidos</h3>
      {endorsements.length === 0 ? <p>No tienes endorsements.</p> : (
        <ul>
          {endorsements.map(addr => (
            <li key={addr}>{addr}</li>
          ))}
        </ul>
      )}
    </div>
  );
} 