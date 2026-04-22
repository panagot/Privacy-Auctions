import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sealed-bid auction",
  description:
    "Commit–reveal sealed bids with MagicBlock private USDC transfer to the seller on Solana devnet.",
};

export default function SealedBidLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
