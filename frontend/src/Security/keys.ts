export async function generateMasterKey(): Promise<Uint8Array> {
  const key = crypto.getRandomValues(new Uint8Array(32)) // AES-256
  return key
}

export async function encryptWithKey(
  data: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  )
  const out = new Uint8Array(iv.length + ciphertext.byteLength)
  out.set(iv)
  out.set(new Uint8Array(ciphertext), iv.length)
  return out
}

export async function deriveDedupeKey(
  masterKey: CryptoKey,
): Promise<CryptoKey> {
  const raw = await crypto.subtle.exportKey("raw", masterKey)
  const hmacKeyMaterial = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const subkeyBytes = await crypto.subtle.sign(
    "HMAC",
    hmacKeyMaterial,
    new TextEncoder().encode("finance-tracker:dedupe:v1"),
  )
  return crypto.subtle.importKey(
    "raw",
    subkeyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
}

export async function hmacHex(key: CryptoKey, input: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(input),
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function decryptWithKey(
  ciphertext: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  const iv = ciphertext.slice(0, 12)
  const data = ciphertext.slice(12)
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  )
  return new Uint8Array(decrypted)
}

export async function deriveKey(
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  )
}

export async function generateKeySalt(
  password: string,
): Promise<{ master_key: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derivedKey = await deriveKey(password, salt)
  const masterKey = await generateMasterKey()
  const encryptedMasterKey = await encryptWithKey(masterKey, derivedKey)

  return {
    master_key: btoa(
      String.fromCharCode(...new Uint8Array(encryptedMasterKey)),
    ),
    salt: btoa(String.fromCharCode(...salt)),
  }
}

export async function decryptMasterKey(
  salt: string,
  encryptedMasterKey: string,
  password: string,
): Promise<CryptoKey> {
  const saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0))

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 100_000,
      hash: "SHA-256",
    },
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"],
    ),
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"],
  )

  const encryptedMasterKeyBytes = Uint8Array.from(
    atob(encryptedMasterKey),
    (c) => c.charCodeAt(0),
  )
  const iv = encryptedMasterKeyBytes.slice(0, 12)

  const masterKeyRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    derivedKey,
    encryptedMasterKeyBytes.slice(12),
  )

  const masterKey = await crypto.subtle.importKey(
    "raw",
    masterKeyRaw,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"],
  )

  return masterKey
}

export async function exportMasterKey(key: CryptoKey): Promise<string> {
  const jwk = await crypto.subtle.exportKey("jwk", key)
  return JSON.stringify(jwk)
}

export async function importMasterKey(jwkJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkJson) as JsonWebKey
  return crypto.subtle.importKey("jwk", jwk, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ])
}
