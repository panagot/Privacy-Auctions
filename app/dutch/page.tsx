"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

function shortAddr(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

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

  const runTx = async (label: string, fn: () => Promise<string>) => {
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
    } catch (e) {
      setStatus(
        `${label} failed: ${await formatSendTransactionError(e, connection)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const onDeposit = () =>
    runTx("Deposit to rollup", async () => {
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
    });

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
    } catch (e) {
      setStatus(
        `Buy failed: ${await formatSendTransactionError(e, connection)}`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Private Dutch sale
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The current ask is visible and ticks down on a schedule. When a buyer
          accepts, they pay the seller at that clearing price using MagicBlock&apos;s{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            private transfer
          </strong>
          —same endpoint family as sealed-bid, different pricing rule.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            MagicBlock — devnet
          </h2>
          <InfoTip text="Deposit is the same as sealed-bid: user funds the Ephemeral Rollup (ER) USDC balance via the payments API, then a private buy spends from that balance. Capture both in your recording." />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Deposit devnet USDC into the rollup so the buyer can settle privately
          at the live price. The wallet must already hold that devnet USDC (SPL)
          or the transaction will fail with an insufficient-balance error from
          the token program.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDeposit}
            disabled={busy || !publicKey}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Deposit {DEFAULT_DEPOSIT_USDC} USDC (rollup)
          </button>
          <InfoTip
            text={`API-built ${DEFAULT_DEPOSIT_USDC} USDC deposit. Wallet needs that much devnet USDC (SPL) plus SOL for fees.`}
          />
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1">
          <h2 className="font-semibold">Configure sale</h2>
          <InfoTip text="The descending schedule is local to this browser for a fast loop. A frontier follow-on could run price ticks or reserve logic on Solana (ER/PER) while still settling with the Private Payments API at the clearing price." />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Tick every (seconds)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={tickSec}
              onChange={(e) => setTickSec(Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Start price (USDC)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-400">
            Floor price (USDC)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </label>
          <label className="text-sm text-zinc-600 dark:text-zinc-400 sm:col-span-2">
            Decrease per tick (USDC)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Start / replace session (seller = connected wallet)
          </button>
          <InfoTip text="Replaces the single in-browser Dutch session. Seller is the connected wallet; buyers need only buy at the right tick and have rollup balance to pay." />
        </div>
      </section>

      {session && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{session.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Seller {shortAddr(session.seller)} · {session.phase}
              </p>
            </div>
            {session.phase === "running" && (
              <div className="text-right">
                <p className="text-xs uppercase text-zinc-500">
                  <span className="inline-flex items-center justify-end gap-1">
                    Current price
                    <InfoTip text="Ticks down from the start by the configured step each interval, stopping at the floor. This is the amount a buyer pays the seller in the private buy step." />
                  </span>
                </p>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatBaseUnitsAsUsdc(session.currentPriceBaseUnits)}{" "}
                  <span className="text-base font-normal text-zinc-500">USDC</span>
                </p>
              </div>
            )}
          </div>

          {session.phase === "running" && (
            <div className="mt-6 flex min-h-[3rem] items-center gap-2">
              <button
                type="button"
                onClick={onBuy}
                disabled={busy || !publicKey}
                className="min-w-0 flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Buy now (private pay seller)
              </button>
              <InfoTip text="Pays the seller the current tick price in one private transfer (same buildPrivateTransfer path as sealed-bid). Deposit to the rollup first so the spend succeeds." />
            </div>
          )}

          {session.phase === "sold" && (
            <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              Sold to {session.buyer ? shortAddr(session.buyer) : "—"} at{" "}
              {session.soldPriceBaseUnits !== undefined
                ? formatBaseUnitsAsUsdc(session.soldPriceBaseUnits)
                : "—"}{" "}
              USDC
            </p>
          )}

          {session.phase === "stopped" && (
            <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
              Reached floor without a buyer — restart or adjust parameters.
            </p>
          )}
        </section>
      )}

      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          {status}
        </div>
      ) : null}

      <DutchSimulation />
    </div>
  );
}
