import Link from "next/link";
import { categories } from "@/lib/catalog";
import { navLinks, site, whatsappLink } from "@/lib/site";
import { Logo } from "./Logo";
import { legalPages } from "@/lib/legal";

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-white">
      <div className="shell grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Logo />
          <p className="mt-6 max-w-xs text-[14px] leading-relaxed text-muted">
            Interior and architectural materials for residential and commercial spaces across Lucknow
            and nearby areas.
          </p>
        </div>

        <FooterColumn title="Explore" className="lg:col-span-2">
          {navLinks.map((link) => (
            <FooterLink key={link.href} href={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title="Materials" className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            {categories.map((c) => (
              <FooterLink key={c.slug} href={`/categories/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </div>
        </FooterColumn>

        <FooterColumn title="Visit & contact" className="lg:col-span-3">
          <address className="space-y-3 text-[14px] not-italic leading-relaxed text-ink/80">
            <p>{site.address}</p>
            <p>
              {site.days}
              <br />
              {site.hours}
            </p>
            <p>
              <a href={site.phoneHref} className="hover:text-accent-deep">
                {site.phoneDisplay}
              </a>
              <br />
              <a href={`mailto:${site.email}`} className="break-all hover:text-accent-deep">
                {site.email}
              </a>
            </p>
            <p>
              <a
                href={whatsappLink("Hello Space Craft, I would like to enquire about your materials.")}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-deep underline-offset-4 hover:underline"
              >
                Chat on WhatsApp
              </a>
            </p>
          </address>
        </FooterColumn>
      </div>

      {/* Oversized wordmark as a closing visual. */}
      <div aria-hidden="true" className="overflow-hidden border-t border-line">
        <p className="display select-none whitespace-nowrap text-center text-[19vw] leading-[0.85] text-beige">
          Space Craft
        </p>
      </div>

      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.copyrightYear} {site.legalName} · {site.fullName} · GSTIN {site.gstin}
          </p>
          <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-1">
            {legalPages.map((p) => (
              <Link key={p.slug} href={`/legal/${p.slug}`} className="hover:text-ink">
                {p.title.replace(" Policy", "").replace("Terms & Conditions", "Terms")}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <h2 className="eyebrow">{title}</h2>
      <div className="mt-6 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[14px] text-ink/80 transition-colors hover:text-accent-deep">
      {children}
    </Link>
  );
}
