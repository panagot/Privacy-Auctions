"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={
        active
          ? "font-medium text-zinc-900 dark:text-zinc-100"
          : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      }
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/"
              className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              Privacy Auctions
            </Link>
            <nav
              className="flex flex-wrap gap-4 text-sm"
              aria-label="Primary"
            >
              <NavLink href="/sealed-bid">Sealed-bid</NavLink>
              <NavLink href="/dutch">Private Dutch</NavLink>
            </nav>
          </div>
          <div className="wallet-adapter-shell">
            <WalletMultiButton />
          </div>
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 outline-none md:px-6"
      >
        {children}
      </main>
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between md:px-6">
          <p>
            Devnet only. Fund devnet SOL and USDC before rollup deposits.
          </p>
          <a
            href="https://payments.magicblock.app/reference"
            className="text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
            target="_blank"
            rel="noreferrer"
          >
            MagicBlock Payments API reference
          </a>
        </div>
      </footer>
    </div>
  );
}
