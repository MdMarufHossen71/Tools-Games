const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+";

export function generateSecurePassword(length = 20) {
  const safeLength = Math.max(12, Math.min(128, Math.floor(length)));
  const bytes = crypto.getRandomValues(new Uint32Array(safeLength));
  return Array.from(bytes, value => alphabet[value % alphabet.length]).join("");
}
