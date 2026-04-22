"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DemoCommitmentsTable,
  DemoMagicBlockCard,
  DemoSealedAuctionSnapshot,
  DemoTerminalShell,
  TermComment,
  TermEffect,
  TermHttp,
  TermPrompt,
  TermResponse,
  TermSig,
  TermStepHeading,
} from "@/components/demo-terminal";
import { DEFAULT_DEPOSIT_USDC, DEVNET_USDC_MINT } from "@/lib/constants";
import { parseUsdcToBaseUnits } from "@/lib/format";

const DEPOSIT_BASE_UNITS = Number(
  parseUsdcToBaseUnits(DEFAULT_DEPOSIT_USDC),
);

const SELLER = "Ali8K2m…9vQr";
const BOB = "Bob3pQ9…nWx1";
const CAROL = "Car7rL4…wYz2";
const AUCTION_ID = "demo-sealed-01";

const AUTO_MS = 3200;

const USDC_BODY = `{
  "from": "${CAROL}",
  "to": "${SELLER}",
  "amount": 3000000,
  "mint": "${DEVNET_USDC_MINT}",
  "cluster": "devnet",
  "visibility": "private",
  "fromBalance": "ephemeral",
  "toBalance": "ephemeral",
  "memo": "sealed:${AUCTION_ID}"
}`;

const TX_RESP = `{
  "kind": "transfer",
  "version": "legacy",
  "transactionBase64": "AQAAAAAAAA…trunc…==",
  "sendTo": "base",
  "requiredSigners": ["${CAROL}"],
  "instructionCount": 4
}`;

const codeClass =
  "rounded bg-zinc-100 px-1 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

