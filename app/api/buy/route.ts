import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatMoney } from "@/lib/format";
import { getMarkup, applyMarkup, markupLabel } from "@/lib/config";
import { addEnquiry } from "@/lib/enquiries";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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

  const tg = await sendTelegramMessage(text);
  const delivered = tg.configured && tg.ok;

  // Persist to the enquiry log (best-effort; never blocks the response).
  await addEnquiry({
    id: newId(),
    receivedAt: new Date().toISOString(),
    type: "buy",
    delivered,
    contact: { name: String(contact.name), telegram: String(contact.telegram) },
    message: message ? String(message) : undefined,
    card: {
      name: card.name,
      printedNumber: card.printedNumber,
      setName: card.setName,
      condition: card.condition,
      price: card.price,
    },
    buyValue: buyValue ?? undefined,
  });

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
