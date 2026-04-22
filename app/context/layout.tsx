import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Problem & solution",
  description:
    "Why public auctions and transfers leak strategy, and how MagicBlock Private Payments on Ephemeral Rollup balances address the settlement leg.",
};

export default function ContextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
