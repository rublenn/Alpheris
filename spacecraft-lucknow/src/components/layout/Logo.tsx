import Link from "next/link";
import { site } from "@/lib/site";

/** Text wordmark. Swap for the real logo file once it is supplied. */
export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} aria-label={`${site.fullName} — home`} className="flex items-center gap-3">
      <span aria-hidden="true" className="flex h-7 items-stretch gap-[3px]">
        <span className="w-[3px] bg-accent" />
        <span className="w-[3px] bg-accent" />
        <span className="w-[3px] bg-accent" />
        <span className="w-[3px] bg-ink" />
      </span>
      <span className="leading-none">
        <span className="block text-[15px] font-bold uppercase tracking-[0.3em] text-ink">Space Craft</span>
        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.42em] text-muted">
          {site.city}
        </span>
      </span>
    </Link>
  );
}
