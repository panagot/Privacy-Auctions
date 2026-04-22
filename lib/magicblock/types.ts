export type MagicBlockTxKind = "deposit" | "withdraw" | "transfer";

export type MagicBlockSendTo = "base" | "ephemeral";

export type BuildTxResponse = {
  kind: MagicBlockTxKind;
  version: string;
  transactionBase64: string;
  sendTo: MagicBlockSendTo;
  recentBlockhash: string;
  lastValidBlockHeight: number;
  instructionCount: number;
  requiredSigners: string[];
  validator?: string;
};

export type ClusterParam = "mainnet" | "devnet" | string;

export type DepositBody = {
  owner: string;
  amount: number;
  cluster?: ClusterParam;
  mint?: string;
  initIfMissing?: boolean;
  initVaultIfMissing?: boolean;
  initAtasIfMissing?: boolean;
  idempotent?: boolean;
  validator?: string;
};

export type TransferBody = {
  owner: string;
  destination: string;
  amount: number;
  cluster?: ClusterParam;
  mint?: string;
  privacy?: string;
  memo?: string;
  validator?: string;
};

export type WithdrawBody = {
  owner: string;
  amount: number;
  mint: string;
  cluster?: ClusterParam;
  idempotent?: boolean;
  initIfMissing?: boolean;
  initAtasIfMissing?: boolean;
  escrowIndex?: number;
  validator?: string;
};
