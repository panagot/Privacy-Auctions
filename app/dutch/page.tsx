"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  Banknote,
  CheckCircle2,
  Layers,
  Settings,
  Timer,
  TrendingDown,
  Wallet,
  Zap,
} from "lucide-react";

import { DEFAULT_DEPOSIT_USDC, DEVNET_USDC_MINT } from "@/lib/constants";
import { formatUserError } from "@/lib/error-message";
import { formatSendTransactionError } from "@/lib/tx-error";
import {
  createDutchSession,
  getDutchSession,
  markDutchSold,
  tickDutchPrice,
} from "@/lib/dutch-auction-store";
import { formatBaseUnitsAsUsdc, parseUsdcToBaseUnits } from "@/lib/format";
import { buildDepositTx, buildPrivateTransferTx } from "@/lib/magicblock/client";
import {
  asSignerWalletAdapter,
  signAndSendBase64Transaction,
} from "@/lib/solana/send-transaction";
import { InfoTip } from "@/components/InfoTip";
import { DutchSimulation } from "@/components/DutchSimulation";
import { Badge } from "@/components/ui/Badge";
import { ExplorerAddressLink } from "@/components/ui/ExplorerLink";
import { PhaseChip } from "@/components/ui/PhaseChip";
import { Section } from "@/components/ui/Section";
import { Stat } from "@/components/ui/Stat";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ReceiptsList, recordReceipt } from "@/components/ui/Receipts";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-700 dark:focus:ring-emerald-900/40";

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const helperClass = "mt-1 text-xs text-zinc-500 dark:text-zinc-400";

