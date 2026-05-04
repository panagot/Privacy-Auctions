import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { InfoTip } from "@/components/InfoTip";

/** Standard outlined section: title row + optional InfoTip + body. */
export function Section({
  title,
  tip,
  right,
  children,
  className,
}: {
  title: ReactNode;
  tip?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          {tip ? <InfoTip text={tip} /> : null}
        </div>
        {right ? <div className="ms-auto flex items-center gap-2">{right}</div> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
