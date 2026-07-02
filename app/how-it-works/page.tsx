export const metadata = { title: "How it works — Card Trade Post" };

export default function HowItWorks() {
  const steps = [
    {
      title: "Pick a card you want",
      body: "Browse my cards — each shows its live market value in SGD. Then choose how to deal: Buy directly, or Propose a trade.",
    },
    {
      title: "Option A — Buy directly",
      body: "Hit “Buy”, leave your name and Telegram handle, and I'll message you to arrange payment and postage. The buy price is the live market value plus a small margin.",
    },
    {
      title: "Option B — Propose a trade",
      body: "Prefer to swap? Choose Japanese or English, pick the set, then enter your card's name (like Gengar) and number (like 038/095). The site looks up its live value — Japanese and English cards both supported.",
    },
    {
      title: "See if it's a fair swap",
      body: "Your offer total is compared against my card's value. Aim for a fair match — you can add multiple cards to balance it out.",
    },
    {
      title: "Send it over",
      body: "Add your name and Telegram handle and send. The buy request or trade offer lands in my Telegram, and I'll message you to sort out payment and postage. No money changes hands on this site.",
    },
  ];
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-extrabold">How it works</h1>
      <ol className="mt-6 space-y-5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-4">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="font-bold">{s.title}</h2>
              <p className="text-sm text-gray-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        Market prices are for reference only and can move quickly. Final trades
        are agreed manually between us before anything is posted.
      </div>
    </div>
  );
}
