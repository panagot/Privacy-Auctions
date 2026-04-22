import { sealedBidCommitment } from "@/lib/commitment";

export type SealedPhase = "bidding" | "revealing" | "settled";

export type SealedBid = {
  bidder: string;
  commitmentHex: string;
  /** Stored only in browser for demo; production would use encrypted storage or on-chain commit. */
  salt?: string;
  amountBaseUnits?: bigint;
};

export type SealedAuction = {
  id: string;
  title: string;
  seller: string;
  /** Unix ms when bidding closes */
  endTimeMs: number;
  phase: SealedPhase;
  bids: SealedBid[];
  winner?: string;
  winningAmountBaseUnits?: bigint;
};

const KEY = "privacy-auctions-sealed-v1";

function load(): SealedAuction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((a) => ({
      ...(a as SealedAuction),
      bids: ((a as SealedAuction).bids ?? []).map((b) => ({
        ...b,
        amountBaseUnits:
          b.amountBaseUnits !== undefined
            ? BigInt(String(b.amountBaseUnits))
            : undefined,
      })),
      winningAmountBaseUnits:
        (a as SealedAuction).winningAmountBaseUnits !== undefined
          ? BigInt(String((a as SealedAuction).winningAmountBaseUnits))
          : undefined,
    }));
  } catch {
    return [];
  }
}

function save(auctions: SealedAuction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    KEY,
    JSON.stringify(
      auctions.map((a) => ({
        ...a,
        bids: a.bids.map((b) => ({
          ...b,
          amountBaseUnits:
            b.amountBaseUnits !== undefined
              ? b.amountBaseUnits.toString()
              : undefined,
        })),
        winningAmountBaseUnits:
          a.winningAmountBaseUnits !== undefined
            ? a.winningAmountBaseUnits.toString()
            : undefined,
      })),
    ),
  );
}

export function listSealedAuctions(): SealedAuction[] {
  return load();
}

export function createSealedAuction(input: {
  title: string;
  seller: string;
  /** Minutes from now */
  durationMinutes: number;
}): SealedAuction {
  const auctions = load();
  const id = `sea-${Date.now()}`;
  const endTimeMs = Date.now() + input.durationMinutes * 60_000;
  const next: SealedAuction = {
    id,
    title: input.title,
    seller: input.seller,
    endTimeMs,
    phase: "bidding",
    bids: [],
  };
  auctions.unshift(next);
  save(auctions);
  return next;
}

export async function placeSealedCommitment(input: {
  auctionId: string;
  bidder: string;
  amountBaseUnits: bigint;
}): Promise<SealedBid> {
  const auctions = load();
  const idx = auctions.findIndex((a) => a.id === input.auctionId);
  if (idx === -1) throw new Error("Auction not found");
  const auction = auctions[idx];
  if (auction.phase !== "bidding") throw new Error("Not accepting bids");
  if (Date.now() > auction.endTimeMs) throw new Error("Bidding ended");

  const salt = crypto.randomUUID().replace(/-/g, "");
  const commitmentHex = await sealedBidCommitment(
    auction.id,
    input.bidder,
    input.amountBaseUnits,
    salt,
  );

  const bid: SealedBid = {
    bidder: input.bidder,
    commitmentHex,
    salt,
  };

  auction.bids.push(bid);
  save(auctions);
  return bid;
}

/** Move to reveal phase after bidding window (manual or timer in UI). */
export function openRevealPhase(auctionId: string) {
  const auctions = load();
  const auction = auctions.find((a) => a.id === auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.phase !== "bidding") throw new Error("Invalid phase");
  if (Date.now() < auction.endTimeMs) throw new Error("Bidding still open");
  auction.phase = "revealing";
  save(auctions);
}

export async function revealBid(input: {
  auctionId: string;
  bidder: string;
  commitmentHex: string;
  amountBaseUnits: bigint;
}): Promise<void> {
  const auctions = load();
  const auction = auctions.find((a) => a.id === input.auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.phase !== "revealing") throw new Error("Not in reveal phase");
  const bid = auction.bids.find(
    (b) =>
      b.bidder === input.bidder && b.commitmentHex === input.commitmentHex,
  );
  if (!bid || !bid.salt) throw new Error("Bid not found");

  const expected = await sealedBidCommitment(
    auction.id,
    input.bidder,
    input.amountBaseUnits,
    bid.salt,
  );
  if (expected !== bid.commitmentHex) throw new Error("Reveal does not match commitment");

  bid.amountBaseUnits = input.amountBaseUnits;
  save(auctions);
}

export function finalizeWinner(auctionId: string) {
  const auctions = load();
  const auction = auctions.find((a) => a.id === auctionId);
  if (!auction) throw new Error("Auction not found");
  if (auction.phase !== "revealing") throw new Error("Not in reveal phase");

  const valid = auction.bids.filter((b) => b.amountBaseUnits !== undefined);
  if (valid.length === 0) {
    auction.phase = "settled";
    save(auctions);
    return;
  }

  let best = valid[0];
  for (const b of valid) {
    if (b.amountBaseUnits! > best.amountBaseUnits!) best = b;
  }

  auction.winner = best.bidder;
  auction.winningAmountBaseUnits = best.amountBaseUnits;
  auction.phase = "settled";
  save(auctions);
}

export function clearSealedAuctions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
