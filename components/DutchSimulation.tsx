"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  DemoDutchAcceptBanner,
  DemoDutchPriceHero,
  DemoDutchSessionSnapshot,
  DemoMagicBlockCard,
  DemoTerminalShell,
  TermComment,
  TermEffect,
  TermHttp,
  TermPrompt,
  TermResponse,
  TermSig,
  TermStepHeading,
} from "@/components/demo-terminal";
import { DEVNET_USDC_MINT } from "@/lib/constants";

const SELLER = "Maya…vH2q";
const BUYER = "Alex…tN8r";
const SESSION_ID = "demo-dutch-01";

const PRICES = [
  { usdc: "10.00", base: 10_000_000 },
  { usdc: "9.25", base: 9_250_000 },
  { usdc: "8.50", base: 8_500_000 },
  { usdc: "7.75", base: 7_750_000 },
];

const AUTO_MS = 2600;
const MAX = 6;

const TRANSFER_BODY = (amount: number) =>
  `{
  "owner": "${BUYER}",
  "destination": "${SELLER}",
  "amount": ${amount},
  "mint": "${DEVNET_USDC_MINT}",
  "cluster": "devnet",
  "privacy": "private",
  "memo": "dutch:${SESSION_ID}"
}`;

const codeClass =
  "rounded bg-zinc-100 px-1 font-mono text-[11px] text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

function DutchTerminalBlocks({ step }: { step: number }) {
  const clearPrice = PRICES[Math.min(PRICES.length - 1, Math.max(0, step - 2))];
  const amountAtBuy = PRICES[PRICES.length - 1].base;

  return (
    <>
      {step >= 0 && (
        <>
          <TermStepHeading
            step={1}
            title="Session and health check"
            summary="Local session parameters plus a quick reachability check to the payments API."
          />
          <DemoMagicBlockCard>
            <TermHttp method="GET" path="/health" />
            <TermResponse status="200 OK">{`{ "status": "ok" }`}</TermResponse>
          </DemoMagicBlockCard>
          <DemoDutchSessionSnapshot
            sessionId={SESSION_ID}
            sellerShort={SELLER}
            startUsdc="10.00"
            floorUsdc="2.00"
            tickUsdc="0.25"
          />
          <TermEffect>
            <p>
              The price schedule runs in the app until someone buys; the first
              on-chain movement is the buyer’s transfer when they accept the
              current price.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 1 && (
        <>
          <TermStepHeading
            step={2}
            title="Opening ask"
            summary="Initial price is high; it falls on each tick until purchase or floor."
          />
          <DemoDutchPriceHero
            usdc={PRICES[0].usdc}
            tickIndex={1}
            tickTotal={4}
          />
          <TermEffect>
            <p>
              No settlement yet—this is the scheduled price shown to buyers,
              similar to the live session card above.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 2 && (
        <>
          <TermStepHeading
            step={3}
            title="Price step"
            summary="Ask decreases on the configured interval."
          />
          <DemoDutchPriceHero
            usdc={PRICES[1].usdc}
            tickIndex={2}
            tickTotal={4}
          />
          <TermEffect>
            <p>
              The current ask is public; the eventual payment still uses a
              private transfer at clearing.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 3 && (
        <>
          <TermStepHeading
            step={4}
            title="Price step"
            summary="Closer to the floor; buyer trades off waiting against losing the lot."
          />
          <DemoDutchPriceHero
            usdc={PRICES[2].usdc}
            tickIndex={3}
            tickTotal={4}
          />
          <TermEffect>
            <p>
              Same mechanics as the previous ticks—only the displayed price and
              tick index change.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 4 && (
        <>
          <TermStepHeading
            step={5}
            title="Last tick before purchase"
            summary="Buyer needs enough rollup balance to cover this ask when they confirm."
          />
          <DemoDutchPriceHero
            usdc={PRICES[3].usdc}
            tickIndex={4}
            tickTotal={4}
          />
          <TermEffect>
            <p>
              In the live app, the next control is purchase; here that leads to
              the MagicBlock{" "}
              <code className={codeClass}>transfer</code> with{" "}
              <code className={codeClass}>privacy: private</code>.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 5 && (
        <>
          <TermStepHeading
            step={6}
            title="Purchase confirmed"
            summary="Session records buyer and clearing price; funds move in the following request."
          />
          <DemoDutchAcceptBanner
            buyerShort={BUYER}
            clearingUsdc={clearPrice.usdc}
          />
          <TermEffect>
            <p>
              State updates first; the transfer request carries the clearing
              amount in base units.
            </p>
          </TermEffect>
        </>
      )}

      {step >= 6 && (
        <>
          <TermStepHeading
            step={7}
            title="Private transfer"
            summary="Same transfer endpoint as sealed-bid; body uses the clearing price from the session."
          />
          <TermComment>
            Amounts are SPL base units (6 decimals for this devnet USDC mint).
          </TermComment>
          <DemoMagicBlockCard>
            <TermHttp
              method="POST"
              path="/v1/spl/transfer"
              body={TRANSFER_BODY(amountAtBuy)}
            />
            <TermResponse status="200 OK">{`{
  "kind": "transfer",
  "version": "legacy",
  "transactionBase64": "AQID…trunc…==",
  "sendTo": "base",
  "requiredSigners": ["${BUYER}"],
  "validator": "MAS1…"
}`}</TermResponse>
          </DemoMagicBlockCard>
          <TermPrompt>wallet.signAndSend(transactionBase64)</TermPrompt>
          <TermSig label="Signature" value="devnet signature" />
          <TermEffect>
            <p>
              Sign the returned transaction in the wallet, broadcast, then
              confirm as usual. The sealed-bid flow uses the same{" "}
              <code className={codeClass}>POST /v1/spl/transfer</code> pattern
              with <code className={codeClass}>privacy: private</code>.
            </p>
          </TermEffect>
        </>
      )}
    </>
  );
}

export function DutchSimulation() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
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
        if (s >= MAX) return s;
        const next = s + 1;
        if (next >= MAX && !autoEndNotified.current) {
          autoEndNotified.current = true;
          queueMicrotask(() => setAutoPlay(false));
        }
        return next;
      });
    }, AUTO_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay]);

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Dutch auction guided sequence"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
            Dutch auction sequence
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Follows the session, price display, and purchase steps from the
            controls above, then the private transfer used at settlement—the
            same API shape as sealed-bid.
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
        subtitle="Ticks are scripted; the live page drives real timers and balances."
      >
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Marginal notes under each step state what changed.
        </p>
        <DutchTerminalBlocks step={step} />
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
            step === MAX ? reset() : setStep((x) => Math.min(MAX, x + 1))
          }
          className="rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {step === MAX ? "Start over" : "Next"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-md px-3.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Reset
        </button>
        <span className="ml-auto text-xs tabular-nums text-zinc-500">
          {step + 1} / {MAX + 1}
        </span>
      </div>
    </section>
  );
}
