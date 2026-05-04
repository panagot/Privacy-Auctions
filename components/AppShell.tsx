"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Lock, ExternalLink } from "lucide-react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "font-medium text-zinc-900 dark:text-zinc-100"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-2 -bottom-0.5 h-px rounded-full transition-opacity",
          active
            ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-500 opacity-100"
            : "opacity-0",
        )}
      />
    </Link>
  );
}

function BrandMark() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2"
      aria-label="Privacy Auctions home"
    >
      <span
        aria-hidden
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 via-fuchsia-500 to-emerald-500 text-white shadow-sm ring-1 ring-inset ring-white/20"
      >
        <Lock size={16} strokeWidth={2.5} />
        <span className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Privacy Auctions
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Solana · MagicBlock
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.10),transparent_70%),radial-gradient(40%_40%_at_85%_10%,rgba(16,185,129,0.08),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(139,92,246,0.18),transparent_70%),radial-gradient(40%_40%_at_85%_10%,rgba(16,185,129,0.14),transparent_70%)]"
      />

      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/75">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-5">
            <BrandMark />
            <Badge tone="violet" className="hidden sm:inline-flex">
              Devnet
            </Badge>
            <nav
              className="ms-1 flex flex-wrap items-center gap-1 text-sm"
              aria-label="Auction modes"
            >
              <NavLink href="/sealed-bid">Sealed-bid</NavLink>
              <NavLink href="/dutch">Private Dutch</NavLink>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <nav className="text-sm" aria-label="Context">
              <NavLink href="/context">Context</NavLink>
            </nav>
            <div className="wallet-adapter-shell">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-10 outline-none md:px-6"
      >
        {children}
      </main>

      <footer className="relative border-t border-zinc-200 bg-white/60 py-8 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="emerald">Devnet only</Badge>
            <span className="hidden sm:inline">
              Fund devnet SOL and USDC before rollup deposits.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://payments.magicblock.app/reference"
              className="inline-flex items-center gap-1 text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              target="_blank"
              rel="noreferrer"
            >
              MagicBlock Payments API
              <ExternalLink size={12} strokeWidth={2} />
            </a>
            <a
              href="https://github.com/panagot/Privacy-Auctions"
              className="inline-flex items-center gap-1 text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
              <ExternalLink size={12} strokeWidth={2} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
