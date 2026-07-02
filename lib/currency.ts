// Fixed fallback used only if the live exchange rate API is unreachable.
const FALLBACK_USD_TO_SGD = 1.3;

/** Live USD->SGD rate, cached for a few hours. Falls back to a fixed rate. */
export async function usdToSgdRate(): Promise<number> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=SGD", {
      next: { revalidate: 21600 }, // 6h
    });
    if (!res.ok) return FALLBACK_USD_TO_SGD;
    const data = await res.json();
    const rate = data?.rates?.SGD;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_USD_TO_SGD;
  } catch {
    return FALLBACK_USD_TO_SGD;
  }
}

export function usdToSgd(value: number, rate: number): number {
  return Math.round(value * rate * 100) / 100;
}
