import { getListings } from "@/lib/listings";
import { getCardById } from "@/lib/justtcg";
import { getMarkup } from "@/lib/config";
import MarketplaceClient from "@/components/MarketplaceClient";
import type { Listing } from "@/lib/types";

// Re-fetch prices periodically rather than on every request.
export const revalidate = 1800;

export default async function HomePage() {
  const listings = await getListings();

  // Refresh each listing's price live from the API (falls back to the stored
  // snapshot if the API is unavailable).
  const withLivePrices: Listing[] = await Promise.all(
    listings.map(async (l) => {
      try {
        const live = await getCardById(l.id, l.condition);
        return live ? { ...l, price: live.price, image: live.image } : l;
      } catch {
        return l;
      }
    })
  );

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Trade for my Pokémon cards
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          <strong>Buy directly</strong> at a small margin over live market value,
          or <strong>propose a card-for-card swap</strong> — the site compares
          both sides for you. Either way, the deal is sent straight to me on
          Telegram to arrange payment and postage.
        </p>
      </section>

      {withLivePrices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold">No cards listed yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Head to{" "}
            <a href="/admin" className="text-brand underline">
              the admin page
            </a>{" "}
            to list your first card for trade.
          </p>
        </div>
      ) : (
        <MarketplaceClient listings={withLivePrices} markup={getMarkup()} />
      )}
    </div>
  );
}
