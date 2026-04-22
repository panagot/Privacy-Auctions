/** Devnet USDC mint (MagicBlock Private Payments default on devnet). */
export const DEVNET_USDC_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/** One-click demo deposit size (devnet). Needs that much in the wallet USDC ATA. */
export const DEFAULT_DEPOSIT_USDC = "0.1";

export const DEFAULT_CLUSTER = "devnet" as const;

export const MAGICBLOCK_PAYMENTS_URL =
  process.env.NEXT_PUBLIC_MAGICBLOCK_PAYMENTS_URL ??
  "https://payments.magicblock.app";

/** Abort MagicBlock HTTP calls after this (slow networks, hung proxies). */
export const MAGICBLOCK_FETCH_TIMEOUT_MS = 30_000;
