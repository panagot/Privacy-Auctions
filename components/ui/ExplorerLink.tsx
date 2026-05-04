import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/cn";
import { explorerAddressUrl, explorerTxUrl, shortSig } from "@/lib/explorer";

/** Renders a short transaction signature linking to Solana Explorer (devnet). */
export function ExplorerTxLink({
  signature,
  className,
  cluster = "devnet",
  prefix,
}: {
  signature: string;
  className?: string;
  cluster?: string;
  prefix?: string;
}) {
  return (
    <a
      href={explorerTxUrl(signature, cluster)}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
        className,
      )}
      aria-label={`Open transaction ${signature} on Solana Explorer (${cluster})`}
    >
      {prefix ? <span className="not-italic font-sans text-[11px] text-zinc-500 dark:text-zinc-400">{prefix}</span> : null}
      <span>{shortSig(signature)}</span>
      <ExternalLink size={12} strokeWidth={2} className="text-zinc-400" />
    </a>
  );
}

export function ExplorerAddressLink({
  address,
  className,
  cluster = "devnet",
  prefix,
}: {
  address: string;
  className?: string;
  cluster?: string;
  prefix?: string;
}) {
  return (
    <a
      href={explorerAddressUrl(address, cluster)}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 font-mono text-xs text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
        className,
      )}
      aria-label={`Open address ${address} on Solana Explorer (${cluster})`}
    >
      {prefix ? <span className="not-italic font-sans text-[11px] text-zinc-500 dark:text-zinc-400">{prefix}</span> : null}
      <span>{shortSig(address)}</span>
      <ExternalLink size={12} strokeWidth={2} className="text-zinc-400" />
    </a>
  );
}
