/** Cobalt Workshop design reminder: each tool remembers ordinary work quietly, but never stores sensitive credentials or secrets. */
import { useEffect, useState } from "react";
import { safeGet, safeSet, toolMemoryKey } from "@/lib/storage";

const sensitiveSlugs = new Set([
  "password-generator", "password-strength-analyzer", "passphrase-generator", "bcrypt-hash-compare",
  "encrypt-decrypt-text", "rsa-key-pair-generator", "totp-otp-generator", "jwt-decoder-debugger",
  "secure-token-generator", "basic-auth-header", "bip39-mnemonic-generator", "hmac-generator",
]);

export function canRememberToolInput(slug: string) { return !sensitiveSlugs.has(slug); }

export function useToolInputMemory(slug: string, initialValue = "") {
  const canRemember = canRememberToolInput(slug);
  const [input, setInput] = useState(initialValue);
  const [savedInput] = useState(() => canRemember ? safeGet(toolMemoryKey(slug), "") : "");
  const [restoreAvailable, setRestoreAvailable] = useState(Boolean(savedInput && savedInput !== initialValue));
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    if (!canRemember || !input.trim()) return;
    const result = safeSet(toolMemoryKey(slug), input);
    if (!result.ok) setStorageWarning(true);
  }, [canRemember, input, slug]);

  const restore = () => { setInput(savedInput); setRestoreAvailable(false); };
  return { input, setInput, restoreAvailable, restore, canRemember, storageWarning };
}
