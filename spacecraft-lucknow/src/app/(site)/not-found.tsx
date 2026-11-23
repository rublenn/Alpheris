import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="blueprint flex min-h-[80svh] items-center pb-20 pt-[140px]">
      <div className="shell">
        <p className="eyebrow flex items-center gap-4">
          <span className="h-px w-10 bg-accent" />
          404
        </p>
        <h1 className="display mt-6 max-w-4xl text-[clamp(2.6rem,7vw,5.5rem)]">
          This page is <em>not here.</em>
        </h1>
        <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-muted">
          The product or page may have been moved or removed. Try searching the shop instead.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="/search">Search products</Button>
          <Button href="/" variant="outline">Homepage</Button>
        </div>
      </div>
    </section>
  );
}
