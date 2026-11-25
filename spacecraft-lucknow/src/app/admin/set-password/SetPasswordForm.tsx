"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { setPasswordAction } from "@/actions/admin";
import { inputClass, labelClass } from "@/components/shop/bits";

/** The invite / reset link puts a one-time token after "#" in the address. */
function readToken() {
  return new URLSearchParams(window.location.hash.slice(1)).get("access_token") ?? "";
}
const noop = () => () => {};

export function SetPasswordForm() {
  const token = useSyncExternalStore(noop, readToken, () => null);
  const [message, setMessage] = useState<{ ok?: string; error?: string }>({});
  const [busy, setBusy] = useState(false);

  if (message.ok) {
    return (
      <div className="mt-6 space-y-4">
        <p role="status" className="text-[14px] text-emerald-300">{message.ok}</p>
        <Link href="/admin/login" className="flex h-12 items-center justify-center bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-accent-deep">
          Go to login
        </Link>
      </div>
    );
  }

  if (token === null) return <p className="mt-6 text-muted">Loading…</p>;
  if (!token) {
    return (
      <p className="mt-6 text-[14px] text-muted">
        This page needs the link from your invite or reset email. <Link href="/admin/forgot" className="text-accent-deep underline">Get a new link</Link>.
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password !== String(fd.get("confirm") ?? "")) return setMessage({ error: "The two passwords do not match." });
    setBusy(true);
    setMessage(await setPasswordAction(token!, password).catch(() => ({ error: "Could not reach the server. Try again." })));
    setBusy(false);
    // Remove the one-time token from the address bar.
    history.replaceState(null, "", window.location.pathname);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="password" className={labelClass}>New password</label>
        <input id="password" name="password" type="password" minLength={10} required autoComplete="new-password" className={inputClass} />
        <p className="mt-1.5 text-[12px] text-muted">At least 10 characters. Do not share it with anyone.</p>
      </div>
      <div>
        <label htmlFor="confirm" className={labelClass}>Type it again</label>
        <input id="confirm" name="confirm" type="password" minLength={10} required autoComplete="new-password" className={inputClass} />
      </div>
      {message.error && <p role="alert" className="text-[13px] text-red-300">{message.error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full bg-accent text-[12px] font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-accent-deep disabled:opacity-50">
        {busy ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
