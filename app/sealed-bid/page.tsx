"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DEVNET_USDC_MINT } from "@/lib/constants";
import { formatUserError } from "@/lib/error-message";
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

function shortAddr(a: string) {
  return `${a.slice(0, 4)}…${a.slice(-4)}`;
}

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

  const runTx = async (label: string, fn: () => Promise<string>) => {
    if (!adapter || !publicKey || !signTransaction) {
      setStatus("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setStatus(`${label}…`);
    try {
      const sig = await fn();
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature: sig,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      });
      setStatus(`${label} confirmed: ${sig}`);
    } catch (e) {
      setStatus(`${label} failed: ${formatUserError(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const onDeposit = () =>
    runTx("Deposit to rollup", async () => {
      const base = parseUsdcToBaseUnits("0.5");
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
      openRevealPhase(selected.id);
      refresh();
      setStatus("Reveal phase open — submit your amounts.");
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
    runTx("Private pay seller", async () => {
      if (!publicKey || !selected?.winner || !selected.winningAmountBaseUnits) {
        throw new Error("Nothing to pay");
      }
      if (publicKey.toBase58() !== selected.winner) {
        throw new Error("Only the winner wallet can settle");
      }
      const built = await buildPrivateTransferTx({
        owner: publicKey.toBase58(),
        destination: selected.seller,
        amount: Number(selected.winningAmountBaseUnits),
        mint: DEVNET_USDC_MINT,
        memo: `sealed:${selected.id}`,
      });
      return signAndSendBase64Transaction(
        connection,
        asSignerWalletAdapter(adapter),
        built.transactionBase64,
      );
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sealed-bid auction</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          During bidding, each participant stores a{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            commitment
          </strong>{" "}
          (hash of auction id, wallet, amount, and salt)—not the amount itself.
          When bidding ends, bidders reveal; the app checks hashes and picks a
          winner. Only then does the winner call MagicBlock to{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            pay the seller privately
          </strong>{" "}
          on devnet.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            MagicBlock — devnet
          </h2>
          <InfoTip text="On-chain you use MagicBlock’s payments API: deposit devnet USDC into your Ephemeral Rollup (ER) balance, then spend from that balance with a private transfer. Ideal demo footage: deposit, then a private pay after the auction is resolved." />
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Deposit devnet USDC into the rollup balance, then use a private SPL
          transfer to the seller after the auction is settled. Both actions go
          through the same payments API your video should show end-to-end.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDeposit}
            disabled={busy || !publicKey}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Deposit 0.5 USDC (rollup)
          </button>
          <InfoTip text="Builds a deposit transaction from the API; your wallet signs and devnet confirms. Ensure the wallet has devnet SOL and USDC for fees and the transfer." />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            <h2 className="font-semibold">Create auction</h2>
            <InfoTip text="In this demo, the seller defines title and a bidding window. Auction data lives in the browser; a full track submission could anchor rules or commitments on Solana (e.g. with a Private Ephemeral Rollup) while still using the Private Payments API to settle." />
          </div>
          <label className="mt-4 block text-sm text-zinc-600 dark:text-zinc-400">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="mt-3 block text-sm text-zinc-600 dark:text-zinc-400">
            Bidding window (minutes)
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </label>
          <button
            type="button"
            onClick={onCreate}
            disabled={busy || !publicKey}
            className="mt-4 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Create (seller = connected wallet)
          </button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1">
            <h2 className="font-semibold">Place sealed bid</h2>
            <InfoTip text="Bidders submit a commitment: a hash of auction id, your wallet, amount, and a random salt. Bidding amounts are not on a public graph until the reveal step." />
          </div>
          <label className="mt-4 block text-sm text-zinc-600 dark:text-zinc-400">
            Auction
            <select
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
          <label className="mt-3 block text-sm text-zinc-600 dark:text-zinc-400">
            Bid amount (USDC)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
            />
          </label>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onBid}
              disabled={busy || !publicKey || !selected}
              className="min-w-0 flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Seal bid (local commitment)
            </button>
            <InfoTip text="Only the commitment is stored in this session; keep your bid amount to reveal later. Same salt is derived inside the app when you commit." />
          </div>
        </div>
      </section>

      {selected && (
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{selected.title}</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Seller {shortAddr(selected.seller)} · Phase{" "}
                <span className="font-medium">{selected.phase}</span>
              </p>
            </div>
            {selected.phase === "bidding" &&
              clock >= selected.endTimeMs && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onOpenReveal}
                  className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
                >
                  Close bidding → reveal
                </button>
                <InfoTip text="Stops the commit window. Bidders can now reveal the amounts that match their commitments. Anyone can use this when the time elapses; adjust for a production rule set on chain." />
              </div>
            )}
            {selected.phase === "revealing" && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onFinalize}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Finalize winner
                </button>
                <InfoTip text="Recomputes hashes, picks the top valid bid, and records the winner and clearing amount. The winner can then pay the seller with a private transfer." />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="py-2 pr-4">Bidder</th>
                  <th className="py-2 pr-4">
                    <span className="inline-flex items-center gap-1">
                      Commitment
                      <InfoTip text="A SHA-256 digest published during bidding. It hides your amount until you reveal, while binding you to a single bid." />
                    </span>
                  </th>
                  <th className="py-2">
                    <span className="inline-flex items-center gap-1">
                      Revealed
                      <InfoTip text="The USDC amount you disclose in the reveal phase, checked against the commitment. Empty until a successful reveal for that row." />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {selected.bids.map((b) => (
                  <tr
                    key={`${b.bidder}-${b.commitmentHex}`}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2 pr-4 font-mono text-xs">
                      {shortAddr(b.bidder)}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {b.commitmentHex.slice(0, 18)}…
                    </td>
                    <td className="py-2">
                      {b.amountBaseUnits !== undefined
                        ? formatBaseUnitsAsUsdc(b.amountBaseUnits)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected.phase === "revealing" && publicKey && (
            <div className="space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950">
              <p className="text-sm font-medium">
                <span className="inline-flex items-center gap-1">
                  Reveal your bid
                  <InfoTip text="Enter the same USDC amount you used when bidding. The app re-hashes it with the stored salt to match your commitment." />
                </span>
              </p>
              {selected.bids
                .filter((b) => b.bidder === publicKey.toBase58())
                .map((b) => (
                  <div
                    key={b.commitmentHex}
                    className="flex flex-wrap items-end gap-2"
                  >
                    <label className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                      Amount for {b.commitmentHex.slice(0, 8)}…
                      <input
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
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
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                      Reveal
                    </button>
                  </div>
                ))}
            </div>
          )}

          {selected.phase === "settled" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
              <p>
                Winner:{" "}
                <span className="font-mono">
                  {selected.winner ? shortAddr(selected.winner) : "None"}
                </span>
              </p>
              {selected.winningAmountBaseUnits !== undefined && (
                <p className="mt-1">
                  Clearing amount:{" "}
                  {formatBaseUnitsAsUsdc(selected.winningAmountBaseUnits)} USDC
                </p>
              )}
              {publicKey &&
                selected.winner === publicKey.toBase58() &&
                selected.winningAmountBaseUnits !== undefined && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onPaySeller}
                      disabled={busy}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                    >
                      Pay seller (private MagicBlock transfer)
                    </button>
                    <InfoTip text="Only the connected winner wallet. Uses Private Payments (privacy: “private”): the clearing amount to the auction seller, with a memo for this auction id. Shows well in a 3-minute demo as the money step." />
                  </div>
                )}
            </div>
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

      <SealedBidSimulation />
    </div>
  );
}
