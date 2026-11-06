import type { Metadata } from "next";
import { ShopArchive } from "@/components/ShopArchive";
import { getProducts } from "@/lib/catalog";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="meta">02 / Available</p>
        <h1>Shop</h1>
        <p>
          {site.announce}. Purchases are completed on Shopier.{" "}
          {site.shippingNote}
        </p>
      </header>
      <ShopArchive items={getProducts()} />
    </div>
  );
}
