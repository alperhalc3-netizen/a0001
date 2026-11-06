import type { Metadata } from "next";
import { WorksArchive } from "@/components/WorksArchive";
import { getArtworks } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Works",
};

export default function WorksPage() {
  return (
    <div className="wrap" data-archive-page>
      <header className="page-head">
        <p className="meta">03 / Archive</p>
        <h1>Works</h1>
        <p>
          Drawings, printmaking, digital art, sculpture and objects.
          Tattoo work is documented separately.
        </p>
      </header>
      <WorksArchive items={getArtworks()} />
    </div>
  );
}
