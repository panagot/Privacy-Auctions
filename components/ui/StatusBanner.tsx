"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { ExplorerTxLink } from "@/components/ui/ExplorerLink";

type StatusKind = "info" | "busy" | "ok" | "warn" | "error";

const SIG_RE = /[1-9A-HJ-NP-Za-km-z]{55,90}/;

function classify(text: string, busy: boolean): StatusKind {
  if (busy) return "busy";
  const t = text.toLowerCase();
  if (t.includes("confirmed") || t.includes("recorded") || t.includes("created")) {
    return "ok";
  }
  if (t.includes("failed") || t.includes("error")) return "error";
  if (
    t.includes("not eligible") ||
    t.includes("unrevealed") ||
    t.includes("forfeit") ||
    t.includes("must wait") ||
    t.includes("connect")
  ) {
    return "warn";
  }
  return "info";
}

const styleMap: Record<StatusKind, { ring: string; bg: string; text: string; Icon: LucideIcon }> = {
  info: {
    ring: "ring-zinc-200 dark:ring-zinc-700",
    bg: "bg-zinc-50/80 dark:bg-zinc-900/60",
    text: "text-zinc-800 dark:text-zinc-100",
    Icon: Info,
  },
  busy: {
    ring: "ring-violet-200 dark:ring-violet-800/60",
    bg: "bg-violet-50/80 dark:bg-violet-950/40",
    text: "text-violet-800 dark:text-violet-100",
    Icon: Loader2,
  },
  ok: {
    ring: "ring-emerald-200 dark:ring-emerald-800/60",
    bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
    text: "text-emerald-900 dark:text-emerald-100",
    Icon: CheckCircle2,
  },
  warn: {
    ring: "ring-amber-200 dark:ring-amber-800/60",
    bg: "bg-amber-50/80 dark:bg-amber-950/40",
    text: "text-amber-900 dark:text-amber-100",
    Icon: AlertTriangle,
  },
  error: {
    ring: "ring-rose-200 dark:ring-rose-800/60",
    bg: "bg-rose-50/80 dark:bg-rose-950/40",
    text: "text-rose-900 dark:text-rose-100",
    Icon: AlertTriangle,
  },
};

/**
 * Coloured status banner that auto-detects severity from the message and
 * highlights any Solana signature with a Solana Explorer (devnet) link.
 */
export function StatusBanner({
  status,
  busy = false,
  className,
}: {
  status: string;
  busy?: boolean;
  className?: string;
}) {
  const kind = classify(status, busy);
  const { ring, bg, text, Icon } = styleMap[kind];
  const sigMatch = status.match(SIG_RE);
  const signature = sigMatch?.[0];
  const head = signature ? status.replace(signature, "").trim() : status;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl px-4 py-3 text-sm leading-relaxed shadow-sm ring-1",
        ring,
        bg,
        text,
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          size={18}
          strokeWidth={2}
          className={cn("mt-0.5 shrink-0", busy ? "animate-spin" : "")}
          aria-hidden
        />
        <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">
          {head}
          {signature ? (
            <span className="ms-2 inline-block align-middle">
              <ExplorerTxLink signature={signature} prefix="View" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
