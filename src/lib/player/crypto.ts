import { IV_BYTES } from "./format";

export class DecryptError extends Error {
  constructor(message = "Could not decrypt this content") {
    super(message);
    this.name = "DecryptError";
  }
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64.replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const keyCache = new Map<string, Promise<CryptoKey>>();

function importKey(keyB64: string): Promise<CryptoKey> {
  let p = keyCache.get(keyB64);
  if (!p) {
    p = crypto.subtle.importKey("raw", base64ToBytes(keyB64), "AES-GCM", false, ["decrypt"]);
    keyCache.set(keyB64, p);
    if (keyCache.size > 8) keyCache.delete(keyCache.keys().next().value as string);
  }
  return p;
}

/** Decrypt `iv(12) | ciphertext | tag(16)` with AES-256-GCM and the given AAD. */
export async function decryptBlob(
  data: ArrayBuffer | Uint8Array,
  keyB64: string,
  aad: string,
): Promise<ArrayBuffer> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.length < IV_BYTES + 16) throw new DecryptError("Encrypted file is too short");
  try {
    const key = await importKey(keyB64);
    return await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.slice(0, IV_BYTES), additionalData: new TextEncoder().encode(aad) },
      key,
      bytes.slice(IV_BYTES),
    );
  } catch (e) {
    if (e instanceof DecryptError) throw e;
    throw new DecryptError();
  }
}

export async function decryptText(data: ArrayBuffer | Uint8Array, keyB64: string, aad: string) {
  return new TextDecoder().decode(await decryptBlob(data, keyB64, aad));
}
