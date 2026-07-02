"use client";

import Link from "next/link";

export default function AdminNav({
  current,
  onLock,
}: {
  current: "listings" | "history";
  onLock: () => void;
}) {
  const tab = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
        current === key ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex gap-1">
        {tab("/admin", "listings", "List cards")}
        {tab("/admin/history", "history", "Enquiries")}
      </div>
      <button
        onClick={onLock}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
      >
        Lock
      </button>
    </div>
  );
}
