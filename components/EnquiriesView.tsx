"use client";

import { useEffect, useMemo, useState } from "react";
import type { Enquiry } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const MAX_ROWS = 200;

function telegramLink(handle: string): string | null {
  const h = handle.trim().replace(/^@/, "");
  return /^[A-Za-z0-9_]{3,}$/.test(h) ? `https://t.me/${h}` : null;
}

function when(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function EnquiriesView({ password }: { password: string }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "trade">("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/enquiries", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
      } else {
        setError(`Couldn't load enquiries (HTTP ${res.status}).`);
      }
    } catch {
      setError("Network error loading enquiries.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enquiries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (!q) return true;
      const hay = [
        e.contact?.name,
        e.contact?.telegram,
        e.message,
        e.card?.name,
        e.card?.setName,
        e.target?.name,
        e.target?.setName,
        ...(e.offered || []).flatMap((o) => [o.name, o.setName]),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [enquiries, query, typeFilter]);

  const shown = filtered.slice(0, MAX_ROWS);
  const buyCount = enquiries.filter((e) => e.type === "buy").length;
  const tradeCount = enquiries.filter((e) => e.type === "trade").length;

  const chip = (key: "all" | "buy" | "trade", label: string) => (
    <button
      onClick={() => setTypeFilter(key)}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        typeFilter === key ? "bg-brand text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Enquiries</h1>
          <p className="mt-1 text-sm text-gray-500">
            Every buy request and trade offer, newest first.
          </p>
        </div>
        <button
          onClick={load}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {chip("all", `All (${enquiries.length})`)}
        {chip("buy", `Buys (${buyCount})`)}
        {chip("trade", `Trades (${tradeCount})`)}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, handle, card…"
          className="ml-auto w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none sm:w-64"
        />
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : enquiries.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">
          No enquiries yet. Buy requests and trade offers will show up here.
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">No enquiries match your filters.</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-gray-400">
            Showing {shown.length} of {filtered.length}
            {filtered.length > MAX_ROWS ? " — refine your search to see more" : ""}
          </p>
          <ul className="mt-2 space-y-3">
            {shown.map((e) => {
              const tg = telegramLink(e.contact?.telegram || "");
              return (
                <li key={e.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        e.type === "buy"
                          ? "bg-brand/10 text-brand-dark"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {e.type === "buy" ? "💰 Buy" : "🔄 Trade"}
                    </span>
                    <span className="text-xs text-gray-400">{when(e.receivedAt)}</span>
                  </div>

                  {e.type === "buy" && e.card && (
                    <div className="text-sm">
                      <p className="font-semibold">{e.card.name}</p>
                      <p className="text-gray-500">
                        {e.card.setName} · {e.card.printedNumber} · {e.card.condition}
                      </p>
                      <p className="mt-1 font-bold">
                        Buy price: {formatMoney(e.buyValue ?? null)}
                      </p>
                    </div>
                  )}

                  {e.type === "trade" && (
                    <div className="text-sm">
                      <p>
                        <span className="text-gray-500">Wants: </span>
                        <span className="font-semibold">{e.target?.name}</span>
                        {e.target ? ` (${e.target.setName} · ${e.target.printedNumber})` : ""}
                        {" — "}
                        {formatMoney(e.targetValue ?? null)}
                      </p>
                      <p className="mt-1 text-gray-500">Offering:</p>
                      <ul className="ml-4 list-disc text-gray-700">
                        {(e.offered || []).map((o, i) => (
                          <li key={i}>
                            {o.name} ({o.setName} · {o.printedNumber}) — {o.condition}
                            {o.quantity && o.quantity > 1 ? ` ×${o.quantity}` : ""} —{" "}
                            {formatMoney(o.price?.value ?? null, o.price?.currency ?? "SGD")}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1">
                        <span className="font-bold">Offer total: {formatMoney(e.offeredTotal ?? null)}</span>
                        {e.fairness ? <span className="text-gray-500"> · {e.fairness}</span> : null}
                      </p>
                    </div>
                  )}

                  {e.message && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                      “{e.message}”
                    </p>
                  )}

                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      From <span className="font-semibold">{e.contact?.name}</span>{" "}
                      {tg ? (
                        <a href={tg} target="_blank" rel="noopener noreferrer" className="text-brand underline">
                          {e.contact?.telegram}
                        </a>
                      ) : (
                        <span>{e.contact?.telegram}</span>
                      )}
                    </span>
                    <span className={`text-xs ${e.delivered ? "text-green-600" : "text-amber-600"}`}>
                      {e.delivered ? "✓ sent to Telegram" : "⚠ not delivered"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
