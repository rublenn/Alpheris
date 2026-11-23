import { getFeaturedProducts } from "@/lib/shop";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/shop/ProductCard";

export async function Products() {
  const products = await getFeaturedProducts(8);
  if (!products.length) return null;
  const anySample = products.some((p) => p.isSample);

  return (
    <section id="products" className="py-24 lg:py-36">
      <div className="shell">
        <SectionHeader index="03" eyebrow="Featured products" title="A closer look at the *collection.*">
          Prices, options and stock — order online or ask us on WhatsApp.
          {anySample && (
            <span className="mt-3 block text-[13px] text-accent-deep">
              Some products shown are samples with illustrated textures. Real products, photos and prices will
              replace them.
            </span>
          )}
        </SectionHeader>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {products.map((product, i) => (
            <li key={product.id}>
              <Reveal delay={(i % 4) * 0.07}>
                <ProductCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>
        <div className="mt-16 flex justify-center">
          <Button href="/search" variant="outline">See all products</Button>
        </div>
      </div>
    </section>
  );
}
