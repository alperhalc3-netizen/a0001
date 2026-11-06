"use client";

import { useEffect, useRef, useState } from "react";
import { basePath } from "@/lib/basePath";
import { products, artworks } from "@/lib/content";
import { cloneSettings, publishedSettings } from "@/lib/editor/published";
import { SECTION_IDS, type EditorSettings, type SectionId } from "@/lib/editor/types";
import { parseDraft, parseSettings } from "@/lib/editor/validate";
import styles from "./EditorApp.module.css";

const DRAFT_KEY = "a0001.editor.draft.v1";

const SECTION_LABEL: Record<SectionId, string> = {
  hero: "Açılış",
  newDrop: "New Drop",
  works: "İşler",
  tattoo: "Dövme",
  shop: "Dükkan",
  outro: "Kapanış",
};

type Snap = {
  settings: EditorSettings;
  localImages: { newDrop?: string };
};

function download(settings: EditorSettings) {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "a0001-editor-settings.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function EditorApp() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [snap, setSnap] = useState<Snap>({
    settings: cloneSettings(publishedSettings),
    localImages: {},
  });
  const [past, setPast] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("Taslak yalnızca bu tarayıcıdadır. Canlı site değişmez.");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "phone">("desktop");

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = parseDraft(JSON.parse(raw));
        if (parsed.ok) setSnap({ settings: parsed.draft.settings, localImages: parsed.draft.localImages });
        else setNote(parsed.error);
      } catch {
        setNote("Kayıtlı taslak okunamadı. Yayınlanmış görünüm kullanılıyor.");
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ schema: 1, settings: snap.settings, localImages: snap.localImages }),
    );
    frameRef.current?.contentWindow?.postMessage(
      {
        type: "a0001-preview-settings",
        settings: snap.settings,
        localImage: snap.localImages.newDrop ?? null,
      },
      window.location.origin,
    );
  }, [snap, ready]);

  function commit(next: Snap) {
    setPast((items) => [...items, snap].slice(-50));
    setFuture([]);
    setSnap(next);
    setNote("Taslak bu tarayıcıya kaydedildi. Canlı site değişmedi.");
  }

  function change(mutate: (settings: EditorSettings) => EditorSettings) {
    commit({ settings: mutate(cloneSettings(snap.settings)), localImages: snap.localImages });
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [snap, ...items]);
    setSnap(previous);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, snap].slice(-50));
    setSnap(next);
  }

  function moveSection(index: number, direction: -1 | 1) {
    change((settings) => {
      const sections = [...settings.sections];
      const target = index + direction;
      if (target < 0 || target >= sections.length) return settings;
      const [item] = sections.splice(index, 1);
      sections.splice(target, 0, item);
      return { ...settings, sections };
    });
  }

  function moveSlug(list: "worksOrder" | "shopOrder", source: string[], index: number, direction: -1 | 1) {
    change((settings) => {
      const order = settings[list].length ? [...settings[list]] : [...source];
      const target = index + direction;
      if (target < 0 || target >= order.length) return settings;
      const [item] = order.splice(index, 1);
      order.splice(target, 0, item);
      return { ...settings, [list]: order };
    });
  }

  const workIds = snap.settings.worksOrder.length
    ? snap.settings.worksOrder.filter((slug) => artworks.some((item) => item.slug === slug))
    : artworks.map((item) => item.slug);
  const shopIds = snap.settings.shopOrder.length
    ? snap.settings.shopOrder.filter((slug) => products.some((item) => item.slug === slug))
    : products.map((item) => item.slug);

  return (
    <div className={styles.shell} data-no-brush>
      <aside className={styles.panel}>
        <header className={styles.head}>
          <h1>Görsel düzenleyici</h1>
          <p>{note}</p>
        </header>
        <div className={styles.row}>
          <button type="button" onClick={undo} disabled={!past.length}>Geri al</button>
          <button type="button" onClick={redo} disabled={!future.length}>Yinele</button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm("Taslak silinsin ve yayınlanmış görünüme dönülsün mü?")) return;
              localStorage.removeItem(DRAFT_KEY);
              setPast([]);
              setFuture([]);
              setSnap({ settings: cloneSettings(publishedSettings), localImages: {} });
              setNote("Yayınlanmış görünüme dönüldü. Canlı site zaten bu ayarları kullanıyor.");
            }}
          >
            Sıfırla
          </button>
        </div>

        <section>
          <h2>Bölüm sırası ve görünürlük</h2>
          <ol className={styles.list}>
            {snap.settings.sections.map((id, index) => (
              <li key={id}>
                <label>
                  <input
                    type="checkbox"
                    checked={!snap.settings.hidden.includes(id)}
                    onChange={() =>
                      change((settings) => ({
                        ...settings,
                        hidden: settings.hidden.includes(id)
                          ? settings.hidden.filter((item) => item !== id)
                          : [...settings.hidden, id],
                      }))
                    }
                  />
                  {SECTION_LABEL[id]}
                </label>
                <span>
                  <button type="button" onClick={() => moveSection(index, -1)} aria-label="Yukarı">
                    ↑
                  </button>
                  <button type="button" onClick={() => moveSection(index, 1)} aria-label="Aşağı">
                    ↓
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2>New Drop</h2>
          <label>
            Ürün
            <select
              value={snap.settings.newDropSlug}
              onChange={(event) => change((settings) => ({ ...settings, newDropSlug: event.target.value }))}
            >
              {products.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Yazı
            <input
              value={snap.settings.text.newDropLabel}
              maxLength={40}
              onChange={(event) =>
                change((settings) => ({ ...settings, text: { ...settings.text, newDropLabel: event.target.value } }))
              }
            />
          </label>
          <label>
            Küçük görsel {snap.settings.layout.dropThumbPx}px
            <input
              type="range"
              min={24}
              max={96}
              value={snap.settings.layout.dropThumbPx}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, dropThumbPx: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Yazı puntosu {snap.settings.layout.dropSizeRem}
            <input
              type="range"
              min={0.7}
              max={2}
              step={0.05}
              value={snap.settings.layout.dropSizeRem}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, dropSizeRem: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Yazı kalınlığı {snap.settings.layout.dropWeight}
            <input
              type="range"
              min={400}
              max={700}
              step={100}
              value={snap.settings.layout.dropWeight}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, dropWeight: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Mevcut görsel yolu
            <select
              value={snap.settings.newDropImage ?? ""}
              onChange={(event) =>
                change((settings) => ({ ...settings, newDropImage: event.target.value || null }))
              }
            >
              <option value="">Ürünün kendi görseli</option>
              {products.map((item) => (
                <option key={item.image} value={item.image}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Yerel önizleme görseli
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (file.size > 300_000) {
                  setNote("Görsel 300 KB üstünde. Yayın dosyasına gömülmez; daha küçük bir dosya seçin.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const value = String(reader.result || "");
                  if (!value.startsWith("data:image/")) return;
                  commit({ settings: snap.settings, localImages: { newDrop: value } });
                  setNote("Görsel yalnız bu tarayıcıdaki önizlemede. Dışa aktarılan dosyaya yazılmaz.");
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </section>

        <section>
          <h2>Metin</h2>
          {(
            [
              ["name", "Ad", 40],
              ["tagline", "Slogan", 120],
              ["announce", "Duyuru", 240],
              ["outroTitle", "Kapanış", 40],
            ] as const
          ).map(([key, label, max]) => (
            <label key={key}>
              {label}
              <input
                value={snap.settings.text[key]}
                maxLength={max}
                onChange={(event) =>
                  change((settings) => ({ ...settings, text: { ...settings.text, [key]: event.target.value } }))
                }
              />
            </label>
          ))}
        </section>

        <section>
          <h2>Renk ve boyut</h2>
          <label>
            Mürekkep
            <input
              type="color"
              value={snap.settings.theme.ink}
              onChange={(event) =>
                change((settings) => ({ ...settings, theme: { ...settings.theme, ink: event.target.value } }))
              }
            />
          </label>
          <label>
            Kâğıt
            <input
              type="color"
              value={snap.settings.theme.paper}
              onChange={(event) =>
                change((settings) => ({ ...settings, theme: { ...settings.theme, paper: event.target.value } }))
              }
            />
          </label>
          <label>
            Logo yüksekliği {snap.settings.layout.logoHeightRem}rem
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={snap.settings.layout.logoHeightRem}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, logoHeightRem: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            İş görseli {snap.settings.layout.plateMaxVw}vw
            <input
              type="range"
              min={20}
              max={80}
              value={snap.settings.layout.plateMaxVw}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, plateMaxVw: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Sütun aralığı {snap.settings.layout.columnGapRem}rem
            <input
              type="range"
              min={0.2}
              max={4}
              step={0.1}
              value={snap.settings.layout.columnGapRem}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, columnGapRem: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Sayfa boşluğu
            <input
              value={snap.settings.layout.pagePad}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, pagePad: event.target.value },
                }))
              }
            />
          </label>
          <label>
            Başlık kalınlığı {snap.settings.layout.headerWeight}
            <input
              type="range"
              min={400}
              max={800}
              step={100}
              value={snap.settings.layout.headerWeight}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, headerWeight: Number(event.target.value) },
                }))
              }
            />
          </label>
          <label>
            Duyuru kalınlığı {snap.settings.layout.announceWeight}
            <input
              type="range"
              min={300}
              max={800}
              step={100}
              value={snap.settings.layout.announceWeight}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  layout: { ...settings.layout, announceWeight: Number(event.target.value) },
                }))
              }
            />
          </label>
        </section>

        <section>
          <h2>Hareket</h2>
          {(
            [
              ["reveal", "Belirme"],
              ["brush", "Gezinen fırça"],
              ["dab", "Küçük tıklama izi"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={snap.settings.motion[key]}
                onChange={(event) =>
                  change((settings) => ({
                    ...settings,
                    motion: { ...settings.motion, [key]: event.target.checked },
                  }))
                }
              />
              {label}
            </label>
          ))}
          <label>
            Süre {snap.settings.motion.durationMs}ms
            <input
              type="range"
              min={200}
              max={1600}
              step={50}
              value={snap.settings.motion.durationMs}
              onChange={(event) =>
                change((settings) => ({
                  ...settings,
                  motion: { ...settings.motion, durationMs: Number(event.target.value) },
                }))
              }
            />
          </label>
        </section>

        <section>
          <h2>İş ve ürün sırası</h2>
          <ol className={styles.list}>
            {workIds.map((slug, index) => (
              <li key={slug}>
                <span>{artworks.find((item) => item.slug === slug)?.title ?? slug}</span>
                <span>
                  <button type="button" onClick={() => moveSlug("worksOrder", workIds, index, -1)}>↑</button>
                  <button type="button" onClick={() => moveSlug("worksOrder", workIds, index, 1)}>↓</button>
                </span>
              </li>
            ))}
          </ol>
          <ol className={styles.list}>
            {shopIds.map((slug, index) => (
              <li key={slug}>
                <span>{products.find((item) => item.slug === slug)?.title ?? slug}</span>
                <span>
                  <button type="button" onClick={() => moveSlug("shopOrder", shopIds, index, -1)}>↑</button>
                  <button type="button" onClick={() => moveSlug("shopOrder", shopIds, index, 1)}>↓</button>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2>Dosya</h2>
          <div className={styles.row}>
            <button type="button" onClick={() => download(snap.settings)}>Dışa aktar</button>
            <label className={styles.file}>
              İçe aktar
              <input
                type="file"
                accept="application/json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    try {
                      const parsed = parseSettings(JSON.parse(String(reader.result)));
                      if (!parsed.ok) {
                        setNote(parsed.error);
                        return;
                      }
                      commit({ settings: parsed.settings, localImages: {} });
                      setNote("İçe aktarıldı. Bu hâlâ yerel taslak; canlı site değişmedi.");
                    } catch {
                      setNote("JSON okunamadı.");
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        </section>

        <section className={styles.publish} aria-labelledby="publish-title">
          <h2 id="publish-title">Yayınlama kullanılamıyor</h2>
          <button type="button" disabled>
            Yayınla
          </button>
          <p>
            Bu düğme kasıtlı olarak kapalı. Tarayıcı taslağı ve localStorage canlı GitHub Pages sitesini değiştirmez.
            Parola veya token burada istenmez. Yayın için dışa aktarılan şema 1 dosyasını
            source/data/editor-settings.json olarak repoya koyup main dalına göndermek gerekir. Mevcut GitHub Actions
            derlemesi o dosyayı siteye işler.
          </p>
        </section>
      </aside>
      <div className={styles.stage}>
        <div className={styles.row}>
          <button type="button" onClick={() => setViewport("desktop")} aria-pressed={viewport === "desktop"}>Masaüstü</button>
          <button type="button" onClick={() => setViewport("tablet")} aria-pressed={viewport === "tablet"}>Tablet</button>
          <button type="button" onClick={() => setViewport("phone")} aria-pressed={viewport === "phone"}>Telefon</button>
        </div>
        <iframe
          ref={frameRef}
          className={styles.frame}
          style={{ width: viewport === "desktop" ? "100%" : viewport === "tablet" ? "820px" : "390px" }}
          title="Canlı önizleme"
          src={`${basePath}/preview/`}
          onLoad={() => {
            frameRef.current?.contentWindow?.postMessage(
              {
                type: "a0001-preview-settings",
                settings: snap.settings,
                localImage: snap.localImages.newDrop ?? null,
              },
              window.location.origin,
            );
          }}
        />
      </div>
      <span className={styles.sr}>{SECTION_IDS.join(" ")}</span>
    </div>
  );
}
