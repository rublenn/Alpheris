import { SceneBackground } from "@/components/home/SceneBackground";
import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { Brands } from "@/components/home/Brands";
import { Products } from "@/components/home/Products";
import { WhySpaceCraft } from "@/components/home/WhySpaceCraft";
import { Work } from "@/components/home/Work";
import { About } from "@/components/home/About";
import { Location } from "@/components/home/Location";
import { Enquiry } from "@/components/home/Enquiry";
import { site } from "@/lib/site";

// Structured data helps Google understand the business. Only confirmed facts.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeGoodsStore",
  name: site.fullName,
  description: site.description,
  telephone: "+918882226272",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lucknow",
    addressRegion: "Uttar Pradesh",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.location.coordinates[1],
    longitude: site.location.coordinates[0],
  },
  hasMap: site.location.mapsUrl,
  openingHours: "Mo-Su 09:00-21:00",
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SceneBackground />
      <Hero />
      <Categories />
      <Brands />
      <Products />
      <WhySpaceCraft />
      <Work />
      <About />
      <Location />
      <Enquiry />
    </>
  );
}
