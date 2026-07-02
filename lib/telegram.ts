/**
 * Send a message to your Telegram chat.
 * Returns { ok, configured, error } so the caller can tell the difference
 * between "not set up yet" and "tried and failed".
 */
export async function sendTelegramMessage(
  text: string
): Promise<{ ok: boolean; configured: boolean; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, configured: false };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return {
        ok: false,
        configured: true,
        error: json?.description || `Telegram returned ${res.status}`,
      };
    }
    return { ok: true, configured: true };
  } catch (err: any) {
    return { ok: false, configured: true, error: err?.message || "network error" };
  }
}
