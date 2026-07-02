// Buy-price markup over live market value.
// Configure with the BUY_MARKUP env var:
//   BUY_MARKUP=10    -> flat +S$10 on every card
//   BUY_MARKUP=15%   -> +15% of the market price
// Defaults to +S$10 if unset.

export interface Markup {
  type: "flat" | "percent";
  amount: number;
}

/** Parse a BUY_MARKUP string ("10" or "15%") into a Markup. Pure — safe on the client. */
export function parseMarkup(raw?: string): Markup {
  const s = (raw ?? "10").trim();
  if (s.endsWith("%")) {
    const n = parseFloat(s.slice(0, -1));
    return { type: "percent", amount: Number.isFinite(n) && n >= 0 ? n : 0 };
  }
  const n = parseFloat(s);
  return { type: "flat", amount: Number.isFinite(n) && n >= 0 ? n : 0 };
}

/** Apply a markup to a market value, rounded to cents. */
export function applyMarkup(value: number, m: Markup): number {
  const extra = m.type === "percent" ? value * (m.amount / 100) : m.amount;
  return Math.round((value + extra) * 100) / 100;
}

/** Human-readable label, e.g. "+S$10.00" or "+15%". */
export function markupLabel(m: Markup): string {
  return m.type === "percent" ? `+${m.amount}%` : `+S$${m.amount.toFixed(2)}`;
}

/** Server-side: read the configured markup from the environment. */
export function getMarkup(): Markup {
  return parseMarkup(process.env.BUY_MARKUP);
}
