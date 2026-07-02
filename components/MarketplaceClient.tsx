"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import { formatPrice, formatMoney } from "@/lib/format";
import { applyMarkup, markupLabel, type Markup } from "@/lib/config";
import TradeModal from "./TradeModal";
import BuyModal from "./BuyModal";

export default function MarketplaceClient({
  listings,
  markup,
}: {
  listings: Listing[];
  markup: Markup;
}) {
  const [tradeTarget, setTradeTarget] = useState<Listing | null>(null);
  const [buyTarget, setBuyTarget] = useState<Listing | null>(null);
  const [query, setQuery] = useState("");

  const filtered = listings.filter((l) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.setName.toLowerCase().includes(q) ||
      l.printedNumber.toLowerCase().includes(q)
    );
  });

  function buyValueOf(l: Listing): number | null {
    return l.price.value == null ? null : applyMarkup(l.price.value, markup);
  }

  return (
    <>
      <div className="mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by card name, set, or number…"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:max-w-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((l) => {
          const buyValue = buyValueOf(l);
          return (
            <div
              key={l.listingId}
              className="card-lift flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm"
            >
              <div className="relative aspect-[63/88] w-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.image}
                  alt={l.name}
                  className="h-full w-full object-contain p-2"
                  loading="lazy"
                />
                <span className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
                  {formatPrice(l.price)}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <p className="line-clamp-1 font-semibold">{l.name}</p>
                <p className="line-clamp-1 text-xs text-gray-500">
                  {l.setName} · {l.printedNumber}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5">{l.condition}</span>
                  {l.rarity && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5">{l.rarity}</span>
                  )}
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => setBuyTarget(l)}
                    disabled={buyValue == null}
                    className="rounded-lg bg-brand px-3 py-1.5 text-center text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buyValue == null ? "Price unavailable" : `Buy · ${formatMoney(buyValue)}`}
                  </button>
                  <button
                    onClick={() => setTradeTarget(l)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Propose a trade
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-500">
          No cards match “{query}”.
        </p>
      )}

      {tradeTarget && (
        <TradeModal target={tradeTarget} onClose={() => setTradeTarget(null)} />
      )}
      {buyTarget && (
        <BuyModal
          target={buyTarget}
          buyValue={buyValueOf(buyTarget) ?? 0}
          markupText={markupLabel(markup)}
          onClose={() => setBuyTarget(null)}
        />
      )}
    </>
  );
}
