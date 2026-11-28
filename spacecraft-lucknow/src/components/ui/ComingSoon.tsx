import type { ReactNode } from "react";
import { Button } from "./Button";

/** Honest placeholder for pages that are built in a later phase. */
export function ComingSoon({
  phase,
  title,
  children,
}: {
  phase: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="blueprint flex min-h-[80svh] items-center bg-ivory pb-20 pt-[140px]">
      <div className="shell">
        <p className="eyebrow flex items-center gap-4">
          <span className="h-px w-10 bg-accent" />
          {phase} · In development
        </p>
        <h1 className="display mt-6 max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)]">{title}</h1>
        <div className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">{children}</div>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/">Back to homepage</Button>
          <Button href="/#contact" variant="outline">
            Send an enquiry
          </Button>
        </div>
      </div>
    </section>
  );
}
