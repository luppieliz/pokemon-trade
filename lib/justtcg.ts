import type { CardInfo, CardPrice, GameId, GameOption, SetOption } from "./types";
import { usdToSgd, usdToSgdRate } from "./currency";

const BASE = "https://api.justtcg.com/v1";

export const GAMES: GameOption[] = [
  { id: "pokemon", label: "English" },
  { id: "pokemon-japan", label: "Japanese" },
];

function headers(): HeadersInit {
  return { "x-api-key": process.env.JUSTTCG_API_KEY ?? "" };
}

function tcgImage(tcgplayerId?: string): string {
  return tcgplayerId
    ? `https://product-images.tcgplayer.com/fit-in/437x437/${tcgplayerId}.jpg`
    : "";
}

/** Remove the trailing " - 038/095" that JustTCG appends to card names. */
function cleanName(name: string): string {
  return String(name || "").replace(/\s*-\s*[\w./-]+\s*$/, "").trim() || String(name || "");
}

/** Leading collector number as an int, so "038/095", "38/95" and "38" all match. */
function numKey(n: string | undefined): string {
  if (!n) return "";
  const head = String(n).split("/")[0].trim();
  return /^\d+$/.test(head) ? String(parseInt(head, 10)) : head.toLowerCase();
}

const PRINTING_RANK = (p?: string) => {
  const s = (p || "").toLowerCase();
  if (s.includes("holo") && !s.includes("reverse")) return 0;
  if (s.includes("normal")) return 1;
  if (s.includes("reverse")) return 2;
  return 3;
};

/** Choose the best price variant for a requested condition. */
function selectPrice(variants: any[], condition?: string): CardPrice {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { value: null, currency: "USD", source: "justtcg" };
  }
  const wanted = [condition, "Near Mint", "Lightly Played", "Moderately Played"].filter(
    Boolean
  ) as string[];

  let pool: any[] = [];
  for (const c of wanted) {
    pool = variants.filter((v) => v.condition === c && v.price != null);
    if (pool.length) break;
  }
  if (!pool.length) pool = variants.filter((v) => v.price != null);
  if (!pool.length) return { value: null, currency: "USD", source: "justtcg" };

  pool.sort((a, b) => PRINTING_RANK(a.printing) - PRINTING_RANK(b.printing));
  const v = pool[0];
  return {
    value: v.price ?? null,
    currency: "USD",
    source: "justtcg",
    printing: v.printing,
    condition: v.condition,
  };
}

async function toCardInfo(card: any, condition?: string): Promise<CardInfo> {
  const usd = selectPrice(card.variants, condition);
  const price: CardPrice =
    usd.value == null
      ? { ...usd, currency: "SGD" }
      : { ...usd, value: usdToSgd(usd.value, await usdToSgdRate()), currency: "SGD" };
  return {
    id: card.id,
    name: cleanName(card.name),
    number: card.number ?? "",
    printedNumber: card.number ?? "",
    game: (card.game === "Pokemon Japan" ? "pokemon-japan" : "pokemon") as GameId,
    setId: card.set,
    setName: card.set_name ?? card.set,
    rarity: card.rarity,
    tcgplayerId: card.tcgplayerId,
    image: tcgImage(card.tcgplayerId),
    price,
  };
}

/** List the sets for a game, for the set picker. Cached hard (rarely changes). */
export async function getSets(game: GameId): Promise<SetOption[]> {
  const res = await fetch(`${BASE}/sets?game=${encodeURIComponent(game)}`, {
    headers: headers(),
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = (await res.json())?.data ?? [];
  return data
    .map((s: any) => ({ id: s.id, name: s.name, game }))
    .sort((a: SetOption, b: SetOption) => a.name.localeCompare(b.name));
}

/**
 * Look up a card within a set by name (the `q` filter) and pick the row whose
 * collector number matches. Set + q is the only combination JustTCG filters
 * reliably, so both a set and a card name are required.
 */
export async function lookupCard(opts: {
  setId: string;
  name: string;
  number?: string;
  condition?: string;
}): Promise<CardInfo | null> {
  const { setId, name, number, condition } = opts;
  if (!setId || !name.trim()) return null;

  const url = `${BASE}/cards?set=${encodeURIComponent(setId)}&q=${encodeURIComponent(
    name.trim()
  )}&limit=20`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 1800 } });
  if (!res.ok) return null;

  const data: any[] = (await res.json())?.data ?? [];
  const real = data.filter((c) => c.number && c.number !== "N/A");
  if (real.length === 0) return null;

  if (number && numKey(number)) {
    const match = real.find((c) => numKey(c.number) === numKey(number));
    if (match) return await toCardInfo(match, condition);
    return null; // a number was given but nothing matched — don't guess
  }
  // No number given: if the name pinned a single card, use it.
  return real.length === 1 ? await toCardInfo(real[0], condition) : null;
}

/** Refresh a single card (live price) by its JustTCG id. */
export async function getCardById(
  cardId: string,
  condition?: string
): Promise<CardInfo | null> {
  const res = await fetch(`${BASE}/cards?cardId=${encodeURIComponent(cardId)}`, {
    headers: headers(),
    next: { revalidate: 1800 },
  });
  if (!res.ok) return null;
  const data = (await res.json())?.data;
  const card = Array.isArray(data) ? data[0] : data;
  return card ? await toCardInfo(card, condition) : null;
}
