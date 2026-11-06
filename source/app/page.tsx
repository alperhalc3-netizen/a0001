import { HomeExperience } from "@/components/HomeExperience";
import { featuredProducts, featuredTattoos, getArtworks, getProducts } from "@/lib/catalog";

function isTattooFree(item: { slug: string; title: string; category: string; description: string }) {
  const blob = `${item.slug} ${item.title} ${item.category} ${item.description}`.toLowerCase();
  return !blob.includes("tatt") && !blob.includes("dövm") && !blob.includes("dovme") && !blob.includes("dövme");
}

export default function HomePage() {
  const works = getArtworks().filter((item) => Boolean(item.image) && isTattooFree(item));
  const featured = featuredProducts();
  const products = featured.length ? featured : getProducts();

  return <HomeExperience works={works} tattoos={featuredTattoos(3)} products={products} />;
}
