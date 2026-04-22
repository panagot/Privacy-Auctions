# Privacy Auctions (MagicBlock)

Next.js app with two flows for the **Colosseum Privacy Track**:

- **Sealed-bid** — SHA-256 commitments in the browser, reveal phase, then **private USDC transfer** to the seller via [MagicBlock Private Payments API](https://payments.magicblock.app/reference).
- **Private Dutch** — descending price on a timer; buyer pays the seller with the same **private transfer** path.

Auction state is stored in `localStorage` for the demo (commitments are not on-chain yet). **Deposits and private transfers** call the hosted API at `https://payments.magicblock.app` on **Solana devnet**.

## Prerequisites

- Node 20+
- Phantom (or another supported wallet) on **Devnet**
- Devnet SOL + devnet USDC for your wallet (fund via a faucet / devnet USDC sources)

## Setup

```bash
cd privacy-auctions
npm install --ignore-scripts
```

If `npm install` fails on Windows with a postinstall script error, `--ignore-scripts` avoids optional native setup issues; the app does not rely on those scripts.

Optional env:

```bash
copy .env.example .env.local
```

`NEXT_PUBLIC_MAGICBLOCK_PAYMENTS_URL` overrides the default MagicBlock base URL (see `.env.example`).

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set Phantom to **devnet**.

## Verify auction logic (no wallet)

Runs the same sealed-bid and Dutch **store** code paths the UI uses (with a browser shim):

```bash
npm run verify:flows
```

Use this after changes to `lib/sealed-auction-store.ts` or `lib/dutch-auction-store.ts`.

## Build

```bash
npm run build
npm start
```

Uses `next dev --webpack` / `next build --webpack` so the `buffer` polyfill in `next.config.ts` applies.

## Project layout

| Area | Role |
|------|------|
| `app/` | Routes, layouts, metadata |
| `lib/magicblock/` | Deposit / transfer HTTP clients (30s timeout) |
| `lib/*-auction-store.ts` | Browser `localStorage` state |
| `lib/commitment.ts` | SHA-256 commitments for sealed bids |
| `components/` | Shell, wallet providers, guided demos |

## Hackathon notes

- **Technology:** MagicBlock `POST /v1/spl/deposit`, `POST /v1/spl/transfer` with `privacy: "private"`, devnet USDC mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`.
- **Demo:** Deposit rollup balance → run an auction → settle with private pay (record both in your video).
- **Future:** Anchor program for on-chain commitments + PER delegation as you harden the prototype.
