import { Web3Storage } from 'web3.storage';

const TOKEN = process.env.REACT_APP_WEB3STORAGE_TOKEN;
const client = new Web3Storage({ token: TOKEN });

export async function uploadMetadataToIPFS(metadata) {
  const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
  const file = new File([blob], 'metadata.json');
  const cid = await client.put([file]);
  return `https://${cid}.ipfs.dweb.link/metadata.json`;
} 