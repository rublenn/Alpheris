import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-border px-6 py-4">
      <div className="mx-auto max-w-6xl flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight text-lg">
          Alperis<span className="text-accent">Medien</span>
        </Link>
        <Link
          href="/start"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Get my instant plan
        </Link>
      </div>
    </header>
  );
}
