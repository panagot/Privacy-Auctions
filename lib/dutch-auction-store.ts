export type DutchPhase = "running" | "sold" | "stopped";

export type DutchSession = {
  id: string;
  title: string;
  seller: string;
  /** USDC base units */
  startPriceBaseUnits: bigint;
  floorPriceBaseUnits: bigint;
  /** Amount subtracted each tick */
  tickAmountBaseUnits: bigint;
  /** Ms between ticks */
  tickMs: number;
  currentPriceBaseUnits: bigint;
  phase: DutchPhase;
  buyer?: string;
  soldPriceBaseUnits?: bigint;
};

const KEY = "privacy-auctions-dutch-v1";

function load(): DutchSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as DutchSession;
    return {
      ...s,
      startPriceBaseUnits: BigInt(String(s.startPriceBaseUnits)),
      floorPriceBaseUnits: BigInt(String(s.floorPriceBaseUnits)),
      tickAmountBaseUnits: BigInt(String(s.tickAmountBaseUnits)),
      currentPriceBaseUnits: BigInt(String(s.currentPriceBaseUnits)),
      soldPriceBaseUnits:
        s.soldPriceBaseUnits !== undefined
          ? BigInt(String(s.soldPriceBaseUnits))
          : undefined,
    };
  } catch {
    return null;
  }
}

function save(session: DutchSession | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(
    KEY,
    JSON.stringify({
      ...session,
      startPriceBaseUnits: session.startPriceBaseUnits.toString(),
      floorPriceBaseUnits: session.floorPriceBaseUnits.toString(),
      tickAmountBaseUnits: session.tickAmountBaseUnits.toString(),
      currentPriceBaseUnits: session.currentPriceBaseUnits.toString(),
      soldPriceBaseUnits:
        session.soldPriceBaseUnits !== undefined
          ? session.soldPriceBaseUnits.toString()
          : undefined,
    }),
  );
}

export function getDutchSession(): DutchSession | null {
  return load();
}

export function createDutchSession(input: {
  title: string;
  seller: string;
  startPriceBaseUnits: bigint;
  floorPriceBaseUnits: bigint;
  tickAmountBaseUnits: bigint;
  tickMs: number;
}): DutchSession {
  const session: DutchSession = {
    id: `dutch-${Date.now()}`,
    title: input.title,
    seller: input.seller,
    startPriceBaseUnits: input.startPriceBaseUnits,
    floorPriceBaseUnits: input.floorPriceBaseUnits,
    tickAmountBaseUnits: input.tickAmountBaseUnits,
    tickMs: input.tickMs,
    currentPriceBaseUnits: input.startPriceBaseUnits,
    phase: "running",
  };
  save(session);
  return session;
}

export function tickDutchPrice(): DutchSession | null {
  const s = load();
  if (!s || s.phase !== "running") return s;
  const next = s.currentPriceBaseUnits - s.tickAmountBaseUnits;
  if (next < s.floorPriceBaseUnits) {
    s.currentPriceBaseUnits = s.floorPriceBaseUnits;
    s.phase = "stopped";
  } else {
    s.currentPriceBaseUnits = next;
  }
  save(s);
  return s;
}

export function markDutchSold(buyer: string) {
  const s = load();
  if (!s || s.phase !== "running") throw new Error("No active sale");
  s.phase = "sold";
  s.buyer = buyer;
  s.soldPriceBaseUnits = s.currentPriceBaseUnits;
  save(s);
}

export function clearDutchSession() {
  save(null);
}