export default function DutchPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, wallet } = useWallet();
  const adapter = wallet?.adapter;

  const [rev, setRev] = useState(0);
  const [title, setTitle] = useState("Dutch drop");
  const [start, setStart] = useState("10.00");
  const [floor, setFloor] = useState("2.00");
  const [tickAmt, setTickAmt] = useState("0.25");
  const [tickSec, setTickSec] = useState(5);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    setRev((n) => n + 1);
  }, []);

  const session = useMemo(() => {
    void rev;
    if (typeof window === "undefined") return null;
    return getDutchSession();
  }, [rev]);

  useEffect(() => {
    if (!session || session.phase !== "running") return;
    const tickMs = session.tickMs;
    const id = window.setInterval(() => {
      tickDutchPrice();
      refresh();
    }, tickMs);
    return () => window.clearInterval(id);
  }, [session, refresh]);

  /** Approximate price progression: 0..1 from start to floor. */
  const priceProgress = useMemo(() => {
    if (!session) return 0;
    const start = Number(session.startPriceBaseUnits);
    const floor = Number(session.floorPriceBaseUnits);
    const cur = Number(session.currentPriceBaseUnits);
    if (start <= floor) return 1;
    return Math.min(1, Math.max(0, (start - cur) / (start - floor)));
  }, [session]);

  const runTx = async (
    label: string,
    fn: () => Promise<string>,
    onSuccess?: (sig: string) => void,
  ) => {
    if (!adapter || !publicKey || !signTransaction) {
      setStatus("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setStatus(`${label}…`);
    try {
      const sig = await fn();
      await connection.confirmTransaction(sig, "confirmed");
      setStatus(`${label} confirmed: ${sig}`);
      onSuccess?.(sig);
    } catch (e) {
      setStatus(
        `${label} failed: ${await formatSendTransactionError(e, connection)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeposit = () =>
    runTx(
      "Deposit to rollup",
      async () => {
        const base = parseUsdcToBaseUnits(DEFAULT_DEPOSIT_USDC);
        const built = await buildDepositTx({
          owner: publicKey!.toBase58(),
          amount: Number(base),
          initIfMissing: true,
          initAtasIfMissing: true,
          idempotent: true,
          mint: DEVNET_USDC_MINT,
        });
        return signAndSendBase64Transaction(
          connection,
          asSignerWalletAdapter(adapter),
          built.transactionBase64,
        );
      },
      (sig) => {
        recordReceipt({
          signature: sig,
          kind: "deposit",
          amountUsdc: DEFAULT_DEPOSIT_USDC,
          context: "Dutch",
        });
      },
    );

  const onCreate = () => {
    if (!publicKey) {
      setStatus("Connect wallet to start.");
      return;
    }
    try {
      createDutchSession({
        title: title.trim() || "Dutch sale",
        seller: publicKey.toBase58(),
        startPriceBaseUnits: parseUsdcToBaseUnits(start),
        floorPriceBaseUnits: parseUsdcToBaseUnits(floor),
        tickAmountBaseUnits: parseUsdcToBaseUnits(tickAmt),
        tickMs: Math.max(1, tickSec) * 1000,
      });
      refresh();
      setStatus("Sale started (stored in this browser).");
    } catch (e) {
      setStatus(formatUserError(e));
    }
  };

  const onBuy = async () => {
    if (!adapter || !publicKey || !signTransaction) {
      setStatus("Connect a wallet first.");
      return;
    }
    if (!session || session.phase !== "running") {
      setStatus("No active sale.");
      return;
    }
    const price = session.currentPriceBaseUnits;
    const seller = session.seller;
    const sid = session.id;
    setBusy(true);
    setStatus("Private buy (pay seller)…");
    try {
      const built = await buildPrivateTransferTx({
        from: publicKey.toBase58(),
        to: seller,
        amount: Number(price),
        mint: DEVNET_USDC_MINT,
        memo: `dutch:${sid}`,
      });
      const sig = await signAndSendBase64Transaction(
        connection,
        asSignerWalletAdapter(adapter),
        built.transactionBase64,
      );
      await connection.confirmTransaction(sig, "confirmed");
      markDutchSold(publicKey.toBase58());
      refresh();
      setStatus(`Private buy confirmed: ${sig}`);
      recordReceipt({
        signature: sig,
        kind: "private-pay",
        amountUsdc: formatBaseUnitsAsUsdc(price),
        context: `Dutch: ${session.title}`,
      });
    } catch (e) {
      setStatus(
        `Buy failed: ${await formatSendTransactionError(e, connection)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="emerald" icon={<Timer size={12} strokeWidth={2.25} />}>
            Private Dutch
          </Badge>
          <Badge tone="violet">Devnet</Badge>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Private Dutch sale
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          The asking price ticks down on a schedule. The first buyer to take
          the lot pays the seller at the live clearing amount through the same
          MagicBlock private transfer path as the sealed-bid winner.
        </p>
      </header>

      {/* Step 1: Deposit */}
      <Section
        title={
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
              <Banknote size={14} strokeWidth={2.5} />
            </span>
            <span>1 · MagicBlock deposit</span>
          </span>
        }
        tip="Same as sealed-bid: API-built deposit funds your Ephemeral Rollup balance, then the buy spends from that balance."
        right={<Badge tone="neutral">{DEFAULT_DEPOSIT_USDC} USDC</Badge>}
      >
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Buyer wallet must hold at least the deposit amount in{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">devnet USDC</strong> (SPL) plus
          devnet SOL for fees, otherwise the Token program returns
          insufficient funds. The deposit only covers the rollup balance — the
          actual buy uses the live tick price.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDeposit}
            disabled={busy || !publicKey}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Layers size={14} strokeWidth={2.25} />
            Deposit {DEFAULT_DEPOSIT_USDC} USDC
          </button>
          <span className={helperClass}>
            <code className="font-mono text-[11px]">POST /v1/spl/deposit</code> · blockhash refresh on send
          </span>
        </div>
      </Section>

      {/* Step 2: Configure */}
      <Section
        title={
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <Settings size={14} strokeWidth={2.5} />
            </span>
            <span>2 · Configure sale</span>
          </span>
        }
        tip="The descending schedule is local to this browser for fast loops. A Frontier follow-on can run ticks or reserve logic on Solana while still settling with the Private Payments API at the clearing price."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelClass}>
            Title
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Tick every (seconds)
            <input
              type="number"
              min={1}
              className={inputClass}
              value={tickSec}
              onChange={(e) => setTickSec(Number(e.target.value))}
            />
          </label>
          <label className={labelClass}>
            Start price (USDC)
            <input
              className={inputClass}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Floor price (USDC)
            <input
              className={inputClass}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Decrease per tick (USDC)
            <input
              className={inputClass}
              value={tickAmt}
              onChange={(e) => setTickAmt(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onCreate}
            disabled={busy || !publicKey}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            <ArrowDown size={14} strokeWidth={2.25} />
            Start / replace session — seller is the connected wallet
          </button>
          <span className={helperClass}>
            Buyer needs only the rollup balance to pay at a tick they like.
          </span>
        </div>
      </Section>

      {session && (
        <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  {session.title}
                </h2>
                <PhaseChip phase={session.phase} />
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Seller{" "}
                <ExplorerAddressLink
                  address={session.seller}
                  className="ms-1"
                />
              </p>
            </div>
          </div>

          {/* Live ticker / progress */}
          {session.phase === "running" && (
            <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/60 p-5 dark:border-emerald-900/50 dark:from-zinc-900 dark:to-emerald-950/30">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Current ask
                    <InfoTip text="Drops by 'Decrease per tick' every interval until the floor. This is what a buyer pays the seller in the private pay step." />
                  </p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
                    {formatBaseUnitsAsUsdc(session.currentPriceBaseUnits)}
                    <span className="ms-2 text-base font-medium text-zinc-500 dark:text-zinc-400">
                      USDC
                    </span>
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                  <p>
                    Start{" "}
                    <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatBaseUnitsAsUsdc(session.startPriceBaseUnits)}
                    </span>
                  </p>
                  <p>
                    Floor{" "}
                    <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatBaseUnitsAsUsdc(session.floorPriceBaseUnits)}
                    </span>
                  </p>
                  <p>
                    −
                    <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-200">
                      {formatBaseUnitsAsUsdc(session.tickAmountBaseUnits)}
                    </span>{" "}
                    every {Math.round(session.tickMs / 1000)}s
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <div className="h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.round(priceProgress * 100)}%` }}
                    aria-hidden
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>Start</span>
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown size={11} strokeWidth={2} />
                    Now
                  </span>
                  <span>Floor</span>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onBuy}
                  disabled={busy || !publicKey}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={16} strokeWidth={2.25} />
                  Buy now @ {formatBaseUnitsAsUsdc(session.currentPriceBaseUnits)}{" "}
                  USDC (private pay seller)
                </button>
                <InfoTip text="Pays the seller the current tick price in one private transfer (same buildPrivateTransfer path as sealed-bid). Deposit to the rollup first so the spend succeeds." />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Phase"
              value={
                session.phase === "running"
                  ? "Live ticker"
                  : session.phase === "sold"
                    ? "Sold"
                    : "Stopped"
              }
              emphasis={
                session.phase === "sold"
                  ? "emerald"
                  : session.phase === "running"
                    ? "violet"
                    : "default"
              }
            />
            <Stat
              label={
                session.phase === "sold" ? "Sold price" : "Current price"
              }
              value={
                session.phase === "sold" &&
                session.soldPriceBaseUnits !== undefined ? (
                  `${formatBaseUnitsAsUsdc(session.soldPriceBaseUnits)} USDC`
                ) : (
                  `${formatBaseUnitsAsUsdc(session.currentPriceBaseUnits)} USDC`
                )
              }
              emphasis={session.phase === "sold" ? "emerald" : "default"}
            />
            <Stat
              label="Tick parameters"
              value={`−${formatBaseUnitsAsUsdc(session.tickAmountBaseUnits)} / ${Math.round(session.tickMs / 1000)}s`}
              hint={`Start ${formatBaseUnitsAsUsdc(session.startPriceBaseUnits)} → Floor ${formatBaseUnitsAsUsdc(session.floorPriceBaseUnits)}`}
            />
          </div>

          {session.phase === "sold" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 size={18} strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
                    Sold privately
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-emerald-900 dark:text-emerald-50">
                    To{" "}
                    {session.buyer ? (
                      <ExplorerAddressLink
                        address={session.buyer}
                        className="ms-1"
                      />
                    ) : (
                      "—"
                    )}
                    {session.soldPriceBaseUnits !== undefined ? (
                      <>
                        {" "}
                        @ {formatBaseUnitsAsUsdc(session.soldPriceBaseUnits)}{" "}
                        USDC
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
            </div>
          )}

          {session.phase === "stopped" && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-medium">Reached floor without a buyer</p>
              <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
                Restart with a higher start price, lower floor, or a slower tick.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Quick wallet helper if not connected */}
      {!session && !publicKey ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <Wallet size={14} strokeWidth={2.25} />
            Connect a Solana wallet on devnet to start a sale.
          </span>
        </div>
      ) : null}

      {status ? <StatusBanner status={status} busy={busy} /> : null}

      <Section
        title="Recent confirmed signatures"
        tip="Saved on this device only — devnet transactions you confirmed in the app, with a Solana Explorer link for each."
      >
        <ReceiptsList limit={4} />
      </Section>

      <DutchSimulation />
    </div>
  );
}
