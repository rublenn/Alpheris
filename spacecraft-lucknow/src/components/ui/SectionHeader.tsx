import type { ReactNode } from "react";
import { Reveal, RevealHeading } from "./Reveal";

/** Numbered eyebrow + large heading + optional intro, shared by all sections. */
export function SectionHeader({
  index,
  eyebrow,
  title,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        <Reveal>
          <p className="eyebrow flex items-center gap-4">
            <span className="text-muted">{index}</span>
            <span className="h-px w-10 bg-accent" />
            {eyebrow}
          </p>
        </Reveal>
        <RevealHeading text={title} className="display mt-5 text-[clamp(2.4rem,6vw,5rem)]" />
      </div>
      {children && (
        <Reveal delay={0.15} className="lg:col-span-4">
          <div className="max-w-md text-[15px] leading-relaxed text-muted">{children}</div>
        </Reveal>
      )}
    </div>
  );
}
