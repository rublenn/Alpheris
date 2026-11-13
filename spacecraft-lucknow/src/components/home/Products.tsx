import { products } from "@/lib/catalog";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/ui/Reveal";
import { ProductCard } from "./ProductCard";

export function Products() {
  return (
    <section id="products" className="py-24 lg:py-36">
      <div className="shell">
        <SectionHeader index="03" eyebrow="Featured products" title="A closer look at the *collection.*">
          A preview of how products will be presented.
          <span className="mt-3 block text-[13px] text-accent-deep">
            These are sample products with illustrated textures. Real products, photos and prices
            will replace them. Online ordering arrives in a later phase — for now, “Enquire” opens
            WhatsApp.
          </span>
        </SectionHeader>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
          {products.map((product, i) => (
            <li key={product.slug}>
              <Reveal delay={(i % 4) * 0.07}>
                <ProductCard product={product} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