function SealedStepBlocks({ step }: { step: number }) {
  return (
    <>
      {step >= 0 && (
        <>
          <TermStepHeading
            step={1}
            title="Listing goes live"
            summary="The auction exists in app state only; amounts are not posted yet."
          />
          <TermComment>
            Layout matches the auction panel above—this run uses fixed sample
            data.
          </TermComment>
          <DemoSealedAuctionSnapshot
            title="Genesis lot"
            phase="bidding"
            sellerShort={SELLER}
            auctionId={AUCTION_ID}
          />
          <DemoMagicBlockCard>
            <TermHttp method="GET" path="/health" />
            <TermResponse status="200 OK">{`{ "status": "ok" }`}</TermResponse>
          </DemoMagicBlockCard>
          <TermEffect>
            <p>
              The payments service responds; no funds move until a deposit or
              transfer is built and signed.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 1 && (
        <>
          <TermStepHeading
            step={2}
            title="Commitments posted"
            summary="Each bid is a hash of auction id, wallet, amount, and a secret salt."
          />
          <TermPrompt>
            sha256(auctionId ‖ bidder ‖ amount ‖ salt) → commitment
          </TermPrompt>
          <DemoCommitmentsTable
            rows={[
              { bidder: BOB, commitment: "a3f91c22e4b8…11e8" },
              { bidder: CAROL, commitment: "9b2d4471c0a1…9c02" },
            ]}
          />
          <TermEffect>
            <p>
              The UI shows commitments only. The hash does not reveal the bid
              amount without the salt and reveal step.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 2 && (
        <>
          <TermStepHeading
            step={3}
            title="End bidding → reveal"
            summary="In the app, the seller can open the reveal phase before the timer, or everyone waits for the window."
          />
          <TermPrompt>
            End bidding &amp; open reveal → phase ← REVEALING
          </TermPrompt>
          <TermEffect>
            <p>
              Matches the live UI: the seller (or the clock after the scheduled
              end) moves the session to reveal. Raw amounts stay off the
              public graph until bidders enter amounts that match their
              commitments, then you finalize the winner.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 3 && (
        <>
          <TermStepHeading
            step={4}
            title="Reveal and settlement"
            summary="Verify each reveal against its commitment; highest valid bid wins."
          />
          <TermPrompt>verify({BOB}, 2.50 USDC) → OK</TermPrompt>
          <TermPrompt>verify({CAROL}, 3.00 USDC) → OK</TermPrompt>
          <TermPrompt>
            winner = Carol · clearing = 3.00 USDC (3_000_000 base units)
          </TermPrompt>
          <DemoSealedAuctionSnapshot
            title="Genesis lot"
            phase="settled"
            sellerShort={SELLER}
            auctionId={AUCTION_ID}
            winnerShort={CAROL}
            clearingUsdc="3.00"
          />
          <TermEffect>
            <p>
              The winner is fixed before any payout. Settlement comes next via
              deposit (if needed) and a private transfer.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 4 && (
        <>
          <TermStepHeading
            step={5}
            title="Deposit to rollup"
            summary="Fund the ephemeral (ER) balance on devnet—the same default amount as the live app button."
          />
          <TermComment>
            The wallet must hold devnet USDC (SPL) for this mint, plus devnet
            SOL for fees—same as a successful run on the page.
          </TermComment>
          <DemoMagicBlockCard>
            <TermHttp
              method="POST"
              path="/v1/spl/deposit"
              body={`{
  "owner": "${CAROL}",
  "amount": ${DEPOSIT_BASE_UNITS},
  "mint": "${DEVNET_USDC_MINT}",
  "cluster": "devnet",
  "initIfMissing": true,
  "initAtasIfMissing": true,
  "idempotent": true
}`}
            />
            <TermResponse status="200 OK">{`{
  "kind": "deposit",
  "transactionBase64": "AQABAg…trunc…",
  "sendTo": "base",
  "requiredSigners": ["${CAROL}"]
}`}</TermResponse>
          </DemoMagicBlockCard>
          <TermEffect>
            <p>
              The response is an unsigned transaction. After the wallet signs
              and the network confirms, balance is available for private
              transfer per MagicBlock’s flow.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 5 && (
        <>
          <TermStepHeading
            step={6}
            title="Private transfer to seller"
            summary="POST /v1/spl/transfer with from, to, visibility, and balance layers; sign and send the returned tx."
          />
          <DemoMagicBlockCard>
            <TermHttp method="POST" path="/v1/spl/transfer" body={USDC_BODY} />
            <TermResponse status="200 OK">{TX_RESP}</TermResponse>
          </DemoMagicBlockCard>
          <TermPrompt>wallet.signAndSend(transactionBase64)</TermPrompt>
          <TermComment>
            The app replaces the blockhash in the unsigned tx (RPC) right before
            the wallet prompt so a slightly stale API build still simulates on
            devnet; then the wallet signs and the network confirms.
          </TermComment>
          <TermSig label="Signature" value="5ZkT…8qLm" />
          <TermEffect>
            <p>
              <code className={codeClass}>from</code> /{" "}
              <code className={codeClass}>to</code>,{" "}
              <code className={codeClass}>visibility: &quot;private&quot;</code>
              , and <code className={codeClass}>ephemeral</code> balances for
              both sides match the current MagicBlock validation schema (same
              pattern that succeeded in a working devnet run).
            </p>
          </TermEffect>
        </>
      )}
    </>
  );
}

export function SealedBidSimulation() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const max = 5;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndNotified = useRef(false);

  const reset = useCallback(() => {
    setStep(0);
    setAutoPlay(false);
    autoEndNotified.current = false;
  }, []);

  useEffect(() => {
    if (autoPlay) autoEndNotified.current = false;
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setStep((s) => {
        if (s >= max) return s;
        const next = s + 1;
        if (next >= max && !autoEndNotified.current) {
          autoEndNotified.current = true;
          queueMicrotask(() => setAutoPlay(false));
        }
        return next;
      });
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, max]);

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Sealed-bid guided sequence"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            Sealed-bid sequence
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Stages line up with the form: commitments, end bidding to reveal
            (seller can end early), verify and finalize, then a deposit
            (defaults to {DEFAULT_DEPOSIT_USDC} USDC) and a MagicBlock
            <code className="mx-1">from</code>/
            <code className="mx-1">to</code> transfer. Advance with{" "}
            <span className="text-zinc-800 dark:text-zinc-200">Next</span>, or
            enable a timed advance for screen recording.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={autoPlay}
            onChange={(e) => setAutoPlay(e.target.checked)}
            className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:text-zinc-100"
          />
          Auto-advance ({AUTO_MS / 1000}s)
        </label>
      </div>

      <DemoTerminalShell
        windowTitle="Sample run"
        subtitle="No wallet: bodies match the app (deposit amount, transfer schema, blockhash refresh on send). Balances are illustrative."
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Marginal notes under each step state what changed.
        </p>
        <SealedStepBlocks step={step} />
      </DemoTerminalShell>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setStep((x) => Math.max(0, x - 1))}
          disabled={step === 0}
          className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() =>
            step === max ? reset() : setStep((x) => Math.min(max, x + 1))
          }
          className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {step === max ? "Start over" : "Next"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-3.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Reset
        </button>
        <span className="ml-auto text-xs tabular-nums text-zinc-500">
          {step + 1} / {max + 1}
        </span>
      </div>
    </section>
  );
}
