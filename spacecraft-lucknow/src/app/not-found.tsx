import Link from "next/link";

/** For addresses that match no page at all. */
export default function GlobalNotFound() {
  return (
    <main className="blueprint flex min-h-screen items-center justify-center px-5 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="display mt-4 text-[clamp(2.4rem,6vw,4.5rem)]">This page is <em>not here.</em></h1>
        <Link href="/" className="mt-8 inline-block text-[12px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          Back to Space Craft →
        </Link>
      </div>
    </main>
  );
}
