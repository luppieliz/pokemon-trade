"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "ctp-admin-pw";

/**
 * Password gate shared by all /admin pages. Renders only a lock screen until
 * the password is verified server-side, then calls children(password, lock).
 * The verified password is kept in sessionStorage so a refresh doesn't re-prompt.
 */
export default function AdminGate({
  children,
}: {
  children: (password: string, lock: () => void) => React.ReactNode;
}) {
  const [booting, setBooting] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [pwInput, setPwInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  async function verify(pw: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-password": pw },
      });
      const data = await res.json().catch(() => ({}));
      return res.ok && data.ok === true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? sessionStorage.getItem(SESSION_KEY) : null;
    if (!saved) {
      setBooting(false);
      return;
    }
    verify(saved).then((ok) => {
      if (ok) {
        setPassword(saved);
        setUnlocked(true);
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
      setBooting(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lock() {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
    setPassword("");
    setPwInput("");
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setAuthError("");
    const ok = await verify(pwInput);
    setChecking(false);
    if (ok) {
      setPassword(pwInput);
      setUnlocked(true);
      sessionStorage.setItem(SESSION_KEY, pwInput);
    } else {
      setAuthError("Incorrect password.");
    }
  }

  if (booting) {
    return <div className="mx-auto max-w-3xl py-24 text-center text-gray-400">Loading…</div>;
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-sm py-16">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-2xl">
            🔒
          </div>
          <h1 className="text-2xl font-extrabold">Admin access</h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter your admin password to continue.
          </p>
        </div>
        <form onSubmit={unlock} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <input
            type="password"
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            autoFocus
            placeholder="Admin password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          />
          {authError && <p className="mt-2 text-sm text-red-600">{authError}</p>}
          <button
            type="submit"
            disabled={checking || !pwInput}
            className="mt-3 w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {checking ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return <div className="mx-auto max-w-3xl">{children(password, lock)}</div>;
}
