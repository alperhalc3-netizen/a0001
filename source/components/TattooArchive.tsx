import { ArchiveCard } from "@/components/ArchiveCard";
import type { TattooPiece } from "@/lib/content";

type Props = {
  pieces: readonly TattooPiece[];
};

export function TattooArchive({ pieces }: Props) {
  return (
    <div className="archive-grid equal-tiles archive-vertical" data-layout="shop">
      {pieces.map((item, index) => (
        <ArchiveCard
          key={item.slug}
          href={`/tattoo/${item.slug}`}
          title={item.title}
          label="Tattoo"
          meta={item.medium}
          aspect={item.aspect}
          image={item.image}
          imageWidth={item.imageWidth}
          imageHeight={item.imageHeight}
          delay={Math.min(index * 60, 300)}
        />
      ))}
    </div>
  );
}
