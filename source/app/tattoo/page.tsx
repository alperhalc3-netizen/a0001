import type { Metadata } from "next";
import { TattooArchive } from "@/components/TattooArchive";
import { getTattoos } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tattoo",
};

export default function TattooPage() {
  return (
    <div className="wrap" data-archive-page>
      <header className="page-head">
        <p className="meta">01 / Practice</p>
        <h1>Tattoo</h1>
        <p>
          Selected tattoo work. Each piece is documented as its own entry.
        </p>
      </header>
      <TattooArchive pieces={getTattoos()} />
    </div>
  );
}
