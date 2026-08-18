import Link from "next/link";
import { redirect } from "next/navigation";

const steps = [
  {
    title: "Tell us about your business",
    body: "Business, the problem you're stuck on, and what you're actually trying to hit — two minutes, no jargon.",
  },
  {
    title: "Get an instant AI solution",
    body: "A mini marketing plan, a numbers projection, and sample creative — generated right away, free to try.",
  },
  {
    title: "Run it yourself, or hand it to us",
    body: "Take what you got and run with it. Or, if you want the numbers without the workload, we take it from here.",
  },
];

export default function Home() {
  if (process.env.NEXT_PUBLIC_ALPHERIS_OS_ROOT === "true") {
    redirect("/os");
  }

  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <p className="text-accent text-sm font-medium tracking-wide uppercase mb-4">
          Marketing that shows, not tells
        </p>
        <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight max-w-3xl mx-auto">
          Tell us your business.
          <br />
          Get an AI marketing plan <span className="text-accent">instantly</span>.
        </h1>
        <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
          Free to try. If you want more numbers and fewer responsibilities,
          we can run the whole thing for you.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/start"
            className="rounded-full bg-accent px-6 py-3 font-medium text-white hover:opacity-90 transition"
          >
            Get my instant plan — free
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-border bg-surface p-6"
          >
            <div className="text-accent text-sm font-semibold mb-3">
              {String(i + 1).padStart(2, "0")}
            </div>
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-border bg-surface-alt p-10 text-center">
          <h2 className="text-2xl font-semibold mb-3">
            DIY it, or let us handle it all.
          </h2>
          <p className="text-muted max-w-xl mx-auto mb-6">
            Every free plan comes with an upgrade path: content, paid ads,
            and business development — run by us, reported in real numbers.
          </p>
          <Link
            href="/start"
            className="rounded-full bg-accent px-6 py-3 font-medium text-white hover:opacity-90 transition inline-block"
          >
            Start free — no card required
          </Link>
        </div>
      </section>
    </div>
  );
}
