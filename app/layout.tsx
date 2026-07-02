import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Card Trade Post — Pokémon trades by value",
  description:
    "Browse my Pokémon cards and propose a fair swap. No cash — trade card-for-card at market value.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans text-gray-900 antialiased">
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white font-bold shadow">
                ⚡
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                Card Trade Post
              </span>
            </a>
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
              <a href="/" className="hover:text-gray-900">
                Marketplace
              </a>
              <a href="/how-it-works" className="hover:text-gray-900">
                How it works
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-gray-400">
          Prices shown in SGD, converted from live TCGplayer market data, for
          reference only. Trades are arranged manually — nothing is charged on
          this site.
        </footer>
      </body>
    </html>
  );
}
