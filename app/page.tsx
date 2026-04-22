import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Colosseum · Privacy Track
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Auctions with private settlement on Solana
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Two auction modes share one approach: keep strategic bids or clearing details off public graphs
          until it is time to pay, then settle with MagicBlock&apos;s{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">
            Private Payments API
          </strong>{" "}
          (devnet SPL with <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200">privacy: &quot;private&quot;</code>
          ).
        </p>
      </header>

      <section aria-labelledby="modes-heading">
        <h2 id="modes-heading" className="text-base font-medium text-zinc-900 dark:text-zinc-100">
          Modes
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Pick a flow to try with a wallet, or scroll to the guided sequence on each page for a narrated
          walkthrough without signing.
        </p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Link
            href="/sealed-bid"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Commit–reveal</span>
            <h3 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              Sealed-bid auction
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Bidders submit hashes during the window; after close, amounts are verified and the highest
              valid bid wins. Payout uses a private transfer to the seller.
            </p>
            <span className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Open sealed-bid →
            </span>
          </Link>

          <Link
            href="/dutch"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Descending price</span>
            <h3 className="mt-2 text-lg font-semibold text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              Private Dutch sale
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              The ask drops on a timer until someone buys at the current price. The buyer pays the seller
              through the same private transfer path as sealed-bid.
            </p>
            <span className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Open Dutch sale →
            </span>
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-950/30">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Docs & API</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Reference for deposit and transfer builders:{" "}
          <a
            href="https://payments.magicblock.app/reference"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-600"
            target="_blank"
            rel="noreferrer"
          >
            payments.magicblock.app
          </a>
          . Fund devnet SOL and USDC before testing deposits.
        </p>
      </section>
    </div>
  );
}
