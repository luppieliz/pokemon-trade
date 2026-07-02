"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CardInfo, GameId, SetOption } from "@/lib/types";
import { GAMES } from "@/lib/justtcg";
import { formatPrice } from "@/lib/format";

const CONDITIONS = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

// Simple in-memory cache of set lists so we don't refetch per component.
const setsCache: Partial<Record<GameId, SetOption[]>> = {};

export default function CardPicker({
  onResolved,
  compact = false,
}: {
  onResolved: (card: CardInfo | null, condition: string) => void;
  compact?: boolean;
}) {
  const listId = useId();
  const [game, setGame] = useState<GameId>("pokemon-japan");
  const [sets, setSets] = useState<SetOption[]>([]);
  const [setInput, setSetInput] = useState("");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [condition, setCondition] = useState("Near Mint");
  const [status, setStatus] = useState<
    "idle" | "loading" | "found" | "notfound" | "error" | "nosets"
  >("idle");
  const [resolved, setResolved] = useState<CardInfo | null>(null);
  const setsReq = useRef(0);

  // Load sets whenever the game changes.
  useEffect(() => {
    let cancelled = false;
    const reqId = ++setsReq.current;
    setSetInput("");
    invalidate();
    if (setsCache[game]) {
      setSets(setsCache[game]!);
      return;
    }
    setSets([]);
    fetch(`/api/sets?game=${game}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || reqId !== setsReq.current) return;
        const list: SetOption[] = d.sets || [];
        setsCache[game] = list;
        setSets(list);
        if (list.length === 0) setStatus("nosets");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  function invalidate() {
    if (resolved) setResolved(null);
    setStatus("idle");
    onResolved(null, condition);
  }

  function resolveSetId(): string | null {
    const wanted = setInput.trim().toLowerCase();
    if (!wanted) return null;
    const exact = sets.find((s) => s.name.toLowerCase() === wanted);
    if (exact) return exact.id;
    const partial = sets.find((s) => s.name.toLowerCase().includes(wanted));
    return partial ? partial.id : null;
  }

  async function lookup() {
    const setId = resolveSetId();
    if (!setId) {
      setStatus("nosets");
      return;
    }
    if (!name.trim()) return;
    setStatus("loading");
    setResolved(null);
    try {
      const params = new URLSearchParams({
        set: setId,
        name: name.trim(),
        number: number.trim(),
        condition,
      });
      const res = await fetch(`/api/card?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.card) {
        setResolved(data.card);
        setStatus("found");
        onResolved(data.card, condition);
      } else {
        setStatus("notfound");
        onResolved(null, condition);
      }
    } catch {
      setStatus("error");
      onResolved(null, condition);
    }
  }

  return (
    <div className="space-y-2">
      {/* Game toggle */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
        {GAMES.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGame(g.id)}
            className={`flex-1 rounded-md px-3 py-1.5 font-semibold transition ${
              game === g.id ? "bg-white shadow text-gray-900" : "text-gray-500"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
        {/* Set combobox */}
        <div className="sm:col-span-2">
          <input
            value={setInput}
            onChange={(e) => {
              setSetInput(e.target.value);
              invalidate();
            }}
            list={listId}
            placeholder={sets.length ? "Set — type to search…" : "Loading sets…"}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          <datalist id={listId}>
            {sets.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
        </div>

        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            invalidate();
          }}
          placeholder="Card name e.g. Gengar"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <input
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            invalidate();
          }}
          placeholder="Number e.g. 038/095"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <select
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value);
            invalidate();
          }}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:outline-none"
        >
          {CONDITIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={lookup}
          disabled={status === "loading" || !name.trim() || !setInput.trim()}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {status === "loading" ? "Looking up…" : "Look up price"}
        </button>
      </div>

      {/* Status / result */}
      {status === "found" && resolved && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-2 text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {resolved.image && (
            <img src={resolved.image} alt={resolved.name} className="h-14 w-auto rounded" />
          )}
          <div>
            <p className="font-semibold text-green-800">
              {resolved.name} · {resolved.number}
            </p>
            <p className="text-green-700">
              {resolved.setName} · {formatPrice(resolved.price)}
              {resolved.price.condition ? ` (${resolved.price.condition})` : ""}
            </p>
          </div>
        </div>
      )}
      {status === "notfound" && (
        <p className="text-sm text-amber-600">
          Not found in that set — check the card name and number.
        </p>
      )}
      {status === "nosets" && (
        <p className="text-sm text-amber-600">
          Pick a set from the list (start typing its name).
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">Lookup failed — please try again.</p>
      )}
    </div>
  );
}
