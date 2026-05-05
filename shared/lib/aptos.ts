import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const SHELBYNET_REST = 'https://api.shelbynet.shelby.xyz/v1';
const SHELBYNET_INDEXER = 'https://api.shelbynet.shelby.xyz/v1/graphql';
const SHELBYNET_FAUCET = 'https://faucet.shelbynet.shelby.xyz';

type NetworkName = 'shelbynet' | 'mainnet' | 'testnet' | 'devnet';

function resolveNetworkName(): NetworkName {
  const n = (process.env.NEXT_PUBLIC_APTOS_NETWORK ?? 'shelbynet').toLowerCase();
  if (n === 'mainnet') return 'mainnet';
  if (n === 'testnet') return 'testnet';
  if (n === 'devnet') return 'devnet';
  return 'shelbynet';
}

const NETWORK_NAME: NetworkName = resolveNetworkName();
const IS_SHELBYNET = NETWORK_NAME === 'shelbynet';

function resolveSdkNetwork(): Network {
  if (NETWORK_NAME === 'mainnet') return Network.MAINNET;
  if (NETWORK_NAME === 'devnet') return Network.DEVNET;
  if (NETWORK_NAME === 'testnet') return Network.TESTNET;
  // Shelbynet isn't a SDK enum value — Network.CUSTOM lets us point to its REST URL.
  return Network.CUSTOM;
}

function resolveRestUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_APTOS_RPC?.trim();
  if (explicit) return explicit;
  if (IS_SHELBYNET) return SHELBYNET_REST;
  return undefined;
}

const config = new AptosConfig({
  network: resolveSdkNetwork(),
  fullnode: resolveRestUrl(),
  indexer: IS_SHELBYNET ? SHELBYNET_INDEXER : undefined,
  faucet: IS_SHELBYNET ? SHELBYNET_FAUCET : undefined,
  clientConfig: process.env.NEXT_PUBLIC_APTOS_API_KEY
    ? { API_KEY: process.env.NEXT_PUBLIC_APTOS_API_KEY }
    : undefined,
});

export const aptos = new Aptos(config);
export const APTOS_NETWORK = NETWORK_NAME;
export const APTOS_NETWORK_LABEL =
  NETWORK_NAME === 'shelbynet' ? 'Shelbynet' :
  NETWORK_NAME === 'mainnet' ? 'Aptos mainnet' :
  NETWORK_NAME === 'devnet' ? 'Aptos devnet' : 'Aptos testnet';

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '';
export const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET ?? '';

export const ADMIN_WALLETS: string[] = (process.env.NEXT_PUBLIC_ADMIN_WALLET ?? '')
  .split(',')
  .map((a) => a.trim().toLowerCase())
  .filter(Boolean);

export function isAdminWallet(address: string | undefined | null): boolean {
  if (!address) return false;
  return ADMIN_WALLETS.includes(address.toLowerCase());
}

export const OCTAS_PER_APT = 100_000_000;
export function octasToApt(octas: number | bigint | string): number {
  return Number(octas) / OCTAS_PER_APT;
}
export function aptToOctas(apt: number): number {
  return Math.floor(apt * OCTAS_PER_APT);
}

export function shortAddr(addr?: string | null, head = 6, tail = 4): string {
  if (!addr) return '';
  const a = addr.startsWith('0x') ? addr : '0x' + addr;
  if (a.length <= head + tail + 2) return a;
  return `${a.slice(0, 2 + head)}…${a.slice(-tail)}`;
}

/**
 * Block-explorer URL builder. Aptos Labs explorer supports Shelbynet via
 * the ?network=shelbynet query param.
 */
export function explorerTxUrl(hash: string): string {
  const net =
    IS_SHELBYNET ? 'shelbynet' :
    NETWORK_NAME === 'mainnet' ? 'mainnet' :
    NETWORK_NAME === 'devnet' ? 'devnet' : 'testnet';
  return `https://explorer.aptoslabs.com/txn/${hash}?network=${net}`;
}

export function explorerAccountUrl(addr: string): string {
  const net =
    IS_SHELBYNET ? 'shelbynet' :
    NETWORK_NAME === 'mainnet' ? 'mainnet' :
    NETWORK_NAME === 'devnet' ? 'devnet' : 'testnet';
  return `https://explorer.aptoslabs.com/account/${addr}?network=${net}`;
}
