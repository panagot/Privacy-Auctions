/** Browser SHA-256 → lowercase hex digest. */
export async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sealedBidCommitment(
  auctionId: string,
  bidder: string,
  amountBaseUnits: bigint,
  salt: string,
): Promise<string> {
  const payload = `${auctionId}:${bidder}:${amountBaseUnits.toString()}:${salt}`;
  return sha256Hex(payload);
}
