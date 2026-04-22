import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Dutch sale",
  description:
    "Descending-price Dutch auction with MagicBlock private transfer at the clearing price on devnet.",
};

export default function DutchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
