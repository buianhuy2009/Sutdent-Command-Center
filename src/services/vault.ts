const VAULT_KEY = 'scc_vault_encrypted';
const SALT_KEY = 'scc_vault_salt';
const ITER = 120000;

function bufToB64(buf: ArrayBuffer): string { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64ToBuf(b64: string): ArrayBuffer { const bin = atob(b64); const arr = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) arr[i]=bin.charCodeAt(i); return arr.buffer; }
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(pin);
  const base = await crypto.subtle.importKey('raw', enc, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations: ITER, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
}
export async function vaultSet(pin: string, data: Record<string, string>): Promise<void> {
  let saltB64 = localStorage.getItem(SALT_KEY);
  let salt: Uint8Array;
  if (!saltB64) { salt = crypto.getRandomValues(new Uint8Array(16)); localStorage.setItem(SALT_KEY, bufToB64(salt.buffer as ArrayBuffer)); }
  else salt = new Uint8Array(b64ToBuf(saltB64));
  const key = await deriveKey(pin, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const pt = new TextEncoder().encode(JSON.stringify(data));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, pt);
  localStorage.setItem(VAULT_KEY, JSON.stringify({ iv: bufToB64(iv.buffer as ArrayBuffer), ct: bufToB64(ct) }));
}
export async function vaultGet(pin: string): Promise<Record<string,string> | null> {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    const saltB64 = localStorage.getItem(SALT_KEY);
    if (!raw || !saltB64) return null;
    const { iv, ct } = JSON.parse(raw);
    const salt = new Uint8Array(b64ToBuf(saltB64));
    const key = await deriveKey(pin, salt);
    const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv: b64ToBuf(iv) }, key, b64ToBuf(ct));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}
export function vaultExists(): boolean { return !!localStorage.getItem(VAULT_KEY); }
export function vaultClear() { localStorage.removeItem(VAULT_KEY); localStorage.removeItem(SALT_KEY); }
