import type { Currency, CardPrice } from "./types";

const SYMBOLS: Record<Currency, string> = { SGD: "S$", USD: "$", EUR: "€" };

export function formatMoney(value: number | null, currency: Currency = "SGD"): string {
  if (value == null) return "—";
  return `${SYMBOLS[currency]}${value.toFixed(2)}`;
}

export function formatPrice(price: CardPrice | undefined): string {
  if (!price || price.value == null) return "No market price";
  return formatMoney(price.value, price.currency);
}

/** Compare offered value vs target value and describe the fairness. */
export function fairness(offered: number, target: number) {
  if (target <= 0) return { label: "—", tone: "neutral" as const, ratio: 0 };
  const ratio = offered / target;
  const diffPct = Math.round((ratio - 1) * 100);
  if (ratio >= 0.9 && ratio <= 1.15) {
    return { label: "Fair trade", tone: "good" as const, ratio, diffPct };
  }
  if (ratio < 0.9) {
    return { label: `Under by ${Math.abs(diffPct)}%`, tone: "low" as const, ratio, diffPct };
  }
  return { label: `Over by ${diffPct}%`, tone: "high" as const, ratio, diffPct };
}
