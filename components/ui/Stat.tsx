import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Numeric/label pair used for clearing price, time-left, deposit, etc. */
export function Stat({
  label,
  value,
  hint,
  className,
  emphasis = "default",
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
  emphasis?: "default" | "emerald" | "violet";
}) {
  const emphasisCls =
    emphasis === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : emphasis === "violet"
        ? "text-violet-700 dark:text-violet-300"
        : "text-zinc-900 dark:text-zinc-50";
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums tracking-tight",
          emphasisCls,
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}
