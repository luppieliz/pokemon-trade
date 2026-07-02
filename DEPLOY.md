# Deploying to Vercel (free + HTTPS)

Your project is already a git repo with a first commit, and the production build
is verified. Follow these steps to go live.

## Step 1 — Put the code on GitHub

Easiest with **GitHub Desktop** (no command line):
1. Install <https://desktop.github.com/> and sign in (create a free GitHub
   account if you don't have one).
2. **File → Add Local Repository** → choose `C:\Users\User\Desktop\pokemon-trade`.
3. Click **Publish repository**. Keep **"Keep this code private"** ticked.

Prefer the command line? Create an empty repo at <https://github.com/new>
(private, no README), then run in the project folder:
```bash
git remote add origin https://github.com/<you>/pokemon-trade.git
git branch -M main
git push -u origin main
```

## Step 2 — Import into Vercel
1. Go to <https://vercel.com> and **Sign up with GitHub** (free "Hobby" plan).
2. **Add New… → Project**, then **Import** your `pokemon-trade` repo.
3. Framework auto-detects as **Next.js**. Don't change build settings.
4. **Before clicking Deploy**, expand **Environment Variables** and add the ones
   in Step 3. (You can also add them after, under Settings → Environment
   Variables, then redeploy.)

## Step 3 — Environment variables (set these in Vercel)

| Name | Value |
| --- | --- |
| `JUSTTCG_API_KEY` | your `tcg_…` key |
| `TELEGRAM_BOT_TOKEN` | your bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | `34192743` |
| `ADMIN_PASSWORD` | **a NEW strong password** (do NOT reuse `change-me`) |
| `BUY_MARKUP` | `10` (or e.g. `15%`) |

> Copy the exact values from your local `.env.local` — except `ADMIN_PASSWORD`,
> which you should change to something strong for the public site.

## Step 4 — Add Blob storage (so /admin works on the live site)
1. In your Vercel project → **Storage** tab → **Create Database** → **Blob** →
   **Continue** → **Create**.
2. When prompted, **connect it to this project**. Vercel automatically adds a
   `BLOB_READ_WRITE_TOKEN` environment variable — you don't set it manually.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the app picks up the new
   variables.

## Step 5 — Go live
- Visit your `https://<project>.vercel.app` URL.
- Open `/admin`, enter your new `ADMIN_PASSWORD`, and list your first card — it
  now saves to Blob and shows on the marketplace.
- Send yourself a test Buy or Trade to confirm Telegram still delivers.

## Updating the site later
- **Listings** (add/remove cards): just use `/admin` on the live site — no
  redeploy needed.
- **Code changes**: push to GitHub → Vercel auto-redeploys in ~30s.

## Security notes
- `.env.local` is git-ignored — your keys are never in the repo.
- All Vercel traffic is HTTPS. The admin password guards listing changes.
- Keep the repo **private**.
