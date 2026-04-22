# Privacy Auctions

**Private settlement for Solana auctions using [MagicBlock](https://magicblock.app/) Private Payments.**  
A devnet web app for the **Colosseum Privacy Track** — two auction mechanics, one real integration: **deposit to rollup** and **pay the seller** through MagicBlock’s hosted API with `privacy: "private"` so settlement does not look like a normal public SPL transfer on the base layer.

---

## What this is about

**Problem.** Open auctions and plain on-chain token transfers expose a lot: max bids, timing, and payment graphs. For many real use cases (procurement, liquidations, OTC-style sales) you want **price discovery** or **fair rules** *without* broadcasting every strategic detail or who paid whom on a public ledger graph.

**What we built.** A **Next.js** demo that pairs **auction logic in the app** (commit–reveal for sealed bids; timed ticks for a Dutch sale) with **MagicBlock [Private Payments API](https://payments.magicblock.app/reference)** for the *money* leg: you fund a rollup balance on devnet, then the winner or buyer **settles to the seller via a private SPL path** the API builds — the same integration surface you would show in a live hackathon video.

**What this is not (yet).** Bids are not fully enforced on-chain in this repo: commitments and session state live in the **browser** (`localStorage`) so the story stays easy to follow. The **MagicBlock** part is the **real** integration: `POST /v1/spl/deposit` and `POST /v1/spl/transfer` with `privacy: "private"` on **Solana devnet**.

**Who should use this repo.** Hackathon judges, integrators who want a **working UI + clear flow** for Private Payments, or teams turning this into **programs (e.g. Anchor) + on-chain commitments** next.

---

## Modes

| Mode | Idea | Settlement |
|------|------|------------|
| **Sealed-bid** | Bidders only post **SHA-256 commitments** during the window; after close they **reveal**; highest valid bid wins. | Winner pays the seller with a **private transfer** built by MagicBlock. |
| **Private Dutch** | **Price steps down** on a timer; first buyer to take the lot pays the **current price** to the seller. | Same **private transfer** path as sealed-bid. |

Each route includes a **read-only guided sequence** (no wallet) to explain API steps for recordings.

---

## Stack

- **Framework:** Next.js (App Router), TypeScript, Tailwind CSS  
- **Chain:** Solana **devnet** (Phantom or compatible wallet)  
- **Integration:** MagicBlock `payments.magicblock.app` — deposit, private transfer; optional env override via `NEXT_PUBLIC_MAGICBLOCK_PAYMENTS_URL` (see `.env.example`)  
- **USDC (devnet):** mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` (see `lib/constants.ts`)

---

## Quick start

**Prerequisites:** Node 20+, a Solana wallet on **devnet**, **devnet SOL** and **devnet USDC** (faucet / test sources) before using rollup deposit.

```bash
git clone https://github.com/panagot/Privacy-Auctions.git
cd Privacy-Auctions
npm install --ignore-scripts
```

> On Windows, if `npm install` fails on a postinstall script, `--ignore-scripts` is safe for this app.

Optional: copy `.env.example` to `.env.local` and set variables as needed.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and set your wallet to **devnet**.  
Scripts use `next dev --webpack` / `next build --webpack` for the `buffer` polyfill (`next.config.ts`).

**Production build:**

```bash
npm run build
npm start
```

**Check auction state logic (no browser wallet):** runs the same `localStorage` stores in Node with a small shim.

```bash
npm run verify:flows
```

---

## Project layout

| Path | Role |
|------|------|
| `app/` | Pages, layouts, metadata |
| `lib/magicblock/` | HTTP client for deposit / transfer (timeouts, error handling) |
| `lib/sealed-auction-store.ts`, `lib/dutch-auction-store.ts` | Demo auction state in the browser |
| `lib/commitment.ts` | SHA-256 sealed-bid commitments |
| `lib/solana/` | Sign and send base64 transactions from the wallet |
| `components/` | App shell, wallet providers, guided walkthroughs |

---

## Resources

- [MagicBlock Payments API reference](https://payments.magicblock.app/reference)  
- [Privacy Auctions (this repo on GitHub)](https://github.com/panagot/Privacy-Auctions)

---
