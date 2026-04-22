/**
 * Exercises sealed-bid and Dutch auction store logic (same modules as the UI).
 * Run: npm run verify:flows
 *
 * Mocks browser localStorage + window so Node can load the stores.
 */

import assert from "node:assert/strict";

import {
  clearSealedAuctions,
  createSealedAuction,
  finalizeWinner,
  listSealedAuctions,
  openRevealPhase,
  placeSealedCommitment,
  revealBid,
} from "@/lib/sealed-auction-store";
import {
  clearDutchSession,
  createDutchSession,
  getDutchSession,
  markDutchSold,
  tickDutchPrice,
} from "@/lib/dutch-auction-store";
import { parseUsdcToBaseUnits } from "@/lib/format";

const SEALED_KEY = "privacy-auctions-sealed-v1";

function installBrowserShim() {
  const memory: Record<string, string> = {};
  const ls: Storage = {
    get length() {
      return Object.keys(memory).length;
    },
    clear() {
      for (const k of Object.keys(memory)) delete memory[k];
    },
    getItem(key: string) {
      return memory[key] ?? null;
    },
    key(index: number) {
      return Object.keys(memory)[index] ?? null;
    },
    removeItem(key: string) {
      delete memory[key];
    },
    setItem(key: string, value: string) {
      memory[key] = value;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: ls });
  Object.defineProperty(globalThis, "window", { value: globalThis });
}

function forceSealedBiddingEnded() {
  const raw = globalThis.localStorage.getItem(SEALED_KEY);
  if (!raw) throw new Error("expected sealed auctions in storage");
  const data = JSON.parse(raw) as { endTimeMs: number }[];
  if (!data[0]) throw new Error("expected at least one auction");
  data[0].endTimeMs = Date.now() - 120_000;
  globalThis.localStorage.setItem(SEALED_KEY, JSON.stringify(data));
}

async function verifySealedBidFlow() {
  console.log("\n— Sealed-bid store —");
  clearSealedAuctions();

  const seller = "Seller111111111111111111111111111111111111111";
  const bidderLow = "BidderLow2222222222222222222222222222222222222222";
  const bidderHigh = "BidderHi3333333333333333333333333333333333333333";

  const auction = createSealedAuction({
    title: "verify-flow",
    seller,
    durationMinutes: 60,
  });

  const lowAmt = parseUsdcToBaseUnits("1.00");
  const highAmt = parseUsdcToBaseUnits("2.50");

  const bidLow = await placeSealedCommitment({
    auctionId: auction.id,
    bidder: bidderLow,
    amountBaseUnits: lowAmt,
  });
  const bidHigh = await placeSealedCommitment({
    auctionId: auction.id,
    bidder: bidderHigh,
    amountBaseUnits: highAmt,
  });

  forceSealedBiddingEnded();
  openRevealPhase(auction.id);

  await assert.rejects(
    () =>
      revealBid({
        auctionId: auction.id,
        bidder: bidderLow,
        commitmentHex: bidLow.commitmentHex,
        amountBaseUnits: parseUsdcToBaseUnits("9.99"),
      }),
    /Reveal does not match commitment/,
  );

  await revealBid({
    auctionId: auction.id,
    bidder: bidderLow,
    commitmentHex: bidLow.commitmentHex,
    amountBaseUnits: lowAmt,
  });
  await revealBid({
    auctionId: auction.id,
    bidder: bidderHigh,
    commitmentHex: bidHigh.commitmentHex,
    amountBaseUnits: highAmt,
  });

  finalizeWinner(auction.id);

  const [updated] = listSealedAuctions();
  assert.equal(updated.id, auction.id);
  assert.equal(updated.phase, "settled");
  assert.equal(updated.winner, bidderHigh);
  assert.equal(updated.winningAmountBaseUnits, highAmt);

  console.log("  OK: commitments → reveal → finalize → highest bid wins");
}

function verifyDutchFlow() {
  console.log("\n— Dutch auction store —");
  clearDutchSession();

  const seller = "Seller4444444444444444444444444444444444444444";
  const buyer = "Buyer555555555555555555555555555555555555555555";

  createDutchSession({
    title: "verify-dutch",
    seller,
    startPriceBaseUnits: parseUsdcToBaseUnits("10.00"),
    floorPriceBaseUnits: parseUsdcToBaseUnits("2.00"),
    tickAmountBaseUnits: parseUsdcToBaseUnits("1.00"),
    tickMs: 5_000,
  });

  let s = getDutchSession();
  assert.ok(s);
  assert.equal(s.phase, "running");
  assert.equal(s.currentPriceBaseUnits, parseUsdcToBaseUnits("10.00"));

  tickDutchPrice();
  s = getDutchSession();
  assert.ok(s);
  assert.equal(s.phase, "running");
  assert.equal(s.currentPriceBaseUnits, parseUsdcToBaseUnits("9.00"));

  markDutchSold(buyer);
  s = getDutchSession();
  assert.ok(s);
  assert.equal(s.phase, "sold");
  assert.equal(s.buyer, buyer);
  assert.equal(s.soldPriceBaseUnits, parseUsdcToBaseUnits("9.00"));

  console.log("  OK: ticks lower price → sold records buyer and clearing price");
}

async function main() {
  installBrowserShim();
  await verifySealedBidFlow();
  verifyDutchFlow();
  console.log("\nAll flow checks passed.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
