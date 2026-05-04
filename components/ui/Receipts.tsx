"use client";

import { useEffect, useMemo, useState } from "react";
import { Receipt as ReceiptIcon } from "lucide-react";

import { ExplorerTxLink } from "@/components/ui/ExplorerLink";
import { Badge } from "@/components/ui/Badge";

const KEY = "privacy-auctions-receipts-v1";

export type ReceiptKind = "deposit" | "private-pay";
export type ReceiptEntry = {
  signature: string;
  kind: ReceiptKind;
  amountUsdc?: string;
  context?: string;
  ts: number;
};

function load(): ReceiptEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is ReceiptEntry =>
        !!r && typeof r === "object" && typeof r.signature === "string",
    );
  } catch {
    return [];
  }
}

function save(receipts: ReceiptEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(receipts.slice(0, 25)));
}

/**
 * Append a receipt and notify any listeners on the same tab. We use a
 * `storage`-style custom event because real `storage` events do not fire on
 * the tab that wrote them.
 */
export function recordReceipt(input: Omit<ReceiptEntry, "ts">) {
  if (typeof window === "undefined") return;
  const list = [{ ...input, ts: Date.now() }, ...load()];
  save(list);
  window.dispatchEvent(new CustomEvent("privacy-auctions:receipts"));
}

function kindLabel(kind: ReceiptKind) {
  return kind === "deposit" ? "Rollup deposit" : "Private pay";
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 45) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 45) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Compact list of recent confirmed signatures (devnet) for credibility. */
export function ReceiptsList({ limit = 4 }: { limit?: number }) {
  const [receipts, setReceipts] = useState<ReceiptEntry[]>([]);

  useEffect(() => {
    const refresh = () => setReceipts(load());
    refresh();
    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) refresh();
    };
    window.addEventListener("privacy-auctions:receipts", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("privacy-auctions:receipts", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const visible = useMemo(() => receipts.slice(0, limit), [receipts, limit]);

  if (visible.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No confirmed devnet transactions yet on this device. Run a deposit or a
        private pay—signatures show up here with an Explorer link.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {visible.map((r) => (
        <li
          key={r.signature}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <ReceiptIcon
            size={16}
            strokeWidth={2}
            className="text-zinc-400"
            aria-hidden
          />
          <Badge tone={r.kind === "deposit" ? "violet" : "emerald"}>
            {kindLabel(r.kind)}
          </Badge>
          {r.amountUsdc ? (
            <span className="text-sm font-medium tabular-nums text-zinc-800 dark:text-zinc-100">
              {r.amountUsdc} USDC
            </span>
          ) : null}
          {r.context ? (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {r.context}
            </span>
          ) : null}
          <ExplorerTxLink signature={r.signature} className="ms-auto" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {timeAgo(r.ts)}
          </span>
        </li>
      ))}
    </ul>
  );
}
