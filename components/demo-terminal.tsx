import type { ReactNode } from "react";

const mono = "font-mono text-[12px] leading-relaxed";

/** Panel aligned with main app surfaces: neutral border, no decorative chrome. */
export function DemoTerminalShell({
  windowTitle,
  subtitle,
  children,
}: {
  windowTitle: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <header className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
              {windowTitle}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
            Read-only
          </span>
        </div>
      </header>
      <div className="max-h-[min(520px,62vh)] overflow-y-auto scroll-smooth bg-white p-5 dark:bg-zinc-900 [scrollbar-width:thin]">
        {children}
      </div>
    </section>
  );
}

/** Step label: numbering + title, no tinted pills. */
export function TermStepHeading({
  step,
  title,
  summary,
}: {
  step: number;
  title: string;
  summary?: string;
}) {
  return (
    <div className="mt-8 border-t border-zinc-100 pt-6 first:mt-0 first:border-t-0 first:pt-0 dark:border-zinc-800">
      <p className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
        {String(step).padStart(2, "0")}
      </p>
      <h4 className="mt-1 text-[15px] font-medium text-zinc-900 dark:text-zinc-50">
        {title}
      </h4>
      {summary ? (
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {summary}
        </p>
      ) : null}
    </div>
  );
}

export function TermPrompt({ children }: { children: ReactNode }) {
  return (
    <div
      className={`mt-3 rounded-md border border-zinc-200 bg-zinc-50/80 py-2 pl-3 pr-2 first:mt-0 dark:border-zinc-700 dark:bg-zinc-950/50 ${mono}`}
    >
      <span className="text-zinc-400">$ </span>
      <span className="text-zinc-800 dark:text-zinc-200">{children}</span>
    </div>
  );
}

export function TermComment({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      {children}
    </p>
  );
}

export function TermJson({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-[11px] leading-relaxed text-zinc-800 dark:border-zinc-700 dark:bg-zinc-950/50 dark:text-zinc-300">
      {children}
    </pre>
  );
}

export function TermHttp({
  method,
  path,
  body,
}: {
  method: string;
  path: string;
  body?: string;
}) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {method}
        </span>
        <span className="break-all text-[12px] text-zinc-600 dark:text-zinc-400">
          payments.magicblock.app
          <span className="text-zinc-800 dark:text-zinc-200">{path}</span>
        </span>
      </div>
      {body ? <TermJson>{body}</TermJson> : null}
    </div>
  );
}

export function TermResponse({
  status,
  children,
}: {
  status: string;
  children: string;
}) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
        <span className="text-zinc-400">Response</span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          {status}
        </span>
      </div>
      <TermJson>{children}</TermJson>
    </div>
  );
}

/** Short clarification after a step—muted, not a second UI theme. */
export function TermEffect({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 border-l-2 border-zinc-300 pl-3 text-sm leading-relaxed text-zinc-700 dark:border-zinc-600 dark:text-zinc-300">
      {children}
    </div>
  );
}

export function TermSig({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 text-[12px]">
      <span className="text-zinc-500">{label} </span>
      <span className="break-all font-mono text-zinc-800 dark:text-zinc-200">
        {value}
      </span>
    </div>
  );
}

export function DemoMagicBlockCard({
  eyebrow = "MagicBlock · devnet",
  children,
}: {
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{eyebrow}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function DemoSealedAuctionSnapshot({
  title,
  phase,
  sellerShort,
  auctionId,
  winnerShort,
  clearingUsdc,
}: {
  title: string;
  phase: string;
  sellerShort: string;
  auctionId: string;
  winnerShort?: string;
  clearingUsdc?: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </h4>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Seller{" "}
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
          {sellerShort}
        </span>
        <span className="text-zinc-400"> · </span>
        <span className="text-zinc-800 dark:text-zinc-200">{phase}</span>
      </p>
      <p className="mt-2 font-mono text-xs text-zinc-500">{auctionId}</p>
      {winnerShort ? (
        <p className="mt-3 border-t border-zinc-100 pt-3 text-sm text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
          Outcome:{" "}
          <span className="font-mono text-xs">{winnerShort}</span>
          {clearingUsdc ? (
            <>
              {" "}
              at{" "}
              <span className="tabular-nums font-medium">{clearingUsdc}</span>{" "}
              USDC
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function DemoCommitmentsTable({
  rows,
}: {
  rows: { bidder: string; commitment: string }[];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-950/50">
            <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Bidder
            </th>
            <th className="py-2.5 pr-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Commitment
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.bidder + r.commitment}
              className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
            >
              <td className="px-4 py-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                {r.bidder}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-zinc-800 dark:text-zinc-200">
                {r.commitment}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DemoDutchPriceHero({
  usdc,
  tickIndex,
  tickTotal,
}: {
  usdc: string;
  tickIndex: number;
  tickTotal: number;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Current price</p>
        <p className="mt-0.5 text-3xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {usdc}{" "}
          <span className="text-lg font-normal text-zinc-500">USDC</span>
        </p>
      </div>
      <p className="text-sm tabular-nums text-zinc-500">
        {tickIndex} of {tickTotal}
      </p>
    </div>
  );
}

export function DemoDutchSessionSnapshot({
  sessionId,
  sellerShort,
  startUsdc,
  floorUsdc,
  tickUsdc,
}: {
  sessionId: string;
  sellerShort: string;
  startUsdc: string;
  floorUsdc: string;
  tickUsdc: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
        Active session
      </h4>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Seller{" "}
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
          {sellerShort}
        </span>
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-zinc-500">Session</dt>
          <dd className="mt-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">
            {sessionId}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-zinc-500">Range</dt>
          <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
            {startUsdc} → {floorUsdc} USDC
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-zinc-500">Step size</dt>
          <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
            {tickUsdc} USDC per tick
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DemoDutchAcceptBanner({
  buyerShort,
  clearingUsdc,
}: {
  buyerShort: string;
  clearingUsdc: string;
}) {
  return (
    <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-950/40">
      <p className="font-medium text-zinc-900 dark:text-zinc-100">
        Buy at current price
      </p>
      <p className="mt-1.5 text-zinc-700 dark:text-zinc-300">
        Buyer <span className="font-mono text-xs">{buyerShort}</span>
        <span className="mx-1.5 text-zinc-400">·</span>
        <span className="tabular-nums font-medium">{clearingUsdc} USDC</span>
      </p>
    </div>
  );
}
