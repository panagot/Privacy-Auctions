import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/AppShell";
import { SolanaProviders } from "@/components/SolanaProviders";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Privacy Auctions — MagicBlock Private Payments",
    template: "%s · Privacy Auctions",
  },
  description:
    "Sealed-bid and Dutch-style sales on Solana devnet with MagicBlock Private Payments API: deposit, private SPL transfer, and guided flows for demos.",
  keywords: [
    "Solana",
    "MagicBlock",
    "Private Payments",
    "sealed-bid auction",
    "Dutch auction",
    "devnet",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SolanaProviders>
          <AppShell>{children}</AppShell>
        </SolanaProviders>
      </body>
    </html>
  );
}
