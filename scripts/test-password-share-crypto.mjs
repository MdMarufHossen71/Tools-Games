const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function derive(connection, remotePublicKey, salt, passphrase) {
  const sharedBits = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: remotePublicKey }, connection.privateKey, 256));
  const passphraseBytes = encoder.encode(passphrase);
  const material = new Uint8Array(sharedBits.length + passphraseBytes.length);
  material.set(sharedBits);
  material.set(passphraseBytes, sharedBits.length);
  const base = await crypto.subtle.importKey("raw", material, "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

const sender = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
const receiver = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
const salt = crypto.getRandomValues(new Uint8Array(18));
const iv = crypto.getRandomValues(new Uint8Array(12));
const senderKey = await derive(sender, receiver.publicKey, salt, "one-extra-passphrase");
const receiverKey = await derive(receiver, sender.publicKey, salt, "one-extra-passphrase");
const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, senderKey, encoder.encode("password-share-round-trip"));
const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, receiverKey, encrypted);

if (decoder.decode(decrypted) !== "password-share-round-trip") throw new Error("ECDH-derived AES-GCM round trip failed");
console.log("Password Share ECDH/AES-GCM round trip passed.");
