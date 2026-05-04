"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Eye,
  Gavel,
  Hash,
  Layers,
  ShieldCheck,
  Timer,
  Wallet,
} from "lucide-react";

import { DEFAULT_DEPOSIT_USDC, DEVNET_USDC_MINT } from "@/lib/constants";
import { formatUserError } from "@/lib/error-message";
import { formatSendTransactionError } from "@/lib/tx-error";
import { formatBaseUnitsAsUsdc, parseUsdcToBaseUnits } from "@/lib/format";
import { buildDepositTx, buildPrivateTransferTx } from "@/lib/magicblock/client";
import {
  createSealedAuction,
  finalizeWinner,
  listSealedAuctions,
  openRevealPhase,
  placeSealedCommitment,
  revealBid,
} from "@/lib/sealed-auction-store";
import {
  asSignerWalletAdapter,
  signAndSendBase64Transaction,
} from "@/lib/solana/send-transaction";
import { InfoTip } from "@/components/InfoTip";
import { SealedBidSimulation } from "@/components/SealedBidSimulation";
import { Badge } from "@/components/ui/Badge";
import { ExplorerAddressLink } from "@/components/ui/ExplorerLink";
import { PhaseChip } from "@/components/ui/PhaseChip";
import { Section } from "@/components/ui/Section";
import { Stat } from "@/components/ui/Stat";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ReceiptsList, recordReceipt } from "@/components/ui/Receipts";

