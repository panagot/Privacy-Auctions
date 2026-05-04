# Privacy Auctions

**Private settlement for Solana auctions, powered by [MagicBlock](https://magicblock.app/) Private Payments.**
A devnet web app for the **Colosseum Privacy Track**: two auction mechanics share one real integration — fund an **ephemeral rollup** USDC balance, then pay the seller with a **private SPL transfer** the API builds (`visibility: "private"`, ephemeral balances), so the settlement leg does not look like a public &ldquo;who paid whom&rdquo; SPL hop.

- **Live deployment:** [privacy-auctions.vercel.app](https://privacy-auctions.vercel.app/)
- **GitHub:** [github.com/panagot/Privacy-Auctions](https://github.com/panagot/Privacy-Auctions)
- **Demo (Loom):** [Loom recording](https://www.loom.com/share/6afc73f5c58e4892bd63156e096f5744)

---

## What this is about

**Problem.** Open auctions and plain SPL transfers leak strategy: who bid, how much, when, and after a clear, the public graph often makes &ldquo;who paid whom&rdquo; obvious. For procurement, liquidations, OTC-style sales, you want price discovery in your product but the **money leg** kept off the public path graph.

**What we built.** A polished **Next.js** demo that pairs **auction logic in the app** with **MagicBlock&apos;s [Private Payments API](https://payments.magicblock.app/reference)** for the actual money movement. Auction sessions and commitments live in the browser for fast resets while recording; the **deposit + private transfer** flow is the real integration on Solana **devnet**.

**What ships in this repo:**

- A **dedicated `/context` page** explaining the problem, the solution, and how the Ephemeral Rollups + Private Payments API model fits.
- Two end-to-end auction routes — **/sealed-bid** (commit-reveal) and **/dutch** (descending price) — with phase chips, stats, and live tickers.
- **Solana Explorer (devnet) links** for every confirmed transaction signature so anyone can verify the on-chain settlement.
- A **&ldquo;Recent confirmed signatures&rdquo;** receipts panel persisted in the browser, perfect for screen recordings.
- Robust signing path with **just-in-time blockhash refresh** and **&ldquo;already processed&rdquo;** recovery (`lib/solana/send-transaction.ts`).

---

## Modes

| Mode | Idea | Settlement |
|------|------|------------|
| **Sealed-bid** | Bidders publish **SHA-256 commitments** during the window. After close (or seller ends early) everyone reveals; the highest valid bid wins. Forfeit on no-reveal. | Winner pays the seller through MagicBlock with a **private** SPL transfer at the clearing amount. |
| **Private Dutch** | Price ticks **down** from a configured start to a floor on a timer. First buyer to take the lot pays the live tick price. | Same **private** transfer path as sealed-bid. |

Each route has a **read-only guided sequence** (no wallet) walking through the actual API calls and request bodies — handy for recordings and screenshots.

---

## Stack

- **Framework:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI:** lucide-react icons, framer-motion, custom primitives (Badge, Stat, PhaseChip, ExplorerLink, StatusBanner, Receipts)
- **Chain:** Solana **devnet** with the wallet adapter (Phantom)
- **Integration:** `payments.magicblock.app` for deposit and private transfer; override with `NEXT_PUBLIC_MAGICBLOCK_PAYMENTS_URL`
- **USDC (devnet):** mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (see `lib/constants.ts`)

---

## Quick start

**Prerequisites:** Node 20+, a Solana wallet on **devnet**, devnet SOL and devnet USDC before doing rollup deposits.

```bash
git clone https://github.com/panagot/Privacy-Auctions.git
cd Privacy-Auctions
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and switch your wallet to **devnet**.
Scripts use `next dev --webpack` / `next build --webpack` for the `buffer` polyfill (`next.config.ts`).

**Production build:**

```bash
npm run build
npm start
```

**Headless flow check (no browser wallet):**

```bash
npm run verify:flows
```

---

## Manual demo flows

### Sealed-bid (two bidders, same browser)

Auction state is **per-browser** (`localStorage`); bidders are distinguished by their connected wallet address.

1. **Fund devnet USDC** in the wallets you will use for **Deposit**. The default in-app deposit is **0.1 USDC**; an `insufficient funds` log means top up that wallet&apos;s SPL USDC, not only its SOL.
2. **Wallet A (seller):** create an auction (e.g. a 5-minute window).
3. **Wallet A:** place a first sealed commitment, e.g. `1.00` USDC.
4. **Switch to Wallet B,** keep the same auction selected, place a different amount (e.g. `2.00` USDC) and Seal bid. The table now shows two rows.
5. **End bidding & open reveal** — the seller can do this before the scheduled end, otherwise wait for the timer.
6. Each bidder wallet connects in turn and runs **Reveal** for *their* rows (unrevealed = forfeit).
7. **Finalize winner**, then the winning wallet runs **Pay seller (private MagicBlock transfer)**. The signature appears in the status banner and in **Recent confirmed signatures** with a Solana Explorer link.

### Private Dutch (two wallets)

1. **Fund devnet USDC** in the buyer wallet (at least the deposit amount plus the tick price you intend to take).
2. **Wallet A (seller):** on `/dutch`, configure start / floor / tick, then **Start / replace session**. The price ticks down on schedule.
3. **Switch to Wallet B (buyer):** **Deposit** to the rollup, then **Buy now (private pay seller)** at the tick you like. The signature is shown with an Explorer link.

If something fails, the status banner colour-codes the issue and any signature in it is also a one-click Explorer link.

---

## Project layout

| Path | Role |
|------|------|
| `app/` | Pages, layouts, metadata (`/`, `/sealed-bid`, `/dutch`, `/context`) |
| `app/page.tsx` | Hero, How-it-works, mode cards, trust signals |
| `app/context/page.tsx` | Problem, solution, MagicBlock value proposition |
| `lib/magicblock/` | Payments API client (deposit / transfer, timeouts, error handling) |
| `lib/sealed-auction-store.ts`, `lib/dutch-auction-store.ts` | In-browser auction state |
| `lib/commitment.ts` | SHA-256 commitments for sealed bids |
| `lib/solana/send-transaction.ts` | Sign + send with blockhash refresh and &ldquo;already processed&rdquo; recovery |
| `lib/tx-error.ts` | User-facing formatting for `sendTransaction` / RPC errors with hints |
| `lib/explorer.ts`, `lib/cn.ts` | Helpers (Solana Explorer URLs, `cn()` for Tailwind) |
| `components/AppShell.tsx` | Sticky header, brand mark, footer, devnet badge |
| `components/ui/` | Reusable UI primitives (Badge, Stat, PhaseChip, ExplorerLink, Section, StatusBanner, Receipts) |
| `components/SealedBidSimulation.tsx`, `components/DutchSimulation.tsx` | Read-only guided walkthroughs |
| `scripts/verify-flows.ts` | Invoked by `npm run verify:flows` |

---

## Resources

- [MagicBlock Payments API reference](https://payments.magicblock.app/reference)
- [MagicBlock](https://magicblock.app/)
- [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet)
- [Privacy Auctions on GitHub](https://github.com/panagot/Privacy-Auctions)

---
