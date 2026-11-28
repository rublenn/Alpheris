import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { legalPages, legalUpdated } from "@/lib/legal";
import { PageIntro } from "@/components/shop/bits";

export function generateStaticParams() {
  return legalPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  return page ? { title: page.title, description: page.summary } : { title: "Not found" };
}

export default function LegalPageRoute(props: PageProps<"/legal/[slug]">) {
  return (
    <Suspense fallback={<PageIntro title="Loading…" />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  const page = legalPages.find((p) => p.slug === slug);
  if (!page) notFound();
  return (
    <>
      <PageIntro crumbs={[{ label: page.title }]} eyebrow="Policies" title={page.title}>
        Last updated {legalUpdated}.
      </PageIntro>
      <section className="shell grid gap-12 py-12 lg:grid-cols-12 lg:py-16">
        <article className="legal max-w-3xl lg:col-span-8">{page.body}</article>
        <nav aria-label="Policies" className="lg:col-span-4">
          <ul className="space-y-3 border-l border-line pl-5 text-[14px]">
            {legalPages.map((p) => (
              <li key={p.slug}>
                <Link href={`/legal/${p.slug}`} aria-current={p.slug === page.slug ? "page" : undefined} className={p.slug === page.slug ? "text-accent-deep" : "text-muted hover:text-ink"}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </>
  );
}
