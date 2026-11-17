import { categories } from "@/lib/catalog";

/**
 * A slim ribbon of category names that runs along the bottom of the screen
 * the whole time you scroll. Purely decorative.
 */
export function Marquee() {
  const row = (
    <div className="flex shrink-0 items-center">
      {categories.map((c) => (
        <span key={c.slug} className="flex items-center">
          <span className="display px-6 text-[1.25rem] leading-none text-ink/80">{c.name}</span>
          <span className="h-1.5 w-1.5 rotate-45 bg-accent" />
        </span>
      ))}
    </div>
  );
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex h-[46px] items-center overflow-hidden border-t border-line bg-ivory/85 backdrop-blur-md"
    >
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  );
}
