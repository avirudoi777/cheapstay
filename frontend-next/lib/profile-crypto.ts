import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function getKey(): Buffer {
  const hex = process.env.PROFILE_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('PROFILE_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  return Buffer.from(hex, 'hex');
}

// AES-256-GCM — authenticated encryption, tamper-proof
export function encryptField(plaintext: string): string {
  if (!plaintext) return '';
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 128-bit auth tag
  // Store as base64url: iv:tag:ciphertext
  return [iv, tag, encrypted].map(b => b.toString('base64url')).join('.');
}

export function decryptField(encoded: string): string {
  if (!encoded) return '';
  try {
    const key = getKey();
    const parts = encoded.split('.');
    if (parts.length !== 3) return '';
    const [iv, tag, enc] = parts.map(p => Buffer.from(p, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc).toString('utf8') + decipher.final('utf8');
  } catch {
    return ''; // decryption failed (wrong key or tampered)
  }
}
