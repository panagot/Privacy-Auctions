import type {
  SignerWalletAdapter,
  WalletAdapter,
} from "@solana/wallet-adapter-base";
import {
  AddressLookupTableAccount,
  Connection,
  MessageV0,
  Transaction,
  TransactionMessage,
  type VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";

export function asSignerWalletAdapter(
  adapter: WalletAdapter | null | undefined,
): SignerWalletAdapter {
  const signer = adapter as Partial<SignerWalletAdapter> | null | undefined;
  if (!signer || typeof signer.signTransaction !== "function") {
    throw new Error("Connect a wallet that can sign transactions");
  }
  return signer as SignerWalletAdapter;
}

/**
 * Load lookup tables so we can decompile a v0 message, refresh the blockhash, and
 * recompile. MagicBlock returns a tx with a blockhash that can expire before
 * the wallet signs (common on devnet) → "Blockhash not found" in simulation.
 */
async function loadAddressLookupTableAccounts(
  connection: Connection,
  message: VersionedMessage,
): Promise<AddressLookupTableAccount[]> {
  if (message.version !== 0) {
    return [];
  }
  const m0 = message as MessageV0;
  if (!m0.addressTableLookups.length) {
    return [];
  }
  const res = await Promise.all(
    m0.addressTableLookups.map((lookup) =>
      connection.getAddressLookupTable(lookup.accountKey),
    ),
  );
  return res
    .map((r) => r.value)
    .filter((a): a is AddressLookupTableAccount => a != null);
}

/**
 * Re-encode an API-built transaction with a fresh `recentBlockhash` from the
 * current RPC, right before the user signs. Does not change instructions.
 */
export async function prepareUnsignedTransactionFromBase64(
  connection: Connection,
  transactionBase64: string,
): Promise<Transaction | VersionedTransaction> {
  const bytes = Uint8Array.from(atob(transactionBase64), (c) =>
    c.charCodeAt(0),
  );

  let vtx: VersionedTransaction;
  try {
    vtx = VersionedTransaction.deserialize(bytes);
  } catch {
    const tx = Transaction.from(bytes);
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = blockhash;
    return tx;
  }

  const alts = await loadAddressLookupTableAccounts(connection, vtx.message);
  const decompiled = TransactionMessage.decompile(
    vtx.message,
    alts.length > 0 ? { addressLookupTableAccounts: alts } : undefined,
  );
  const { blockhash } = await connection.getLatestBlockhash("finalized");
  const newMsg = new TransactionMessage({
    payerKey: decompiled.payerKey,
    instructions: decompiled.instructions,
    recentBlockhash: blockhash,
  });
  const compiled = newMsg.compileToV0Message(
    alts.length > 0 ? alts : undefined,
  );
  return new VersionedTransaction(compiled);
}

export async function signAndSendBase64Transaction(
  connection: Connection,
  adapter: SignerWalletAdapter,
  transactionBase64: string,
): Promise<string> {
  const unsigned = await prepareUnsignedTransactionFromBase64(
    connection,
    transactionBase64,
  );
  const signed = await adapter.signTransaction(unsigned);
  const signedSerialized =
    signed instanceof VersionedTransaction
      ? signed.serialize()
      : (signed as Transaction).serialize();
  return connection.sendRawTransaction(signedSerialized, {
    skipPreflight: false,
    maxRetries: 3,
  });
}
