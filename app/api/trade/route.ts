import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { formatMoney } from "@/lib/format";
import { addEnquiry } from "@/lib/enquiries";
import type { EnquiryCard } from "@/lib/types";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function money(p: any): string {
  if (!p || p.value == null) return "no price";
  return formatMoney(Number(p.value), p.currency ?? "SGD");
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const { target, offered, contact, message, fairness, offeredTotal, targetValue } = body || {};

  if (!contact?.name || !contact?.telegram) {
    return NextResponse.json(
      { ok: false, error: "Name and Telegram handle are required" },
      { status: 400 }
    );
  }
  if (!Array.isArray(offered) || offered.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Add at least one card you're offering" },
      { status: 400 }
    );
  }

  const offeredLines = offered
    .map(
      (o: any) =>
        `   • ${esc(o.name)} (${esc(o.setName)} ${esc(o.printedNumber)}) — ${esc(
          o.condition
        )} ×${esc(o.quantity)} — <b>${money(o.price)}</b>`
    )
    .join("\n");

  const text =
    `🎴 <b>New trade offer</b>\n\n` +
    `<b>Wants:</b> ${esc(target?.name)} (${esc(target?.setName)} ${esc(
      target?.printedNumber
    )}) — ${esc(target?.condition)}\n` +
    `<b>My card value:</b> ${formatMoney(Number(targetValue || 0))}\n\n` +
    `<b>Offering:</b>\n${offeredLines}\n\n` +
    `<b>Offer total:</b> ${formatMoney(Number(offeredTotal || 0))}\n` +
    `<b>Assessment:</b> ${esc(fairness)}\n\n` +
    `<b>From:</b> ${esc(contact.name)} (${esc(contact.telegram)})\n` +
    (message ? `<b>Message:</b> ${esc(message)}\n` : "");

  const tg = await sendTelegramMessage(text);
  const delivered = tg.configured && tg.ok;

  // Persist to the enquiry log (best-effort; never blocks the response).
  await addEnquiry({
    id: newId(),
    receivedAt: new Date().toISOString(),
    type: "trade",
    delivered,
    contact: { name: String(contact.name), telegram: String(contact.telegram) },
    message: message ? String(message) : undefined,
    target: target
      ? {
          name: target.name,
          printedNumber: target.printedNumber,
          setName: target.setName,
          condition: target.condition,
          price: target.price,
        }
      : undefined,
    offered: (offered as any[]).map(
      (o): EnquiryCard => ({
        name: o.name,
        printedNumber: o.printedNumber,
        setName: o.setName,
        condition: o.condition,
        quantity: o.quantity,
        price: o.price,
      })
    ),
    offeredTotal: Number(offeredTotal || 0),
    targetValue: Number(targetValue || 0),
    fairness: fairness ? String(fairness) : undefined,
  });

  if (!tg.configured) {
    // Telegram not set up yet — the offer is still logged so nothing is lost.
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
