import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  EyeOff,
  Gavel,
  Timer,
  Layers,
  ServerCog,
  CircleDot,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";

const codeChip =
  "rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function Home() {
  return (
    <div className="space-y-16 sm:space-y-20">
      <section
        aria-labelledby="hero-heading"
        className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-gradient-to-b from-white to-zinc-50 px-6 py-12 shadow-sm sm:px-10 sm:py-14 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(48%_60%_at_85%_15%,rgba(16,185,129,0.18),transparent_60%),radial-gradient(60%_60%_at_15%_10%,rgba(139,92,246,0.18),transparent_60%)]"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet" icon={<ShieldCheck size={12} strokeWidth={2.25} />}>
              Colosseum · Privacy Track
            </Badge>
            <Badge tone="emerald" icon={<CircleDot size={12} strokeWidth={2.25} />}>
              Live on devnet
            </Badge>
            <Badge tone="sky">Real MagicBlock Private Payments</Badge>
          </div>

          <h1
            id="hero-heading"
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50"
          >
            Auctions on Solana, settled{" "}
            <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">
              privately.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-300">
            Two auction mechanics — sealed-bid commit–reveal and a descending
            Dutch sale — pay the seller through MagicBlock&apos;s{" "}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-100">
              Private Payments API
            </strong>
            . Funds move from a buyer&apos;s ephemeral rollup balance with{" "}
            <code className={codeChip}>visibility: &quot;private&quot;</code>,
            so the settlement leg is not a public &ldquo;who paid whom&rdquo;
            edge.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sealed-bid"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <Gavel size={16} strokeWidth={2} />
              Try sealed-bid
              <ArrowRight size={16} strokeWidth={2} className="opacity-70" />
            </Link>
            <Link
              href="/dutch"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              <Timer size={16} strokeWidth={2} />
              Open Dutch sale
            </Link>
            <Link
              href="/context"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-700 underline-offset-4 transition hover:underline dark:text-zinc-300"
            >
              Why this matters
              <ArrowRight size={14} strokeWidth={2} className="opacity-70" />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-heading">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="how-heading"
              className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              How a private settlement runs
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Three steps the buyer does in the app — same path for sealed-bid
              and Dutch.
            </p>
          </div>
          <Badge tone="neutral">Devnet flow</Badge>
        </header>

        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="relative rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <Layers size={16} strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Step 1
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Deposit to the rollup
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Buyer signs a MagicBlock-built{" "}
              <code className={codeChip}>POST /v1/spl/deposit</code> that funds
              an ephemeral USDC balance on devnet. We refresh the blockhash
              just-in-time so wallet UX stays snappy.
            </p>
          </li>

          <li className="relative rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">
                <Gavel size={16} strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Step 2
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Run the auction in app
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sealed-bid: SHA-256 commitments during bidding, reveals after
              close, highest valid bid wins. Dutch: price ticks down on a
              schedule until a buyer takes the lot.
            </p>
          </li>

          <li className="relative rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <EyeOff size={16} strokeWidth={2.25} />
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Step 3 · Private
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Pay the seller privately
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              <code className={codeChip}>POST /v1/spl/transfer</code> with{" "}
              <code className={codeChip}>visibility: &quot;private&quot;</code>{" "}
              and ephemeral balances on both sides. Confirmation returns a
              Solana signature you can open on Explorer.
            </p>
          </li>
        </ol>
      </section>

      <section aria-labelledby="modes-heading">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="modes-heading"
              className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Pick a mode and try it
            </h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
              Or scroll the guided panel on each page for a narrated, no-wallet
              walkthrough — handy for recordings.
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Link
            href="/sealed-bid"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-violet-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800/60"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                <Gavel size={18} strokeWidth={2.25} />
              </span>
              <Badge tone="violet">Commit–reveal</Badge>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Sealed-bid auction
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Bidders publish SHA-256 commitments during the window. After
              close, amounts are revealed and verified; the highest valid bid
              wins. Payout is a private MagicBlock transfer.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-violet-700 dark:text-violet-300">
              Open sealed-bid
              <ArrowRight
                size={14}
                strokeWidth={2}
                className="transition group-hover:translate-x-0.5"
              />
            </span>
          </Link>

          <Link
            href="/dutch"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300/80 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800/60"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Timer size={18} strokeWidth={2.25} />
              </span>
              <Badge tone="emerald">Descending price</Badge>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Private Dutch sale
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              The ask drops on a timer until someone takes the lot. The buyer
              pays the seller at the live price using the same private
              transfer path as sealed-bid.
            </p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Open Dutch sale
              <ArrowRight
                size={14}
                strokeWidth={2}
                className="transition group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="trust-heading"
        className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 p-6 dark:border-zinc-800 dark:bg-zinc-950/40"
      >
        <h2 id="trust-heading" className="sr-only">
          Stack and references
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <ServerCog size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Real MagicBlock integration
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Deposit and private transfer go through{" "}
                <a
                  href="https://payments.magicblock.app/reference"
                  className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  payments.magicblock.app
                  <ExternalLink size={11} strokeWidth={2} />
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <ShieldCheck size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Devnet wallet flows
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Phantom-compatible adapters, blockhash refresh, “already
                processed” recovery, and Explorer links for every confirmed
                signature.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              <EyeOff size={18} strokeWidth={2.25} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Privacy first, demo-able
              </p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                Auction logic is in-app for fast resets while recording, the
                settlement leg is the one that matters and lives on chain.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
