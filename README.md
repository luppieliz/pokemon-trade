# Card Trade Post 🎴

A Pokémon-card **trading** marketplace for **Japanese and English** cards. Instead
of prices, visitors offer their own cards; the site looks up live market values
from the [JustTCG API](https://justtcg.com/) and compares both sides so trades are
fair. When someone sends an offer, it lands in **your Telegram** and you arrange
payment/postage manually.

- **You** list cards on the `/admin` page (password-protected).
- **Visitors** can either:
  - **Buy directly** — pay the live market price plus a configurable margin
    (`BUY_MARKUP`), leaving their name + Telegram handle; or
  - **Propose a swap** by choosing the language (JP/EN), picking the set, and
    entering the card name (e.g. `Gengar`) and number (e.g. `038/095`).
- Both buy requests and trade offers are delivered to your Telegram chat.

---

## 1. Install & run locally

You need [Node.js](https://nodejs.org/) 18.17+ (you have v24 ✅).

```bash
cd pokemon-trade
npm install
cp .env.local.example .env.local   # then edit .env.local (see below)
npm run dev
```

Open <http://localhost:3000>. The admin page is at
<http://localhost:3000/admin>.

> On Windows PowerShell use `Copy-Item .env.local.example .env.local` instead of `cp`.

---

## 2. Configure `.env.local`

| Variable | What it does | Required? |
| --- | --- | --- |
| `JUSTTCG_API_KEY` | Live prices for JP + EN cards. | **Yes** |
| `ADMIN_PASSWORD` | Password to add/remove listings on `/admin`. | **Yes** |
| `TELEGRAM_BOT_TOKEN` | Bot that sends you trade offers. | For delivery |
| `TELEGRAM_CHAT_ID` | The chat that receives offers. | For delivery |
| `BUY_MARKUP` | "Buy directly" margin: `10` = +S$10, `15%` = +15%. | Optional (default `10`) |

The site runs without Telegram configured — offers are still logged to
`data/trades.json` — but you won't get notified until you set it up.

### Get a free JustTCG API key (required for prices)
1. Sign up at <https://justtcg.com/> (free tier: 100 lookups/day, no card needed).
2. Copy your key (starts with `tcg_…`) into `JUSTTCG_API_KEY`.
3. Prices come from TCGplayer market data (USD) and cover both Japanese and
   English sets. If it gets busy, the $19/mo tier lifts the daily limit — but
   the app caches lookups to make calls go a long way.

All prices are displayed in **SGD**, converted from JustTCG's USD figures using
a live exchange rate (via [frankfurter.app](https://frankfurter.app/), free,
no key needed, refreshed every 6 hours). If that service is ever unreachable,
the app falls back to a fixed approximate rate so prices never break.

---

## 3. Set up Telegram (step by step)

1. In Telegram, search for **@BotFather** and start a chat.
2. Send `/newbot`, choose a name and a username ending in `bot`.
3. BotFather replies with a **token** like `123456789:AAE...`. Put it in
   `TELEGRAM_BOT_TOKEN`.
4. **Start your own bot:** search for the username you just made and press
   **Start** (this lets the bot message you).
5. Find your **chat id**:
   - Easiest: message **@userinfobot** — it replies with your numeric id.
   - Put that number in `TELEGRAM_CHAT_ID`.
6. Restart the dev server (`Ctrl+C`, then `npm run dev`) so it picks up the
   new values, and send yourself a test trade from the site.

> **Want offers in a group instead?** Add your bot to the group, send a message,
> then open `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser
> and copy the `chat.id` (group ids are negative, e.g. `-100123...`).

---

## 4. List your first card

1. Go to `/admin`, type your `ADMIN_PASSWORD`.
2. Choose **Japanese** or **English**, start typing the **set** name and pick it
   from the list (e.g. `SM9: Tag Bolt`), then enter the **card name** (`Gengar`)
   and **number** (`038/095`), and pick the **condition**.
3. Click **Look up price**, check the preview + market price, then
   **List this card for trade**.

Listings are saved to `data/listings.json`.

---

## 5. Deploy free to Vercel

1. Push this folder to a GitHub repo (don't commit `.env.local` — it's ignored).
2. Go to <https://vercel.com>, **Add New → Project**, import the repo.
3. In the project's **Settings → Environment Variables**, add the same
   variables from your `.env.local`.
4. Deploy. You'll get a URL like `https://your-app.vercel.app`.

### ⚠️ One thing to know about listings on Vercel
Vercel's filesystem is read-only, so adding cards via `/admin` on the live site
won't persist. The simplest workflow: **manage listings locally** (`/admin` on
your machine), then commit the updated `data/listings.json` and push — Vercel
redeploys automatically. If you'd rather add cards directly on the live site,
tell me and I'll wire it up to a small database (e.g. Vercel KV) — about 20
minutes of work.

---

## Project structure

```
app/
  page.tsx                 Marketplace home (server-rendered, live prices)
  admin/page.tsx           Your card-listing page
  how-it-works/page.tsx    Explainer
  api/sets/route.ts        Lists sets for a game (set picker)
  api/card/route.ts        Card lookup (JustTCG: set + name + number)
  api/buy/route.ts         Receives buy requests -> Telegram
  api/trade/route.ts       Receives trade offers -> Telegram
  api/admin/listings/...   Add/remove listings (password-protected)
components/
  MarketplaceClient.tsx    Card grid + search + Buy/Trade buttons
  CardPicker.tsx           Game/set/name/number lookup widget (shared)
  BuyModal.tsx             Buy-directly flow (market price + markup)
  TradeModal.tsx           Offer flow + value comparison
lib/
  justtcg.ts               JustTCG client (sets, lookup, prices, images)
  currency.ts              USD -> SGD conversion
  config.ts                Buy-markup config (BUY_MARKUP)
  telegram.ts              Sends the Telegram message
  listings.ts              Reads/writes data/listings.json
  format.ts                Money + fairness helpers
data/
  listings.json            Your cards for trade
  trades.json              Log of received offers (created on first offer)
```
