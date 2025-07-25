import React, { useState } from 'react';
import NFTGallery from './NFTGallery';
import MarketplaceFilters from './MarketplaceFilters';
import { Container, useTheme, useMediaQuery } from '@mui/material';

// NFTs simulados
const nftsEjemplo = [
  {
    id: 1,
    name: 'Brain NFT #1',
    image: 'https://placekitten.com/300/300',
    owner: '0x1234...abcd',
    price: 1.2,
    status: 'en venta',
    rarity: 'Legendario',
    attributes: [
      { trait_type: 'Color', value: 'Azul' },
      { trait_type: 'Nivel', value: '5' },
    ],
    description: 'NFT único de la colección BrainSafes.',
    history: [
      { from: '0x0000...0000', to: '0x1234...abcd', date: '2024-07-01', price: 1.2 },
    ],
  },
  {
    id: 2,
    name: 'Brain NFT #2',
    image: 'https://placekitten.com/301/301',
    owner: '0x5678...efgh',
    price: 0.8,
    status: 'vendido',
    rarity: 'Raro',
    attributes: [
      { trait_type: 'Color', value: 'Rojo' },
      { trait_type: 'Nivel', value: '3' },
    ],
    description: 'NFT especial de la colección BrainSafes.',
    history: [
      { from: '0x0000...0000', to: '0x5678...efgh', date: '2024-06-15', price: 0.8 },
    ],
  },
];

const filtrosIniciales = {
  nombre: '',
  rareza: 'all',
  estado: 'all',
};

export default function MarketplacePanel() {
  const [nfts] = useState(nftsEjemplo);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Filtrado de NFTs
  const filteredNFTs = nfts.filter(nft => {
    const matchNombre = filtros.nombre === '' || nft.name.toLowerCase().includes(filtros.nombre.toLowerCase());
    const matchRareza = filtros.rareza === 'all' || nft.rarity === filtros.rareza;
    const matchEstado = filtros.estado === 'all' || nft.status === filtros.estado;
    return matchNombre && matchRareza && matchEstado;
  });

  return (
    <Container
      maxWidth="lg"
      disableGutters={isMobile}
      style={{
        padding: isMobile ? '1rem 0.5rem' : '2.5rem 2rem',
        background: theme.palette.background.default,
        minHeight: '100vh',
      }}
    >
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>Marketplace de NFTs</h2>
      <MarketplaceFilters filtros={filtros} setFiltros={setFiltros} />
      <NFTGallery nfts={filteredNFTs} isMobile={isMobile} />
    </Container>
  );
} 