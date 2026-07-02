export type Currency = "USD" | "EUR" | "SGD";

export type GameId = "pokemon" | "pokemon-japan";

export interface GameOption {
  id: GameId;
  label: string; // "English" / "Japanese"
}

export interface SetOption {
  id: string; // JustTCG set id, e.g. "sm9-tag-bolt-pokemon-japan"
  name: string; // "SM9: Tag Bolt"
  game: GameId;
}

export interface CardPrice {
  value: number | null;
  currency: Currency; // SGD (converted from JustTCG's USD/TCGplayer market price)
  source: "justtcg" | null;
  printing?: string; // e.g. "Holofoil - Japanese"
  condition?: string; // e.g. "Near Mint"
}

/** A card resolved from JustTCG. */
export interface CardInfo {
  id: string; // JustTCG card id (stable)
  name: string; // cleaned, without the trailing " - 038/095"
  number: string; // "038/095"
  printedNumber: string; // same as number, kept for UI compatibility
  game: GameId;
  setId: string;
  setName: string;
  rarity?: string;
  tcgplayerId?: string;
  image: string; // TCGplayer product image
  price: CardPrice;
}

/** One of YOUR cards listed for trade. */
export interface Listing extends CardInfo {
  listingId: string;
  condition: string; // e.g. "Near Mint"
  notes?: string;
  listedAt: string; // ISO date
}

/** A card referenced inside an enquiry (buy target or offered card). */
export interface EnquiryCard {
  name: string;
  printedNumber: string;
  setName: string;
  condition: string;
  quantity?: number;
  price?: CardPrice;
}

/** A buy request or trade offer sent by a visitor. */
export interface Enquiry {
  id: string;
  receivedAt: string; // ISO date
  type: "buy" | "trade";
  delivered: boolean; // whether it reached Telegram
  contact: { name: string; telegram: string };
  message?: string;
  // buy
  card?: EnquiryCard;
  buyValue?: number;
  // trade
  target?: EnquiryCard;
  offered?: EnquiryCard[];
  offeredTotal?: number;
  targetValue?: number;
  fairness?: string;
}
