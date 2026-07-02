"use client";

import { useState } from "react";
import type { Listing } from "@/lib/types";
import { formatMoney, formatPrice } from "@/lib/format";

export default function BuyModal({
  target,
  buyValue,
  markupText,
  onClose,
}: {
  target: Listing;
  buyValue: number;
  markupText: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const canSubmit = name.trim().length > 0 && telegram.trim().length > 0 && !submitting;

  async function submit() {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card: {
            name: target.name,
            printedNumber: target.number,
            setName: target.setName,
            condition: target.condition,
            price: target.price,
          },
          contact: { name: name.trim(), telegram: telegram.trim() },
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          text: data.delivered
            ? "Request sent! I'll message you on Telegram to arrange payment and postage. 🎉"
            : "Request recorded! (Telegram isn't connected yet, but your request was logged.)",
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h2 className="text-xl font-bold">Buy this card</h2>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{target.name}</span>
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
            {/* Card + price summary */}
            <div className="mb-5 flex gap-4 rounded-xl bg-gray-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {target.image && (
                <img
                  src={target.image}
                  alt={target.name}
                  className="h-28 w-auto rounded-md object-contain"
                />
              )}
              <div className="flex-1 text-sm">
                <p className="font-semibold">{target.name}</p>
                <p className="text-gray-500">
                  {target.setName} · {target.number}
                </p>
                <p className="text-gray-500">Condition: {target.condition}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-gray-500">Market price</span>
                  <span className="font-medium">{formatPrice(target.price)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-500">
                  <span>Markup</span>
                  <span>{markupText}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-gray-200 pt-1">
                  <span className="font-semibold">Buy price</span>
                  <span className="text-lg font-extrabold text-brand">
                    {formatMoney(buyValue)}
                  </span>
                </div>
              </div>
            </div>

            <p className="mb-3 text-sm text-gray-500">
              Leave your details and I&apos;ll message you on Telegram to arrange
              payment and postage. Nothing is charged here.
            </p>

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
                {submitting ? "Sending…" : `Request to buy · ${formatMoney(buyValue)}`}
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
