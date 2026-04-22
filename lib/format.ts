const USDC_DECIMALS = 6n;

export function parseUsdcToBaseUnits(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Amount required");
  const [whole, frac = ""] = trimmed.split(".");
  if (!/^\d+$/.test(whole) || (frac && !/^\d+$/.test(frac)))
    throw new Error("Invalid amount");
  const fracPadded = (frac + "000000").slice(0, Number(USDC_DECIMALS));
  const base =
    BigInt(whole) * 10n ** USDC_DECIMALS + BigInt(fracPadded || "0");
  if (base <= 0n) throw new Error("Amount must be positive");
  return base;
}

export function formatBaseUnitsAsUsdc(base: bigint): string {
  const neg = base < 0n;
  const v = neg ? -base : base;
  const whole = v / 10n ** USDC_DECIMALS;
  const frac = (v % 10n ** USDC_DECIMALS).toString().padStart(6, "0");
  return `${neg ? "-" : ""}${whole.toString()}.${frac}`;
}
