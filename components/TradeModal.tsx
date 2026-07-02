"use client";

import { useMemo, useState } from "react";
import type { CardInfo, Listing } from "@/lib/types";
import { formatMoney, formatPrice, fairness } from "@/lib/format";
import CardPicker from "./CardPicker";

interface OfferRow {
  key: string;
  resolved: CardInfo | null;
  condition: string;
  quantity: number;
}

let rowSeed = 0;
function newRow(): OfferRow {
  rowSeed += 1;
  return { key: `row-${rowSeed}`, resolved: null, condition: "Near Mint", quantity: 1 };
}

export default function TradeModal({
  target,
  onClose,
}: {
  target: Listing;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<OfferRow[]>([newRow()]);
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  function update(key: string, patch: Partial<OfferRow>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const { offeredTotal, resolvedCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const r of rows) {
      const v = r.resolved?.price?.value;
      if (v != null) {
        total += v * r.quantity;
        count += 1;
      }
    }
    return { offeredTotal: total, resolvedCount: count };
  }, [rows]);

  const targetValue = target.price.value ?? 0;
  const fair = fairness(offeredTotal, targetValue);
  const canSubmit =
    resolvedCount > 0 && name.trim().length > 0 && telegram.trim().length > 0 && !submitting;

  async function submit() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: {
            name: target.name,
            printedNumber: target.number,
            setName: target.setName,
            condition: target.condition,
            price: target.price,
          },
          offered: rows
            .filter((r) => r.resolved)
            .map((r) => ({
              name: r.resolved!.name,
              printedNumber: r.resolved!.number,
              setName: r.resolved!.setName,
              condition: r.condition,
              quantity: r.quantity,
              price: r.resolved!.price,
            })),
          contact: { name: name.trim(), telegram: telegram.trim() },
          message: message.trim(),
          fairness: fair.label,
          offeredTotal,
          targetValue,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          text: data.delivered
            ? "Trade sent! I'll message you on Telegram to sort out postage. 🎉"
            : "Trade recorded! (Telegram isn't connected yet, but your offer was logged.)",
        });
      } else {
        setResult({ ok: false, text: data.error || "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ ok: false, text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const toneClass =
    fair.tone === "good"
      ? "bg-green-100 text-green-800"
      : fair.tone === "low"
      ? "bg-amber-100 text-amber-800"
      : fair.tone === "high"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-600";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-3xl rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-xl font-bold">Propose a trade</h2>
            <p className="text-sm text-gray-500">
              You want: <span className="font-semibold text-gray-800">{target.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {result?.ok ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-green-100 text-2xl">
              ✅
            </div>
            <p className="text-lg font-semibold">{result.text}</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-5">
            {/* Target card summary */}
            <div className="mb-6 flex gap-4 rounded-xl bg-gray-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {target.image && (
                <img
                  src={target.image}
                  alt={target.name}
                  className="h-28 w-auto rounded-md object-contain"
                />
              )}
              <div className="text-sm">
                <p className="font-semibold">{target.name}</p>
                <p className="text-gray-500">
                  {target.setName} · {target.number}
                </p>
                <p className="mt-1 text-gray-500">Condition: {target.condition}</p>
                <p className="mt-2 text-base font-bold">
                  Market value: {formatPrice(target.price)}
                </p>
              </div>
            </div>

            {/* Offered cards */}
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              What you&apos;re offering
            </h3>
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={row.key} className="rounded-xl border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Card {i + 1}</span>
                    {rows.length > 1 && (
                      <button
                        onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                        className="text-xs text-gray-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <CardPicker
                    compact
                    onResolved={(card, condition) =>
                      update(row.key, { resolved: card, condition })
                    }
                  />
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <label className="text-gray-500">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        update(row.key, { quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setRows((rs) => [...rs, newRow()])}
              className="mt-3 text-sm font-semibold text-brand hover:text-brand-dark"
            >
              + Add another card
            </button>

            {/* Value comparison */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Your offer total</span>
                <span className="font-bold">{formatMoney(offeredTotal, "SGD")}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-gray-500">My card&apos;s value</span>
                <span className="font-bold">{formatMoney(targetValue, "SGD")}</span>
              </div>
              <div className="mt-3">
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${toneClass}`}>
                  {resolvedCount > 0 ? fair.label : "Look up a card to compare"}
                </span>
              </div>
            </div>

            {/* Contact */}
            <h3 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Your details
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
              <input
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="Your Telegram @username"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything else? (optional)"
              rows={2}
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />

            {result && !result.ok && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {result.text}
              </p>
            )}

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send trade offer"}
              </button>
            </div>
            <p className="mt-2 text-right text-xs text-gray-400">
              Name and Telegram are required so I can reach you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
