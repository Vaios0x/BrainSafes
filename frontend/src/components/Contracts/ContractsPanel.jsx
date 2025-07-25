import React, { useState } from 'react';
import ContractsTable from './ContractsTable';
import ContractDetails from './ContractDetails';
import { Container, useTheme, useMediaQuery } from '@mui/material';

// Contratos de ejemplo (simulados)
const contratosEjemplo = [
  {
    name: 'EDUToken',
    address: '0x1234...abcd',
    type: 'ERC20',
    status: 'activo',
    abi: [
      { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
      { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
    ],
    events: [
      { name: 'Transfer', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }] },
    ],
  },
  {
    name: 'BadgeNFT',
    address: '0x5678...efgh',
    type: 'ERC721',
    status: 'activo',
    abi: [
      { name: 'ownerOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
      { name: 'safeTransferFrom', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [] },
    ],
    events: [
      { name: 'Transfer', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }] },
    ],
  },
  {
    name: 'CustomVoting',
    address: '0x9abc...def0',
    type: 'Custom',
    status: 'inactivo',
    abi: [
      { name: 'vote', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'bool' }], outputs: [] },
      { name: 'getVotes', type: 'function', stateMutability: 'view', inputs: [{ name: 'proposalId', type: 'uint256' }], outputs: [{ type: 'uint256' }] },
    ],
    events: [
      { name: 'Voted', inputs: [{ name: 'voter', type: 'address' }, { name: 'proposalId', type: 'uint256' }, { name: 'support', type: 'bool' }] },
    ],
  },
];

export default function ContractsPanel() {
  const [selected, setSelected] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <h2 style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, marginBottom: isMobile ? 16 : 24, color: theme.palette.text.primary }}>Contratos Inteligentes</h2>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 18 : 32, alignItems: 'flex-start', width: '100%' }}>
        <div style={{ flex: 2, minWidth: 0 }}>
          <ContractsTable contratos={contratosEjemplo} onSelect={setSelected} selected={selected} />
        </div>
        {selected && (
          <div style={{ flex: 3, minWidth: 0 }}>
            <ContractDetails contrato={selected} />
          </div>
        )}
      </div>
    </Container>
  );
} 