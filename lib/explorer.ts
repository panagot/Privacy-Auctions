/** Solana Explorer URL helpers (devnet by default). */
export function explorerTxUrl(signature: string, cluster: string = "devnet"): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

export function explorerAddressUrl(
  address: string,
  cluster: string = "devnet",
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}

export function shortSig(sig: string, head = 6, tail = 6): string {
  if (sig.length <= head + tail + 1) return sig;
  return `${sig.slice(0, head)}…${sig.slice(-tail)}`;
}
