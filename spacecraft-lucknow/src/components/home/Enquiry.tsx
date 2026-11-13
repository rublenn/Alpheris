"use client";

import { useState } from "react";
import { categories } from "@/lib/catalog";
import { Reveal, RevealHeading } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Button";
import { site, whatsappLink } from "@/lib/site";

const field =
  "w-full border-b border-ink/25 bg-transparent py-3 text-[16px] text-ink placeholder:text-muted/70 transition-colors focus:border-accent-deep focus:outline-none";
const label = "text-[11px] font-semibold uppercase tracking-[0.2em] text-muted";

/**
 * Enquiry form. There is no server yet, so nothing is stored or emailed:
 * submitting opens WhatsApp with the message already written, and the
 * customer presses send there. A proper form backend comes in Phase 4.
 */
export function Enquiry() {
  const [sent, setSent] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const lines = [
      "Hello Space Craft, I have an enquiry.",
      `Name: ${data.get("name")}`,
      `Interested in: ${data.get("interest")}`,
      data.get("message") ? `Details: ${data.get("message")}` : "",
    ].filter(Boolean);
    window.open(whatsappLink(lines.join("\n")), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <section id="contact" className="bg-ivory py-24 lg:py-36">
      <div className="shell grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow flex items-center gap-4">
              <span className="text-muted">06</span>
              <span className="h-px w-10 bg-accent" />
              Contact & enquiry
            </p>
          </Reveal>
          <RevealHeading
            text="Let’s build your *dream* space."
            className="display mt-5 text-[clamp(2.4rem,5.4vw,4.6rem)]"
          />
          <Reveal delay={0.1}>
            <dl className="mt-10 space-y-6 text-[15px]">
              <div>
                <dt className={label}>Call</dt>
                <dd className="mt-1">
                  <a href={site.phoneHref} className="display text-3xl hover:text-accent-deep">
                    {site.phoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={label}>Email</dt>
                <dd className="mt-1">
                  <a href={`mailto:${site.email}`} className="break-all hover:text-accent-deep">
                    {site.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className={label}>Location</dt>
                <dd className="mt-1">{site.address}</dd>
              </div>
              <div>
                <dt className={label}>Hours</dt>
                <dd className="mt-1">
                  {site.days} · {site.hours}
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.15} className="lg:col-span-6 lg:col-start-7">
          <form onSubmit={onSubmit} className="border border-line bg-white p-6 sm:p-10">
            <div className="grid gap-8">
              <div>
                <label htmlFor="enquiry-name" className={label}>
                  Your name
                </label>
                <input id="enquiry-name" name="name" required autoComplete="name" className={field} />
              </div>
              <div>
                <label htmlFor="enquiry-interest" className={label}>
                  Interested in
                </label>
                <select id="enquiry-interest" name="interest" className={field} defaultValue="General enquiry">
                  <option>General enquiry</option>
                  {categories.map((c) => (
                    <option key={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="enquiry-message" className={label}>
                  Tell us about your project <span className="normal-case tracking-normal">(optional)</span>
                </label>
                <textarea id="enquiry-message" name="message" rows={3} className={`${field} resize-none`} />
              </div>
            </div>

            <button
              type="submit"
              className="group relative mt-10 flex h-14 w-full items-center justify-center gap-3 overflow-hidden bg-ink text-[12px] font-semibold uppercase tracking-[0.2em] text-white before:absolute before:inset-0 before:origin-bottom before:scale-y-0 before:bg-accent-deep before:transition-transform before:duration-500 before:ease-luxe hover:before:scale-y-100"
            >
              <span className="relative">Send enquiry via WhatsApp</span>
              <Arrow className="relative transition-transform duration-500 ease-luxe group-hover:translate-x-1" />
            </button>
            <p role="status" className="mt-4 text-[13px] leading-relaxed text-muted">
              {sent
                ? "WhatsApp has opened in a new tab — press send there to deliver your message."
                : "This opens WhatsApp with your message ready to send. Nothing is stored on this website."}
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
