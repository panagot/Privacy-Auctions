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

/** `POST /v1/spl/transfer` (MagicBlock Payments) */
export type BalanceLayer = "base" | "ephemeral";

export type TransferBody = {
  from: string;
  to: string;
  amount: number;
  cluster?: ClusterParam;
  mint?: string;
  visibility: "public" | "private";
  fromBalance: BalanceLayer;
  toBalance: BalanceLayer;
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
