export const SECTION_IDS = ["hero", "newDrop", "works", "tattoo", "shop", "outro"] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export type EditorSettings = {
  schema: 1;
  text: {
    name: string;
    tagline: string;
    announce: string;
    newDropLabel: string;
    outroTitle: string;
  };
  theme: {
    ink: string;
    paper: string;
  };
  motion: {
    reveal: boolean;
    brush: boolean;
    dab: boolean;
    durationMs: number;
  };
  layout: {
    pagePad: string;
    columnGapRem: number;
    plateMaxVw: number;
    dropThumbPx: number;
    dropWeight: number;
    dropSizeRem: number;
    logoHeightRem: number;
    announceSizeRem: number | null;
    announceWeight: number;
    headerWeight: number;
  };
  sections: SectionId[];
  hidden: SectionId[];
  newDropSlug: string;
  newDropImage: string | null;
  worksOrder: string[];
  shopOrder: string[];
};

export type EditorDraft = {
  schema: 1;
  settings: EditorSettings;
  localImages: {
    newDrop?: string;
  };
};
