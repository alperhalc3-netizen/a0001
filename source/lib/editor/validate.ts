import { SECTION_IDS, type EditorDraft, type EditorSettings, type SectionId } from "./types";

const SLUG = /^[a-z0-9-]{1,80}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;
const PATH = /^\/(?:brand|shop|tattoo|works|uploads)\/[A-Za-z0-9._/-]+$/;
const PAD = /^(?:clamp\([0-9.,%\sa-z]+\)|[0-9.]+(?:rem|px|vw))$/;

export type ParseResult =
  | { ok: true; settings: EditorSettings }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} metin olmalı.`);
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) throw new Error(`${label} 1–${max} karakter olmalı.`);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(trimmed)) {
    throw new Error(`${label} denetim karakteri içeremez.`);
  }
  return trimmed;
}

function num(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} sayı olmalı.`);
  if (value < min || value > max) throw new Error(`${label} ${min}–${max} aralığında olmalı.`);
  return value;
}

function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} açık veya kapalı olmalı.`);
  return value;
}

function slugs(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${label} liste olmalı.`);
  if (value.length > 80) throw new Error(`${label} çok uzun.`);
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !SLUG.test(item)) throw new Error(`${label} geçersiz kayıt içeriyor.`);
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function sections(value: unknown): SectionId[] {
  if (!Array.isArray(value) || value.length !== SECTION_IDS.length) {
    throw new Error("Bölüm sırası eksik.");
  }
  const out: SectionId[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !SECTION_IDS.includes(item as SectionId)) {
      throw new Error("Bilinmeyen bölüm.");
    }
    const id = item as SectionId;
    if (out.includes(id)) throw new Error("Bölüm tekrarı.");
    out.push(id);
  }
  return out;
}

export function parseSettings(input: unknown): ParseResult {
  try {
    if (!isRecord(input)) return { ok: false, error: "Ayar dosyası nesne olmalı." };
    if (input.schema !== 1) return { ok: false, error: "Desteklenen şema yalnızca 1." };
    const textBlock = input.text;
    const theme = input.theme;
    const motion = input.motion;
    const layout = input.layout;
    if (!isRecord(textBlock) || !isRecord(theme) || !isRecord(motion) || !isRecord(layout)) {
      return { ok: false, error: "Ayar dosyasında eksik grup var." };
    }
    if (typeof layout.pagePad !== "string" || !PAD.test(layout.pagePad) || layout.pagePad.length > 80) {
      return { ok: false, error: "Sayfa boşluğu geçersiz." };
    }
    let announceSize: number | null = null;
    if (layout.announceSizeRem !== null && layout.announceSizeRem !== undefined) {
      announceSize = num(layout.announceSizeRem, 0.6, 3, "Duyuru punto");
    }
    let image: string | null = null;
    if (input.newDropImage !== null && input.newDropImage !== undefined) {
      if (typeof input.newDropImage !== "string" || input.newDropImage.startsWith("data:")) {
        return { ok: false, error: "Yerel görsel verisi yayın dosyasına yazılamaz." };
      }
      if (!PATH.test(input.newDropImage) || input.newDropImage.includes("..")) {
        return { ok: false, error: "New Drop görsel yolu geçersiz." };
      }
      image = input.newDropImage;
    }
    if (typeof input.newDropSlug !== "string" || !SLUG.test(input.newDropSlug)) {
      return { ok: false, error: "New Drop ürün kaydı geçersiz." };
    }
    const hiddenRaw = input.hidden;
    if (!Array.isArray(hiddenRaw)) return { ok: false, error: "Gizli bölüm listesi geçersiz." };
    const hidden: SectionId[] = [];
    for (const item of hiddenRaw) {
      if (typeof item !== "string" || !SECTION_IDS.includes(item as SectionId)) {
        return { ok: false, error: "Gizli bölüm geçersiz." };
      }
      const id = item as SectionId;
      if (!hidden.includes(id)) hidden.push(id);
    }
    const settings: EditorSettings = {
      schema: 1,
      text: {
        name: text(textBlock.name, 40, "Ad"),
        tagline: text(textBlock.tagline, 120, "Slogan"),
        announce: text(textBlock.announce, 240, "Duyuru"),
        newDropLabel: text(textBlock.newDropLabel, 40, "New Drop yazısı"),
        outroTitle: text(textBlock.outroTitle, 40, "Kapanış"),
      },
      theme: {
        ink: typeof theme.ink === "string" && COLOR.test(theme.ink) ? theme.ink.toLowerCase() : "",
        paper: typeof theme.paper === "string" && COLOR.test(theme.paper) ? theme.paper.toLowerCase() : "",
      },
      motion: {
        reveal: bool(motion.reveal, "Belirme"),
        brush: bool(motion.brush, "Fırça"),
        dab: bool(motion.dab, "Tıklama izi"),
        durationMs: num(motion.durationMs, 200, 1600, "Süre"),
      },
      layout: {
        pagePad: layout.pagePad,
        columnGapRem: num(layout.columnGapRem, 0.2, 4, "Sütun aralığı"),
        plateMaxVw: num(layout.plateMaxVw, 20, 80, "Görsel genişliği"),
        dropThumbPx: num(layout.dropThumbPx, 24, 96, "Küçük görsel"),
        dropWeight: num(layout.dropWeight, 400, 700, "New Drop kalınlığı"),
        dropSizeRem: num(layout.dropSizeRem, 0.7, 2, "New Drop puntosu"),
        logoHeightRem: num(layout.logoHeightRem, 1, 4, "Logo yüksekliği"),
        announceSizeRem: announceSize,
        announceWeight: num(layout.announceWeight, 300, 800, "Duyuru kalınlığı"),
        headerWeight: num(layout.headerWeight, 400, 800, "Başlık kalınlığı"),
      },
      sections: sections(input.sections),
      hidden,
      newDropSlug: input.newDropSlug,
      newDropImage: image,
      worksOrder: slugs(input.worksOrder, "İş sırası"),
      shopOrder: slugs(input.shopOrder, "Ürün sırası"),
    };
    if (!COLOR.test(settings.theme.ink) || !COLOR.test(settings.theme.paper)) {
      return { ok: false, error: "Renk #rrggbb olmalı." };
    }
    return { ok: true, settings };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ayar dosyası okunamadı." };
  }
}

export function parseDraft(input: unknown): { ok: true; draft: EditorDraft } | { ok: false; error: string } {
  if (!isRecord(input)) return { ok: false, error: "Taslak nesne olmalı." };
  const parsed = parseSettings(input.settings ?? input);
  if (!parsed.ok) return parsed;
  const localImages: EditorDraft["localImages"] = {};
  if (isRecord(input.localImages) && typeof input.localImages.newDrop === "string") {
    const value = input.localImages.newDrop;
    if (value.startsWith("data:image/") && value.length < 380_000) localImages.newDrop = value;
  }
  return { ok: true, draft: { schema: 1, settings: parsed.settings, localImages } };
}
