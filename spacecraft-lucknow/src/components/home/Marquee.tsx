import { categories } from "@/lib/catalog";

/** A slow, endless ribbon of category names. Purely decorative. */
export function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {categories.map((c) => (
        <span key={c.slug} className="flex items-center">
          <span className="display px-8 text-[clamp(1.6rem,3.4vw,2.8rem)] text-ink/80">{c.name}</span>
          <span className="h-2 w-2 rotate-45 bg-accent" />
        </span>
      ))}
    </div>
  );
  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-line bg-white/80 py-6">
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
