import Link from "next/link";

const listClass = "mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400";

export default function ContextPage() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Context
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Problem, solution, and how MagicBlock fits
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Short framing for the two auction demos: what public chains expose, what this app
          offloads to MagicBlock, and why that matters for a private settlement path.
        </p>
      </header>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40"
        aria-labelledby="problem-heading"
      >
        <h2
          id="problem-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          The problem
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Public auctions and plain on-chain money movement surface a lot of what participants
          and organizers often want to keep strategic: <strong className="font-medium text-zinc-800 dark:text-zinc-200">who</strong> bid,{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">how much</strong>,{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">when</strong>, and after a
          win, a standard SPL settlement can read like a clear <strong className="font-medium text-zinc-800 dark:text-zinc-200">who paid whom</strong>{" "}
          edge in the public graph.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The goal in many procurement-, liquidation-, or OTC-style settings is to keep{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">price discovery and rules</strong>{" "}
          in your product, while the <strong className="font-medium text-zinc-800 dark:text-zinc-200">final</strong>{" "}
          token movement to the seller does not look like a routine public transfer path for
          that sensitive step.
        </p>
      </section>

      <section
        className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/40"
        aria-labelledby="solution-heading"
      >
        <h2
          id="solution-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          The solution in this app
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          This project keeps the <strong className="font-medium text-zinc-800 dark:text-zinc-200">auction behavior</strong>{" "}
          in the client for a fast, resettable demo: commit–reveal or a timed Dutch price schedule
          live in the browser, so you can run through flows without on-chain program complexity
          for the hackathon.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          The <strong className="font-medium text-zinc-800 dark:text-zinc-200">settlement</strong>{" "}
          path is the integration point: you fund a MagicBlock{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">ephemeral</strong> rollup
          USDC balance on <strong className="font-medium text-zinc-800 dark:text-zinc-200">devnet</strong> (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            POST /v1/spl/deposit
          </code>
          ), then the winner or buyer runs a <strong className="font-medium text-zinc-800 dark:text-zinc-200">private</strong>{" "}
          transfer the API builds to pay the seller (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            POST /v1/spl/transfer
          </code>{" "}
          with{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
            visibility: &quot;private&quot;
          </code>{" "}
          and the ephemeral balance kinds the current API expects).
        </p>
        <p className="mt-3 max-w-2xl text-sm text-zinc-500 dark:text-zinc-500">
          Read the request shapes in the guided panels on{" "}
          <Link
            href="/sealed-bid"
            className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600"
          >
            Sealed-bid
          </Link>{" "}
          and{" "}
          <Link
            href="/dutch"
            className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600"
          >
            Private Dutch
          </Link>
          .
        </p>
      </section>

      <section
        className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-6 sm:p-8 dark:border-violet-900/50 dark:bg-violet-950/20"
        aria-labelledby="mb-heading"
      >
        <h2
          id="mb-heading"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Why MagicBlock: Ephemeral Rollups and the Private Payments API
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          MagicBlock combines an <strong className="font-medium text-zinc-800 dark:text-zinc-200">ephemeral</strong>{" "}
          rollup model with a <strong className="font-medium text-zinc-800 dark:text-zinc-200">hosted</strong>{" "}
          payments service so you can move USDC in ways that are designed for <strong className="font-medium text-zinc-800 dark:text-zinc-200">private</strong>{" "}
          flows, instead of re-implementing every plumbing piece yourself.
        </p>
        <ul className={listClass}>
          <li>
            <strong className="text-zinc-800 dark:text-zinc-200">ER-facing balance</strong> — You
            deposit into a rollup USDC position the API can use for the next private spend; that
            is the on-ramp to settlement that is not a single obvious public SPL hop for the
            private leg.
          </li>
          <li>
            <strong className="text-zinc-800 dark:text-zinc-200">Private Payments API</strong> — A
            stable <code className="font-mono text-xs">/v1/spl/*</code> surface for health, building
            deposit and transfer transactions, and error semantics that match the hosted service.
          </li>
          <li>
            <strong className="text-zinc-800 dark:text-zinc-200">Devnet and iteration</strong> — You
            can run the same flow the repo documents against public devnet USDC and a wallet, which
            is what we optimize for in this demo and in a short screen recording.
          </li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
          Product background:{" "}
          <a
            href="https://magicblock.app/"
            className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600"
            target="_blank"
            rel="noreferrer"
          >
            magicblock.app
          </a>
          {" · "}
          <a
            href="https://payments.magicblock.app/reference"
            className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-200 dark:decoration-zinc-600"
            target="_blank"
            rel="noreferrer"
          >
            API reference
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link
          href="/"
          className="font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 dark:text-zinc-200"
        >
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
