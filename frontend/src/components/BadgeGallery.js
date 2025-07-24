import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const ERC721_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)"
];

const BADGE_CONTRACT_ADDRESS = "0x..."; // Dirección de BadgeNFT

export default function BadgeGallery({ userAddress }) {
  const [badges, setBadges] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const provider = new window.ethers.providers.JsonRpcProvider("https://arbitrum-mainnet.infura.io/v3/tu-api-key");
        const contract = new window.ethers.Contract(BADGE_CONTRACT_ADDRESS, ERC721_ABI, provider);
        const balance = await contract.balanceOf(userAddress);
        const badgeList = [];
        for (let i = 0; i < balance; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
          let tokenURI = await contract.tokenURI(tokenId);
          if (tokenURI.startsWith("ipfs://")) {
            tokenURI = `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`;
          }
          const metaRes = await fetch(tokenURI);
          const metadata = await metaRes.json();
          let image = metadata.image;
          if (image && image.startsWith("ipfs://")) {
            image = `https://ipfs.io/ipfs/${image.replace("ipfs://", "")}`;
          }
          badgeList.push({
            tokenId: tokenId.toString(),
            name: metadata.name,
            description: metadata.description,
            image,
            attributes: metadata.attributes,
            tokenURI,
          });
        }
        setBadges(badgeList);
      } catch (err) {
        setBadges([]);
      }
      setLoading(false);
    };
    fetchBadges();
  }, [userAddress]);

  useEffect(() => {
    if (!userAddress) return;
    const fetchNotifications = async () => {
      const res = await fetch(`/api/notifications/${userAddress}`);
      const data = await res.json();
      setNotifications(data);
      // Mostrar toast para nuevos badges no leídos
      data.filter(n => !n.read && n.title.includes("badge")).forEach(n => {
        toast.info(`${n.title}: ${n.message}`, {
          onClick: () => window.open(n.link, "_blank"),
        });
      });
    };
    fetchNotifications();
  }, [userAddress]);

  return (
    <div>
      <h2>Mis Badges</h2>
      {loading && <p>Cargando badges...</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        {badges.map(badge => (
          <div key={badge.tokenId} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, width: 250 }}>
            <img src={badge.image} alt={badge.name} style={{ width: "100%", borderRadius: 8 }} />
            <h4>{badge.name}</h4>
            <p style={{ fontSize: 13 }}>{badge.description}</p>
            <a href={badge.tokenURI} target="_blank" rel="noopener noreferrer">Ver metadatos</a>
            {badge.attributes && (
              <ul style={{ fontSize: 12, marginTop: 8 }}>
                {badge.attributes.map((attr, i) => (
                  <li key={i}><b>{attr.trait_type}:</b> {attr.value}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      {!loading && badges.length === 0 && <p>No tienes badges aún.</p>}
    </div>
  );
} 