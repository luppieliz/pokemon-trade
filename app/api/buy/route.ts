import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatMoney } from "@/lib/format";
import { getMarkup, applyMarkup, markupLabel } from "@/lib/config";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { card, contact, message } = body || {};

  if (!contact?.name || !contact?.telegram) {
    return NextResponse.json(
      { ok: false, error: "Name and Telegram handle are required" },
      { status: 400 }
    );
  }
  if (!card?.name) {
    return NextResponse.json({ ok: false, error: "Missing card" }, { status: 400 });
  }

  // Recompute the buy price server-side so the markup can't be tampered with.
  const markup = getMarkup();
  const market = Number(card?.price?.value);
  const hasMarket = Number.isFinite(market);
  const buyValue = hasMarket ? applyMarkup(market, markup) : null;

  const text =
    `💰 <b>Buy request</b>\n\n` +
    `<b>Card:</b> ${esc(card.name)} (${esc(card.setName)} ${esc(card.printedNumber)}) — ${esc(
      card.condition
    )}\n` +
    `<b>Market price:</b> ${hasMarket ? formatMoney(market) : "—"}\n` +
    `<b>Buy price:</b> ${buyValue != null ? formatMoney(buyValue) : "—"} (${markupLabel(
      markup
    )})\n\n` +
    `<b>From:</b> ${esc(contact.name)} (${esc(contact.telegram)})\n` +
    (message ? `<b>Message:</b> ${esc(message)}\n` : "");

  // Best-effort log to disk (tagged so buys and trades are distinguishable).
  try {
    const file = path.join(process.cwd(), "data", "trades.json");
    let existing: any[] = [];
    try {
      existing = JSON.parse(await fs.readFile(file, "utf8"));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
    existing.unshift({ receivedAt: new Date().toISOString(), type: "buy", buyValue, ...body });
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(existing, null, 2), "utf8");
  } catch {
    // ignore logging failures
  }

  const tg = await sendTelegramMessage(text);

  if (!tg.configured) {
    return NextResponse.json({ ok: true, delivered: false });
  }
  if (!tg.ok) {
    return NextResponse.json(
      { ok: false, error: `Couldn't reach Telegram: ${tg.error}` },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, delivered: true });
}
