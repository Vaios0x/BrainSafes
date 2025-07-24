import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import ABI from "../../artifacts/contracts/CertificateNFT.json";

const CONTRACT_ADDRESS = process.env.REACT_APP_CERTIFICATE_NFT_ADDRESS;

export default function CertificateHistory({ user }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI.abi, provider);
      const balance = await contract.balanceOf(user);
      const certList = [];
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(user, i);
        const uri = await contract.tokenURI(tokenId);
        let metadata = {};
        if (uri.startsWith("http")) {
          try {
            const res = await fetch(uri);
            metadata = await res.json();
          } catch {}
        }
        certList.push({ tokenId: tokenId.toString(), metadata });
      }
      setCerts(certList);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return <div>Introduce una dirección de usuario.</div>;
  if (loading) return <div>Cargando certificados...</div>;
  if (certs.length === 0) return <div>No hay certificados NFT para este usuario.</div>;

  return (
    <div>
      <h3>Certificados NFT de {user}</h3>
      <ul>
        {certs.map(cert => (
          <li key={cert.tokenId}>
            <b>ID:</b> {cert.tokenId} <br />
            <b>Título:</b> {cert.metadata.degree || "-"} <br />
            <b>Universidad:</b> {cert.metadata.university || "-"} <br />
            <b>Fecha:</b> {cert.metadata.issuedAt || "-"}
          </li>
        ))}
      </ul>
    </div>
  );
} 