function shortAddr(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-violet-700 dark:focus:ring-violet-900/40";

const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const helperClass = "mt-1 text-xs text-zinc-500 dark:text-zinc-400";

export default function SealedBidPage() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, wallet } = useWallet();
  const adapter = wallet?.adapter;

  const [title, setTitle] = useState("Genesis lot");
  const [duration, setDuration] = useState(5);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("1.00");
  const [revealAmounts, setRevealAmounts] = useState<Record<string, string>>(
    {},
  );
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rev, setRev] = useState(0);
  const [clock, setClock] = useState(() => Date.now());

  const refresh = useCallback(() => {
    setRev((n) => n + 1);
  }, []);

  const auctions = useMemo(() => {
    void rev;
    if (typeof window === "undefined") return [];
    return listSealedAuctions();
  }, [rev]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const activeId = selectedId ?? auctions[0]?.id ?? null;

  const selected = useMemo(
    () => auctions.find((a) => a.id === activeId) ?? null,
    [auctions, activeId],
  );

  const canOpenReveal = useMemo(() => {
    if (!selected || selected.phase !== "bidding") return false;
    if (clock >= selected.endTimeMs) return true;
    if (publicKey && publicKey.toBase58() === selected.seller) return true;
    return false;
  }, [selected, clock, publicKey]);

  const msUntilEnd = useMemo(() => {
    if (!selected || selected.phase !== "bidding") return 0;
    return Math.max(0, selected.endTimeMs - clock);
  }, [selected, clock]);

  /** Bids with no successful reveal; they do not enter winner selection. */
  const bidTally = useMemo(() => {
    if (!selected) return { unrevealed: 0, revealed: 0, total: 0 };
    const total = selected.bids.length;
    const revealed = selected.bids.filter(
      (b) => b.amountBaseUnits !== undefined,
    ).length;
    return { unrevealed: total - revealed, revealed, total };
  }, [selected]);

  const timeLeftStr = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

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
      const msg = await formatSendTransactionError(e, connection);
      setStatus(`${label} failed: ${msg}`);
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
          context: "Sealed-bid",
        });
      },
    );

  const onCreate = () => {
    if (!publicKey) {
      setStatus("Connect wallet to create.");
      return;
    }
    const a = createSealedAuction({
      title: title.trim() || "Untitled",
      seller: publicKey.toBase58(),
      durationMinutes: duration,
    });
    setSelectedId(a.id);
    refresh();
    setStatus("Auction created (stored in this browser).");
  };

  const onBid = async () => {
    if (!publicKey) {
      setStatus("Connect wallet to bid.");
      return;
    }
    if (!selected) return;
    setBusy(true);
    setStatus("Creating commitment…");
    try {
      const base = parseUsdcToBaseUnits(bidAmount);
      await placeSealedCommitment({
        auctionId: selected.id,
        bidder: publicKey.toBase58(),
        amountBaseUnits: base,
      });
      refresh();
      setStatus("Bid commitment recorded locally.");
    } catch (e) {
      setStatus(formatUserError(e));
    } finally {
      setBusy(false);
    }
  };

  const onOpenReveal = () => {
    if (!selected) return;
    try {
      const now = Date.now();
      const beforeEnd = now < selected.endTimeMs;
      if (beforeEnd) {
        if (!publicKey || publicKey.toBase58() !== selected.seller) {
          setStatus(
            "Only the connected seller wallet can end bidding before the scheduled time. Others: wait for the countdown, then use this button.",
          );
          return;
        }
        openRevealPhase(selected.id, {
          asSellerForEarlyEnd: publicKey.toBase58(),
        });
      } else {
        openRevealPhase(selected.id);
      }
      refresh();
      setStatus(
        "Reveal phase is open. Each bidder enters the exact USDC for each row, then Reveal; then click Finalize winner, then the winner can pay the seller on-chain.",
      );
    } catch (e) {
      setStatus(formatUserError(e));
    }
  };

  const onRevealOne = async (commitmentHex: string) => {
    if (!publicKey || !selected) return;
    const raw = revealAmounts[commitmentHex] ?? "";
    setBusy(true);
    setStatus("Revealing bid…");
    try {
      const base = parseUsdcToBaseUnits(raw);
      await revealBid({
        auctionId: selected.id,
        bidder: publicKey.toBase58(),
        commitmentHex,
        amountBaseUnits: base,
      });
      refresh();
      setStatus("Reveal recorded.");
    } catch (e) {
      setStatus(formatUserError(e));
    } finally {
      setBusy(false);
    }
  };

  const onFinalize = () => {
    if (!selected) return;
    try {
      finalizeWinner(selected.id);
      refresh();
      setStatus("Winner selected.");
    } catch (e) {
      setStatus(formatUserError(e));
    }
  };

  const onPaySeller = () =>
    runTx(
      "Private pay seller",
      async () => {
        if (!publicKey || !selected?.winner || !selected.winningAmountBaseUnits) {
          throw new Error("Nothing to pay");
        }
        if (publicKey.toBase58() !== selected.winner) {
          throw new Error("Only the winner wallet can settle");
        }
        const built = await buildPrivateTransferTx({
          from: publicKey.toBase58(),
          to: selected.seller,
          amount: Number(selected.winningAmountBaseUnits),
          mint: DEVNET_USDC_MINT,
          memo: `sealed:${selected.id}`,
        });
        return signAndSendBase64Transaction(
          connection,
          asSignerWalletAdapter(adapter),
          built.transactionBase64,
        );
      },
      (sig) => {
        if (!selected?.winningAmountBaseUnits) return;
        recordReceipt({
          signature: sig,
          kind: "private-pay",
          amountUsdc: formatBaseUnitsAsUsdc(selected.winningAmountBaseUnits),
          context: `Sealed: ${selected.title}`,
        });
      },
    );

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="violet" icon={<Gavel size={12} strokeWidth={2.25} />}>
            Sealed-bid
          </Badge>
          <Badge tone="emerald">Devnet</Badge>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Sealed-bid auction
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
          Bidders publish a SHA-256 <strong className="font-semibold text-zinc-800 dark:text-zinc-200">commitment</strong> during
          the window — not the amount. After close (or the seller ends early),
          everyone reveals, the highest valid bid wins, and the winner pays the
          seller through MagicBlock with a private SPL transfer.
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
        tip="Fund your Ephemeral Rollup USDC balance via the payments API. The winner spends from this in step 4 with a private transfer."
        right={<Badge tone="neutral">{DEFAULT_DEPOSIT_USDC} USDC</Badge>}
      >
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Deposit devnet USDC into the rollup so you can pay the seller
          privately later. Both sides need this if you also plan to record on
          the seller wallet for thoroughness. Wallet must hold at least the
          deposit amount in <strong className="font-medium text-zinc-800 dark:text-zinc-200">devnet USDC</strong> (SPL) plus
          devnet SOL for fees.
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
            Builds <code className="font-mono text-[11px]">POST /v1/spl/deposit</code>; refreshes blockhash
            before signing.
          </span>
        </div>
      </Section>

      {/* Step 2: Create + Bid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section
          title={
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <Wallet size={14} strokeWidth={2.5} />
              </span>
              <span>2 · Create auction</span>
            </span>
          }
          tip="Auction definition (title + window) lives in this browser for the demo. A Frontier follow-on can anchor rules on Solana while still using the Private Payments API for settlement."
        >
          <div className="space-y-3">
            <label className={labelClass}>
              Title
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className={labelClass}>
              Bidding window (minutes)
              <input
                type="number"
                min={1}
                className={inputClass}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              onClick={onCreate}
              disabled={busy || !publicKey}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Create — seller is the connected wallet
            </button>
          </div>
        </Section>

        <Section
          title={
            <span className="inline-flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                <Hash size={14} strokeWidth={2.5} />
              </span>
              <span>3 · Place sealed bid</span>
            </span>
          }
          tip="The app stores SHA-256(auction-id, wallet, amount, salt). Bid amounts are not in any public graph until reveal."
        >
          <div className="space-y-3">
            <label className={labelClass}>
              Auction
              <select
                className={inputClass}
                value={activeId ?? ""}
                onChange={(e) => setSelectedId(e.target.value || null)}
              >
                {auctions.length === 0 ? (
                  <option value="">No auctions yet</option>
                ) : (
                  auctions.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} — {a.phase} — ends{" "}
                      {new Date(a.endTimeMs).toLocaleTimeString()}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className={labelClass}>
              Bid amount (USDC)
              <input
                className={inputClass}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onBid}
                disabled={busy || !publicKey || !selected}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <ShieldCheck size={14} strokeWidth={2.25} />
                Seal bid (local commitment)
              </button>
              <InfoTip text="The salt is generated in your browser and stored alongside the commitment so the same wallet can reveal later." />
            </div>
          </div>
        </Section>
      </div>

      {selected && (
        <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {/* Header with phase + actions */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  {selected.title}
                </h2>
                <PhaseChip phase={selected.phase} />
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Seller{" "}
                <ExplorerAddressLink
                  address={selected.seller}
                  className="ms-1"
                />
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {selected.phase === "bidding" && canOpenReveal && (
                <button
                  type="button"
                  onClick={onOpenReveal}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-500"
                >
                  <Eye size={14} strokeWidth={2.25} />
                  End bidding & open reveal
                </button>
              )}
              {selected.phase === "revealing" && (
                <button
                  type="button"
                  onClick={onFinalize}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
                >
                  <CheckCircle2 size={14} strokeWidth={2.25} />
                  Finalize winner
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Phase"
              value={
                selected.phase === "bidding"
                  ? "Bidding"
                  : selected.phase === "revealing"
                    ? "Revealing"
                    : "Settled"
              }
              hint={
                selected.phase === "bidding"
                  ? clock < selected.endTimeMs
                    ? `Ends ${new Date(selected.endTimeMs).toLocaleTimeString()}`
                    : "Window ended"
                  : undefined
              }
              emphasis={
                selected.phase === "settled"
                  ? "emerald"
                  : selected.phase === "revealing"
                    ? "default"
                    : "violet"
              }
            />
            <Stat
              label={
                selected.phase === "bidding" ? "Time left" : "Total bids"
              }
              value={
                selected.phase === "bidding" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Timer
                      size={16}
                      strokeWidth={2}
                      className="text-zinc-400"
                    />
                    {clock < selected.endTimeMs
                      ? timeLeftStr(msUntilEnd)
                      : "0:00"}
                  </span>
                ) : (
                  <span>{bidTally.total}</span>
                )
              }
              hint={
                selected.phase === "bidding"
                  ? canOpenReveal
                    ? "Seller may end early"
                    : "Anyone can end after the window"
                  : `${bidTally.revealed} revealed · ${bidTally.unrevealed} forfeit`
              }
            />
            <Stat
              label="Clearing amount"
              value={
                selected.phase === "settled" &&
                selected.winningAmountBaseUnits !== undefined
                  ? `${formatBaseUnitsAsUsdc(selected.winningAmountBaseUnits)} USDC`
                  : "—"
              }
              hint={
                selected.phase === "settled" && selected.winner
                  ? `Winner ${shortAddr(selected.winner)}`
                  : "Highest revealed amount only"
              }
              emphasis="emerald"
            />
          </div>

          {/* Bids table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50/70 text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Bidder</th>
                  <th className="px-4 py-2.5 font-medium">
                    <span className="inline-flex items-center gap-1">
                      Commitment
                      <InfoTip text="A SHA-256 digest published during bidding. It hides the amount until reveal while binding the bidder to a single bid." />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    <span className="inline-flex items-center gap-1">
                      Revealed
                      <InfoTip text="The USDC amount disclosed in the reveal phase, checked against the commitment. Empty until a successful reveal for that row." />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {selected.bids.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                      No commitments yet — place a sealed bid above.
                    </td>
                  </tr>
                ) : (
                  selected.bids.map((b) => {
                    const revealed = b.amountBaseUnits !== undefined;
                    const isWinner =
                      selected.phase === "settled" &&
                      selected.winner === b.bidder &&
                      revealed &&
                      b.amountBaseUnits === selected.winningAmountBaseUnits;
                    return (
                      <tr
                        key={`${b.bidder}-${b.commitmentHex}`}
                        className="border-t border-zinc-100 dark:border-zinc-800/80"
                      >
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-2">
                            <span className="font-mono text-xs">
                              {shortAddr(b.bidder)}
                            </span>
                            {isWinner ? <Badge tone="emerald">Winner</Badge> : null}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {b.commitmentHex.slice(0, 18)}…
                        </td>
                        <td className="px-4 py-2.5 tabular-nums">
                          {revealed ? (
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {formatBaseUnitsAsUsdc(b.amountBaseUnits!)}
                            </span>
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {(selected.phase === "revealing" || selected.phase === "settled") &&
            bidTally.unrevealed > 0 && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100"
              >
                <p className="font-medium">Unrevealed bids do not count</p>
                <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
                  {bidTally.unrevealed} of {bidTally.total} row
                  {bidTally.total === 1 ? "" : "s"} still show &ldquo;—&rdquo;
                  under Revealed. In commit-reveal, those rows never proved
                  their amount, so they are <strong>not</strong> eligible to
                  win. We only take the max among <strong>revealed</strong>{" "}
                  amounts.{" "}
                  {selected.phase === "revealing" ? (
                    <>
                      Before you finalize, each bidder with &ldquo;—&rdquo;
                      should connect and run <strong>Reveal</strong> for that
                      row, or the bid forfeits.
                    </>
                  ) : (
                    <>
                      Anything still unrevealed at finalize was excluded from
                      the result.
                    </>
                  )}
                </p>
              </div>
            )}

          {selected.phase === "revealing" && publicKey && (
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                  <Eye size={12} strokeWidth={2.25} />
                </span>
                Reveal your bids
                <InfoTip text="Enter the same USDC amount you used when bidding. The app re-hashes it with the stored salt to match your commitment." />
              </div>
              {selected.bids
                .filter((b) => b.bidder === publicKey.toBase58())
                .map((b) => (
                  <div
                    key={b.commitmentHex}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Amount for {b.commitmentHex.slice(0, 8)}…
                      <input
                        className={inputClass}
                        value={revealAmounts[b.commitmentHex] ?? ""}
                        onChange={(e) =>
                          setRevealAmounts((m) => ({
                            ...m,
                            [b.commitmentHex]: e.target.value,
                          }))
                        }
                        placeholder="1.00"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => onRevealOne(b.commitmentHex)}
                      disabled={busy}
                      className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                    >
                      Reveal
                    </button>
                  </div>
                ))}
              {selected.bids.filter((b) => b.bidder === publicKey.toBase58())
                .length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  This wallet has no commitments to reveal. Switch to a wallet
                  that placed a bid.
                </p>
              )}
            </div>
          )}

          {selected.phase === "settled" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 size={18} strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-emerald-700/80 dark:text-emerald-300/80">
                    Settled
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-emerald-900 dark:text-emerald-50">
                    Winner{" "}
                    {selected.winner ? (
                      <ExplorerAddressLink
                        address={selected.winner}
                        className="ms-1"
                      />
                    ) : (
                      "None"
                    )}
                    {selected.winningAmountBaseUnits !== undefined ? (
                      <>
                        {" "}
                        @ {formatBaseUnitsAsUsdc(selected.winningAmountBaseUnits)}{" "}
                        USDC
                      </>
                    ) : null}
                  </p>
                </div>
              </div>
              {bidTally.revealed > 0 && (
                <p className="mt-3 text-xs text-emerald-800/80 dark:text-emerald-200/70">
                  Compared {bidTally.revealed} revealed bid
                  {bidTally.revealed === 1 ? "" : "s"}. Unrevealed commitments
                  forfeit and are excluded.
                </p>
              )}
              {publicKey &&
                selected.winner === publicKey.toBase58() &&
                selected.winningAmountBaseUnits !== undefined && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onPaySeller}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ArrowRight size={14} strokeWidth={2.25} />
                      Pay seller (private MagicBlock transfer)
                    </button>
                    <span className="text-xs text-emerald-800/80 dark:text-emerald-200/80">
                      Uses{" "}
                      <code className="font-mono text-[11px]">
                        POST /v1/spl/transfer
                      </code>{" "}
                      with{" "}
                      <code className="font-mono text-[11px]">
                        visibility: &quot;private&quot;
                      </code>{" "}
                      and ephemeral balances.
                    </span>
                  </div>
                )}
            </div>
          )}
        </section>
      )}

      {status ? <StatusBanner status={status} busy={busy} /> : null}

      <Section
        title="Recent confirmed signatures"
        tip="Saved on this device only — devnet transactions you confirmed in the app, with a Solana Explorer link for each."
      >
        <ReceiptsList limit={4} />
      </Section>

      <SealedBidSimulation />
    </div>
  );
}
