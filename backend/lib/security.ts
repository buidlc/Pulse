import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_MIMES = new Set([
  'video/mp4',
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.sh', '.py', '.js', '.php', '.bat', '.cmd', '.ps1',
  '.msi', '.dmg', '.dll', '.rb', '.pl', '.jar', '.scr', '.vbs',
  '.html', '.htm', '.svg',
]);

const MAX_VIDEO_SIZE = 4 * 1024 * 1024 * 1024;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_PDF_SIZE = 50 * 1024 * 1024;

export interface FileMeta {
  mime: string;
  ext: string;
  size: number;
}

export async function validateFile(file: File): Promise<FileMeta> {
  const buffer = await file.arrayBuffer();
  const detected = await fileTypeFromBuffer(buffer);
  if (!detected || !ALLOWED_MIMES.has(detected.mime)) {
    throw new Error('File type not permitted');
  }
  const lastDot = file.name.lastIndexOf('.');
  const ext = lastDot >= 0 ? file.name.slice(lastDot).toLowerCase() : '';
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error('File extension not permitted');
  }
  if (detected.mime === 'video/mp4' && file.size > MAX_VIDEO_SIZE) {
    throw new Error('Video file exceeds 4GB limit');
  }
  if (detected.mime.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image file exceeds 5MB limit');
  }
  if (detected.mime === 'application/pdf' && file.size > MAX_PDF_SIZE) {
    throw new Error('PDF file exceeds 50MB limit');
  }
  return { mime: detected.mime, ext, size: file.size };
}

export const MIN_WALLET_AGE_SECONDS = 24 * 60 * 60;

export async function checkWalletAge(walletAddress: string): Promise<boolean> {
  const { aptos } = await import('@shared/lib/aptos');
  try {
    const info = await aptos.account.getAccountInfo({ accountAddress: walletAddress });
    const seq = Number(info.sequence_number ?? 0);
    return seq > 0;
  } catch {
    return false;
  }
}

export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.warn('[pulse] TURNSTILE_SECRET not set — bot protection disabled');
    return true;
  }
  const params = new URLSearchParams();
  params.append('secret', secret);
  params.append('response', token);
  if (ip) params.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
    });
    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export async function verifyWalletSignature(args: {
  wallet: string;
  message: string;
  signature: string;
  publicKey: string;
}): Promise<boolean> {
  try {
    const { Ed25519PublicKey, Ed25519Signature } = await import('@aptos-labs/ts-sdk');
    const pk = new Ed25519PublicKey(args.publicKey);
    const sig = new Ed25519Signature(args.signature);
    return pk.verifySignature({
      message: new TextEncoder().encode(args.message),
      signature: sig,
    });
  } catch (err) {
    console.error('[pulse] verifyWalletSignature failed', err);
    return false;
  }
}
