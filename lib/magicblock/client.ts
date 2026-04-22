import {
  DEFAULT_CLUSTER,
  MAGICBLOCK_FETCH_TIMEOUT_MS,
  MAGICBLOCK_PAYMENTS_URL,
} from "@/lib/constants";
import type {
  BuildTxResponse,
  DepositBody,
  TransferBody,
  WithdrawBody,
} from "@/lib/magicblock/types";

const magicBlockSignal = () =>
  AbortSignal.timeout(MAGICBLOCK_FETCH_TIMEOUT_MS);

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${MAGICBLOCK_PAYMENTS_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: magicBlockSignal(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MagicBlock ${path} ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${MAGICBLOCK_PAYMENTS_URL}/health`, {
    signal: magicBlockSignal(),
  });
  if (!res.ok) throw new Error("MagicBlock health check failed");
  return res.json() as Promise<{ status: string }>;
}

export function buildDepositTx(
  body: Omit<DepositBody, "cluster"> & { cluster?: DepositBody["cluster"] },
): Promise<BuildTxResponse> {
  return postJson("/v1/spl/deposit", {
    cluster: DEFAULT_CLUSTER,
    ...body,
  });
}

export function buildPrivateTransferTx(
  body: Omit<TransferBody, "cluster" | "privacy"> & {
    cluster?: TransferBody["cluster"];
  },
): Promise<BuildTxResponse> {
  return postJson("/v1/spl/transfer", {
    cluster: DEFAULT_CLUSTER,
    privacy: "private",
    ...body,
  });
}

export function buildWithdrawTx(body: WithdrawBody): Promise<BuildTxResponse> {
  return postJson("/v1/spl/withdraw", {
    cluster: DEFAULT_CLUSTER,
    ...body,
  });
}

export async function fetchSplBalance(owner: string, mint?: string) {
  const params = new URLSearchParams({ owner, cluster: DEFAULT_CLUSTER });
  if (mint) params.set("mint", mint);
  const res = await fetch(
    `${MAGICBLOCK_PAYMENTS_URL}/v1/spl/balance?${params.toString()}`,
    { signal: magicBlockSignal() },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ amount: string }>;
}

export async function fetchPrivateBalance(owner: string, mint?: string) {
  const params = new URLSearchParams({ owner, cluster: DEFAULT_CLUSTER });
  if (mint) params.set("mint", mint);
  const res = await fetch(
    `${MAGICBLOCK_PAYMENTS_URL}/v1/spl/private-balance?${params.toString()}`,
    { signal: magicBlockSignal() },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ amount: string }>;
}
