import type {
  SignerWalletAdapter,
  WalletAdapter,
} from "@solana/wallet-adapter-base";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";

export function asSignerWalletAdapter(
  adapter: WalletAdapter | null | undefined,
): SignerWalletAdapter {
  const signer = adapter as Partial<SignerWalletAdapter> | null | undefined;
  if (!signer || typeof signer.signTransaction !== "function") {
    throw new Error("Connect a wallet that can sign transactions");
  }
  return signer as SignerWalletAdapter;
}

export async function signAndSendBase64Transaction(
  connection: Connection,
  adapter: SignerWalletAdapter,
  transactionBase64: string,
): Promise<string> {
  const bytes = Uint8Array.from(atob(transactionBase64), (c) =>
    c.charCodeAt(0),
  );

  let signedSerialized: Uint8Array;

  try {
    const vtx = VersionedTransaction.deserialize(bytes);
    const signed = await adapter.signTransaction(vtx);
    signedSerialized = signed.serialize();
  } catch {
    const legacy = Transaction.from(bytes);
    const signed = await adapter.signTransaction(legacy);
    signedSerialized = signed.serialize();
  }

  return connection.sendRawTransaction(signedSerialized, {
    skipPreflight: false,
    maxRetries: 3,
  });
}
