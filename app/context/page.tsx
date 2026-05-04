import Link from "next/link";
import {
  ArrowRight,
  EyeOff,
  ShieldCheck,
  Wallet,
  ServerCog,
  Layers,
  Gavel,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";

const codeChip =
  "rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[12px] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function ContextPage() {
  return (
    <div className="space-y-14">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="violet" icon={<Sparkles size={12} strokeWidth={2.25} />}>
            Context
          </Badge>
          <Badge tone="emerald">Devnet</Badge>
        </div>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Why private settlement?
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Auction mechanics need rules and price discovery. The{" "}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
            money leg
          </strong>{" "}
          is the one that often shouldn&apos;t be public. This page shows what
          the app exposes, what it hides, and how MagicBlock&apos;s ephemeral
          rollup balances make that possible without re-implementing every
          plumbing piece.
        </p>
      </header>

      <section
        className="grid gap-5 md:grid-cols-2"
        aria-labelledby="problem-heading"
      >
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <header className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              <EyeOff size={18} strokeWidth={2.25} />
            </span>
            <h2
              id="problem-heading"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              The problem
            </h2>
          </header>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Public auctions and routine on-chain transfers leak strategy:
            <strong className="ms-1 font-semibold text-zinc-800 dark:text-zinc-200">
              who
            </strong>{" "}
            bid, <strong className="font-semibold text-zinc-800 dark:text-zinc-200">how much</strong>,
            <strong className="ms-1 font-semibold text-zinc-800 dark:text-zinc-200">when</strong>,
            and after a clear, who paid whom looks obvious in the public graph.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Procurement &amp; vendor sealed bids are unfair if early bids leak.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Liquidations and OTC pay graphs reveal counterparties.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
              Even a single &ldquo;winning bid&rdquo; transfer often becomes
              the unique fingerprint of a deal.
            </li>
          </ul>
        </article>

        <article className="rounded-2xl border border-emerald-200/70 bg-emerald-50/40 p-6 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <header className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck size={18} strokeWidth={2.25} />
            </span>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              The solution in this app
            </h2>
          </header>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Auction logic stays in the client for fast, resettable demos
            (commit-reveal, price ticks, sessions in <code className={codeChip}>localStorage</code>
            ). The settlement path is real:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} strokeWidth={2.25} className="mt-0.5 text-emerald-600" />
              <span>
                <code className={codeChip}>POST /v1/spl/deposit</code> funds an
                <strong className="ms-1 font-semibold">ephemeral</strong>{" "}
                rollup USDC balance on devnet.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} strokeWidth={2.25} className="mt-0.5 text-emerald-600" />
              <span>
                <code className={codeChip}>POST /v1/spl/transfer</code> with{" "}
                <code className={codeChip}>visibility: &quot;private&quot;</code>{" "}
                pays the seller from that balance.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 size={16} strokeWidth={2.25} className="mt-0.5 text-emerald-600" />
              <span>
                Confirmed signatures are exposed in the UI with one-click
                Solana Explorer links so anyone can verify.
              </span>
            </li>
          </ul>
        </article>
      </section>

      <section aria-labelledby="flow-heading">
        <header>
          <h2
            id="flow-heading"
            className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            What the chain sees vs what stays in app
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
            Visualised end-to-end. Click any auction page after this to see the
            real request bodies in the guided panel.
          </p>
        </header>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              icon: <Wallet size={18} strokeWidth={2.25} />,
              tone: "violet" as const,
              label: "Wallet",
              line1: "Buyer signs deposit",
              line2: "Devnet SOL + USDC required",
            },
            {
              icon: <Layers size={18} strokeWidth={2.25} />,
              tone: "violet" as const,
              label: "Rollup balance",
              line1: "Ephemeral USDC",
              line2: "fromBalance: ephemeral",
            },
            {
              icon: <Gavel size={18} strokeWidth={2.25} />,
              tone: "neutral" as const,
              label: "Auction logic",
              line1: "Commit-reveal or Dutch ticks",
              line2: "Browser, fast resets",
            },
            {
              icon: <EyeOff size={18} strokeWidth={2.25} />,
              tone: "emerald" as const,
              label: "Private settlement",
              line1: "POST /v1/spl/transfer",
              line2: "visibility: \"private\"",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="relative rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="flex items-center gap-2">
                <Badge tone={s.tone}>{s.label}</Badge>
              </div>
              <div className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {s.icon}
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {s.line1}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {s.line2}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900"
        aria-labelledby="mb-heading"
      >
        <header className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
            <ServerCog size={18} strokeWidth={2.25} />
          </span>
          <h2
            id="mb-heading"
            className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
          >
            Why MagicBlock — Ephemeral Rollups + Private Payments API
          </h2>
        </header>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          MagicBlock pairs an ephemeral rollup model with a hosted payments
          surface so we can move USDC in flows designed for private settlement
          without re-implementing every plumbing piece.
        </p>
        <ul className="mt-5 grid gap-3 md:grid-cols-3">
          <li className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              ER-facing balance
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Buyers fund a rollup USDC position the API spends from. The
              private leg is not a single obvious public SPL hop.
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Stable HTTP surface
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              <code className={codeChip}>/v1/spl/*</code> for health, deposit,
              and transfer with hosted error semantics — fewer custom programs
              for a hackathon timeline.
            </p>
          </li>
          <li className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Devnet first
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Real Solana cluster, real wallet, real explorer entries — the
              same flow demo viewers can reproduce in minutes.
            </p>
          </li>
        </ul>
        <p className="mt-5 text-xs text-zinc-500 dark:text-zinc-500">
          Product:{" "}
          <a
            href="https://magicblock.app/"
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            magicblock.app
            <ExternalLink size={11} strokeWidth={2} />
          </a>
          {" · "}
          <a
            href="https://payments.magicblock.app/reference"
            className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            payments API reference
            <ExternalLink size={11} strokeWidth={2} />
          </a>
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href="/sealed-bid"
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          Try sealed-bid
          <ArrowRight size={16} strokeWidth={2} className="opacity-70" />
        </Link>
        <Link
          href="/dutch"
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
        >
          Open Dutch sale
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 underline-offset-4 transition hover:underline dark:text-zinc-300"
        >
          Back to home
        </Link>
      </section>
    </div>
  );
}
