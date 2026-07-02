"use client";

import { useEffect, useState } from "react";
import type { CardInfo, Listing } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import CardPicker from "@/components/CardPicker";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [card, setCard] = useState<CardInfo | null>(null);
  const [condition, setCondition] = useState("Near Mint");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);

  async function refresh() {
    const res = await fetch("/api/admin/listings");
    const data = await res.json();
    setListings(data.listings || []);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function list() {
    if (!card) return;
    if (!password) {
      setStatus("Enter your admin password above first.");
      return;
    }
    setStatus("Listing…");
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ card, condition, notes }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setListings(data.listings);
      setCard(null);
      setNotes("");
      setStatus("Listed! ✅ (add another below)");
    } else {
      setStatus(
        res.status === 401
          ? "Incorrect admin password — check ADMIN_PASSWORD in .env.local."
          : data.error || "Failed to list. Please try again."
      );
    }
  }

  async function remove(id: string) {
    if (!password) {
      setStatus("Enter your admin password above first.");
      return;
    }
    const res = await fetch(`/api/admin/listings?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    const data = await res.json();
    if (res.ok && data.ok) setListings(data.listings);
    else
      setStatus(
        res.status === 401
          ? "Incorrect admin password — check ADMIN_PASSWORD in .env.local."
          : data.error || "Failed to remove."
      );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">Admin — list your cards</h1>
      <p className="mt-1 text-sm text-gray-500">
        Only you should use this page. Enter your admin password once, then look
        up cards (Japanese or English) and list them for trade.
      </p>

      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">
        <label className="block text-sm font-semibold">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Set ADMIN_PASSWORD in .env.local"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none sm:max-w-xs"
        />
      </div>

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
        <h2 className="font-bold">Your listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Nothing listed yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {listings.map((l) => (
              <li key={l.listingId} className="flex items-center gap-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.image && <img src={l.image} alt={l.name} className="h-12 w-auto object-contain" />}
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
        )}
      </div>
    </div>
  );
}
