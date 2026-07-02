"use client";

import { useEffect, useMemo, useState } from "react";
import type { CardInfo, Listing } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import CardPicker from "@/components/CardPicker";

const MAX_ROWS = 100;

export default function ListingsManager({ password }: { password: string }) {
  const [card, setCard] = useState<CardInfo | null>(null);
  const [condition, setCondition] = useState("Near Mint");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/listings", { headers: { "x-admin-password": password } });
    if (res.ok) {
      const data = await res.json();
      setListings(data.listings || []);
    }
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function list() {
    if (!card) return;
    setStatus("Listing…");
    try {
      const res = await fetch("/api/admin/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ card, condition, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setListings(data.listings);
        setCard(null);
        setNotes("");
        setStatus("Listed! ✅ (add another below)");
      } else {
        setStatus(data.error || `Failed to list (HTTP ${res.status}). Please try again.`);
      }
    } catch {
      setStatus("Network error — please try again.");
    }
  }

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/admin/listings?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": password },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setListings(data.listings);
      else setStatus(data.error || `Failed to remove (HTTP ${res.status}).`);
    } catch {
      setStatus("Network error — please try again.");
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.setName.toLowerCase().includes(q) ||
        l.number.toLowerCase().includes(q) ||
        l.condition.toLowerCase().includes(q)
    );
  }, [listings, query]);

  const shown = filtered.slice(0, MAX_ROWS);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Admin — list your cards</h1>
      <p className="mt-1 text-sm text-gray-500">
        Look up cards (Japanese or English) and list them for trade.
      </p>

      {/* Add a card */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="font-bold">Add a card</h2>
        <p className="mb-3 text-xs text-gray-500">
          Choose Japanese or English, pick the set, then enter the card name and
          number. The condition you choose sets which market price is used.
        </p>
        <CardPicker
          onResolved={(c, cond) => {
            setCard(c);
            setCondition(cond);
          }}
        />

        {card && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {card.image && (
                <img src={card.image} alt={card.name} className="h-32 w-auto object-contain" />
              )}
              <div className="flex-1 text-sm">
                <p className="font-bold">{card.name}</p>
                <p className="text-gray-500">
                  {card.setName} · {card.number} · {card.rarity || "—"}
                </p>
                <p className="mt-1 font-semibold">
                  Market ({condition}): {formatPrice(card.price)}
                </p>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional) — e.g. graded PSA 9"
                  className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  onClick={list}
                  className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  List this card for trade
                </button>
              </div>
            </div>
          </div>
        )}

        {status && (
          <p
            className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
              status.startsWith("Listed")
                ? "bg-green-50 text-green-700"
                : status.startsWith("Listing")
                ? "text-gray-500"
                : "bg-red-50 text-red-700"
            }`}
          >
            {status}
          </p>
        )}
      </div>

      {/* Current listings */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">Your listings ({listings.length})</h2>
          {listings.length > 0 && (
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, set, number…"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none sm:w-64"
            />
          )}
        </div>

        {listings.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Nothing listed yet.</p>
        ) : filtered.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">No listings match “{query}”.</p>
        ) : (
          <>
            <p className="mt-2 text-xs text-gray-400">
              Showing {shown.length} of {filtered.length}
              {filtered.length !== listings.length ? ` (filtered from ${listings.length})` : ""}
              {filtered.length > MAX_ROWS ? " — refine your search to see more" : ""}
            </p>
            <ul className="mt-2 divide-y divide-gray-100">
              {shown.map((l) => (
                <li key={l.listingId} className="flex items-center gap-3 py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {l.image && (
                    <img src={l.image} alt={l.name} className="h-12 w-auto object-contain" />
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-gray-500">
                      {l.setName} · {l.number} · {l.condition}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{formatPrice(l.price)}</span>
                  <button
                    onClick={() => remove(l.listingId)}
                    className="rounded-md px-2 py-1 text-sm text-gray-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
