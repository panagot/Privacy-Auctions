import { SendTransactionError } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";

import { formatUserError } from "@/lib/error-message";

const USDC_HINT =
  "This deposit moves devnet USDC from your wallet’s USDC token account. Airdrop devnet SOL, then get devnet USDC for the same address (SPL, mint 4zMMC9…DncDU). Retry when your USDC balance is at least the amount on the button. The Token program’s “insufficient funds” / 0x1 is your SPL balance, not a MagicBlock server error.";

/**
 * For SendTransactionError, appends on-chain log tail; adds a USDC hint when
 * simulation shows insufficient token funds.
 */
export async function formatSendTransactionError(
  e: unknown,
  connection: Connection,
): Promise<string> {
  let base = formatUserError(e);

  let logs: string[] | undefined;
  if (e instanceof SendTransactionError) {
    logs = e.logs;
    if (!logs || logs.length === 0) {
      try {
        logs = await e.getLogs(connection);
      } catch {
        /* ignore */
      }
    }
  } else if (e && typeof e === "object" && "getLogs" in e) {
    const withLogs = e as { logs?: string[]; getLogs: (c: Connection) => Promise<string[]> };
    logs = withLogs.logs;
    if (!logs || logs.length === 0) {
      try {
        logs = await withLogs.getLogs(connection);
      } catch {
        /* ignore */
      }
    }
  }

  if (logs?.length) {
    const tail = logs.slice(-20).join("\n");
    if (!base.includes("— Transaction logs (tail) —")) {
      base = `${base}\n\n— Transaction logs (tail) —\n${tail}`;
    }
  }

  if (
    /insufficient funds|insufficient token|Error: insufficient funds/i.test(base)
  ) {
    if (!base.includes("4zMMC9")) {
      base = `${base}\n\n— ${USDC_HINT}`;
    }
  }
  if (/Blockhash not found|block hash not found/i.test(base)) {
    base = `${base}\n\n— Hint: the app refreshes the blockhash before signing. If you still see this, retry; devnet can be slow or the API-built tx can sit in the wallet too long.`;
  }
  return base;
}
