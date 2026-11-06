"use client";

import { withBase } from "@/lib/basePath";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CLIENT_ADMIN_PASSWORD,
  ADMIN_SESSION_KEY,
} from "@/lib/admin/public-config";
import { slugify } from "@/lib/admin/slug";
import {
  shopCategories,
  site,
  workCategories,
  type Artwork,
  type Catalog,
  type Product,
  type ShopCategorySlug,
  type TattooPiece,
  type WorkCategorySlug,
} from "@/lib/content";
import styles from "./AdminApp.module.css";

type Tab = "works" | "tattoo" | "shop";
type Status = { kind: "ok" | "err" | "info"; text: string } | null;

const emptyCatalog: Catalog = { artworks: [], tattoos: [], products: [] };

export function AdminApp() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [tab, setTab] = useState<Tab>("works");
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (saved) {
      setPassword(saved);
      void unlock(saved, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function unlock(value: string, interactive: boolean) {
    const trimmed = value.trim();
    if (!trimmed) {
      setLoginError("Şifre gerekli.");
      return;
    }

    const clientOk = trimmed === CLIENT_ADMIN_PASSWORD;
    let apiOk = false;
    try {
      const res = await fetch("/api/admin/login/", {
        method: "POST",
        headers: { "x-admin-password": trimmed },
      });
      apiOk = res.ok;
    } catch {
      apiOk = false;
    }

    if (!clientOk && !apiOk) {
      setLoginError("Şifre yanlış.");
      setUnlocked(false);
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, trimmed);
    setPassword(trimmed);
    setApiAvailable(apiOk);
    setUnlocked(true);
    setLoginError("");
    await loadCatalog(trimmed, apiOk);
    if (interactive) {
      setStatus({
        kind: "info",
        text: apiOk
          ? "Giriş yapıldı. Kayıt ve görsel yükleme bu bilgisayarda çalışıyor."
          : "Panel açıldı. Bu canlı önizlemede kayıt sunucuya yazılamaz; yerelde npm run dev ile kaydedebilirsin.",
      });
    }
  }

  async function loadCatalog(secret: string, useApi: boolean) {
    if (useApi) {
      const res = await fetch("/api/admin/content/", {
        headers: { "x-admin-password": secret },
        cache: "no-store",
      });
      if (res.ok) {
        setCatalog(await res.json());
        return;
      }
    }
    const res = await fetch("/content.json", { cache: "no-store" });
    if (!res.ok) {
      setStatus({ kind: "err", text: "İçerik dosyası okunamadı." });
      return;
    }
    setCatalog(await res.json());
  }

  function logout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setUnlocked(false);
    setPassword("");
    setCatalog(emptyCatalog);
  }

  async function save() {
    setBusy(true);
    const next = normalize(catalog);
    setCatalog(next);

    if (apiAvailable) {
      try {
        const res = await fetch("/api/admin/content/", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            "x-admin-password": password,
          },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Kayıt başarısız.");
        }
        setStatus({
          kind: "ok",
          text: "Kaydedildi. Site sayfalarını yenileyince değişiklikleri görürsün.",
        });
        setBusy(false);
        return;
      } catch (error) {
        setStatus({
          kind: "err",
          text:
            error instanceof Error
              ? error.message
              : "Kayıt başarısız. JSON dosyasını indirebilirsin.",
        });
      }
    }

    downloadCatalog(next);
    setStatus({
      kind: "info",
      text: "Canlı önizlemede sunucuya yazılamıyor. content.json indirildi — bunu data/content.json ve public/content.json olarak koy, sonra npm run dev ile kaydet veya siteyi yeniden yükle.",
    });
    setBusy(false);
  }

  async function upload(
    collection: "works" | "tattoo" | "shop",
    file: File,
    onDone: (image: string, width: number, height: number) => void,
  ) {
    const size = await readImageSize(file);
    if (!apiAvailable) {
      setStatus({
        kind: "err",
        text: "Görsel yükleme sadece yerel olarak çalışır: klasörde npm run dev yaz, sonra http://localhost:3000/admin adresini aç.",
      });
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("collection", collection);
      const res = await fetch("/api/admin/upload/", {
        method: "POST",
        headers: { "x-admin-password": password },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Yükleme başarısız.");
      onDone(data.image, size.width, size.height);
      setStatus({
        kind: "ok",
        text: "Görsel yüklendi. Değişikliğin sitede görünmesi için Kaydet’e bas.",
      });
    } catch (error) {
      setStatus({
        kind: "err",
        text: error instanceof Error ? error.message : "Yükleme başarısız.",
      });
    } finally {
      setBusy(false);
    }
  }

  const list = useMemo(() => {
    if (tab === "works") return catalog.artworks;
    if (tab === "tattoo") return catalog.tattoos;
    return catalog.products;
  }, [catalog, tab]);

  if (!unlocked) {
    return (
      <div data-admin className={styles.shell}>
        <form
          className={styles.login}
          onSubmit={(event) => {
            event.preventDefault();
            void unlock(password, true);
          }}
        >
          <p className="meta">A/0001 / Admin</p>
          <h1>Admin</h1>
          <p>
            Works, Tattoo ve Shop içeriğini buradan düzenleyebilirsin. Varsayılan
            şifre <strong>a0001</strong>.
          </p>
          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {loginError ? <p className={styles.error}>{loginError}</p> : null}
          <button className="btn" type="submit">
            Giriş
          </button>
        </form>
      </div>
    );
  }

  return (
    <div data-admin className={styles.shell}>
      <header className={styles.top}>
        <div>
          <p className="meta">A/0001 / Admin</p>
          <h1>İçerik paneli</h1>
          <p className={styles.note}>
            {apiAvailable
              ? "Kayıt ve görsel yükleme açık."
              : "Canlı statik önizleme: düzenleyebilir ve JSON indirebilirsin. Kalıcı kayıt ve görsel yükleme için yerelde npm run dev çalıştır."}
          </p>
        </div>
        <div className={styles.actions}>
          <button className="btn" type="button" onClick={() => void save()} disabled={busy}>
            Kaydet
          </button>
          <button type="button" className={styles.textBtn} onClick={logout}>
            Çıkış
          </button>
        </div>
      </header>

      {status ? (
        <p className={status.kind === "err" ? styles.error : styles.info}>
          {status.text}
        </p>
      ) : null}

      <nav className={styles.tabs} aria-label="Collections">
        {(
          [
            ["works", `Works (${catalog.artworks.length})`],
            ["tattoo", `Tattoo (${catalog.tattoos.length})`],
            ["shop", `Shop (${catalog.products.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <p className={styles.count}>{list.length} kayıt</p>

      <div className={styles.list}>
        {tab === "works"
          ? catalog.artworks.map((item, index) => (
              <WorkEditor
                key={item.slug}
                item={item}
                index={index}
                total={catalog.artworks.length}
                disabled={busy}
                onChange={(next) =>
                  setCatalog((current) => ({
                    ...current,
                    artworks: current.artworks.map((row, rowIndex) =>
                      rowIndex === index ? next : row,
                    ),
                  }))
                }
                onMove={(dir) =>
                  setCatalog((current) => ({
                    ...current,
                    artworks: moveItem(current.artworks, index, dir),
                  }))
                }
                onDelete={() =>
                  setCatalog((current) => ({
                    ...current,
                    artworks: current.artworks.filter((_, rowIndex) => rowIndex !== index),
                  }))
                }
                onUpload={(file) =>
                  void upload("works", file, (image, width, height) =>
                    setCatalog((current) => ({
                      ...current,
                      artworks: current.artworks.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              image,
                              imageWidth: width,
                              imageHeight: height,
                              aspect: `${width} / ${height}`,
                            }
                          : row,
                      ),
                    })),
                  )
                }
              />
            ))
          : null}

        {tab === "tattoo"
          ? catalog.tattoos.map((item, index) => (
              <TattooEditor
                key={item.slug}
                item={item}
                index={index}
                total={catalog.tattoos.length}
                disabled={busy}
                onChange={(next) =>
                  setCatalog((current) => ({
                    ...current,
                    tattoos: current.tattoos.map((row, rowIndex) =>
                      rowIndex === index ? next : row,
                    ),
                  }))
                }
                onMove={(dir) =>
                  setCatalog((current) => ({
                    ...current,
                    tattoos: moveItem(current.tattoos, index, dir),
                  }))
                }
                onDelete={() =>
                  setCatalog((current) => ({
                    ...current,
                    tattoos: current.tattoos.filter((_, rowIndex) => rowIndex !== index),
                  }))
                }
                onUpload={(file) =>
                  void upload("tattoo", file, (image, width, height) =>
                    setCatalog((current) => ({
                      ...current,
                      tattoos: current.tattoos.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              image,
                              imageWidth: width,
                              imageHeight: height,
                              aspect: `${width} / ${height}`,
                            }
                          : row,
                      ),
                    })),
                  )
                }
              />
            ))
          : null}

        {tab === "shop"
          ? catalog.products.map((item, index) => (
              <ShopEditor
                key={item.slug}
                item={item}
                index={index}
                total={catalog.products.length}
                disabled={busy}
                onChange={(next) =>
                  setCatalog((current) => ({
                    ...current,
                    products: current.products.map((row, rowIndex) =>
                      rowIndex === index ? next : row,
                    ),
                  }))
                }
                onMove={(dir) =>
                  setCatalog((current) => ({
                    ...current,
                    products: moveItem(current.products, index, dir),
                  }))
                }
                onDelete={() =>
                  setCatalog((current) => ({
                    ...current,
                    products: current.products.filter((_, rowIndex) => rowIndex !== index),
                  }))
                }
                onUpload={(file) =>
                  void upload("shop", file, (image, width, height) =>
                    setCatalog((current) => ({
                      ...current,
                      products: current.products.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              image,
                              imageWidth: width,
                              imageHeight: height,
                              aspect: `${width} / ${height}`,
                            }
                          : row,
                      ),
                    })),
                  )
                }
              />
            ))
          : null}
      </div>

      <button
        type="button"
        className={styles.add}
        onClick={() =>
          setCatalog((current) =>
            tab === "works"
              ? { ...current, artworks: [...current.artworks, newArtwork(current.artworks.length)] }
              : tab === "tattoo"
                ? { ...current, tattoos: [...current.tattoos, newTattoo(current.tattoos.length)] }
                : { ...current, products: [...current.products, newProduct(current.products.length)] },
          )
        }
      >
        + Yeni ekle
      </button>
    </div>
  );
}

function WorkEditor({
  item,
  index,
  total,
  disabled,
  onChange,
  onMove,
  onDelete,
  onUpload,
}: {
  item: Artwork;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (item: Artwork) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <article className={styles.card}>
      <Preview image={item.image} title={item.title} />
      <div className={styles.fields}>
        <div className={styles.row}>
          <Field label="Başlık">
            <input
              value={item.title}
              onChange={(event) =>
                onChange({
                  ...item,
                  title: event.target.value,
                  slug: slugify(event.target.value) || item.slug,
                })
              }
            />
          </Field>
          <Field label="Kategori">
            <select
              value={item.category}
              onChange={(event) =>
                onChange({ ...item, category: event.target.value as WorkCategorySlug })
              }
            >
              {workCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className={styles.row}>
          <Field label="Yıl">
            <input
              type="number"
              value={item.year}
              onChange={(event) => onChange({ ...item, year: Number(event.target.value) })}
            />
          </Field>
          <Field label="Teknik">
            <input
              value={item.medium}
              onChange={(event) => onChange({ ...item, medium: event.target.value })}
            />
          </Field>
          <Field label="Ölçü">
            <input
              value={item.dimensions}
              onChange={(event) => onChange({ ...item, dimensions: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Açıklama">
          <textarea
            rows={3}
            value={item.description}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
          />
        </Field>
        <Toolbar
          featured={Boolean(item.featured)}
          index={index}
          total={total}
          disabled={disabled}
          onFeatured={(featured) => onChange({ ...item, featured })}
          onMove={onMove}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      </div>
    </article>
  );
}

function TattooEditor({
  item,
  index,
  total,
  disabled,
  onChange,
  onMove,
  onDelete,
  onUpload,
}: {
  item: TattooPiece;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (item: TattooPiece) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <article className={styles.card}>
      <Preview image={item.image} title={item.title} />
      <div className={styles.fields}>
        <div className={styles.row}>
          <Field label="Başlık">
            <input
              value={item.title}
              onChange={(event) =>
                onChange({
                  ...item,
                  title: event.target.value,
                  slug: slugify(event.target.value) || item.slug,
                })
              }
            />
          </Field>
          <Field label="Teknik">
            <input
              value={item.medium}
              onChange={(event) => onChange({ ...item, medium: event.target.value })}
            />
          </Field>
        </div>
        <Field label="Açıklama">
          <textarea
            rows={3}
            value={item.description}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
          />
        </Field>
        <Toolbar
          featured={Boolean(item.featured)}
          index={index}
          total={total}
          disabled={disabled}
          onFeatured={(featured) => onChange({ ...item, featured })}
          onMove={onMove}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      </div>
    </article>
  );
}

function ShopEditor({
  item,
  index,
  total,
  disabled,
  onChange,
  onMove,
  onDelete,
  onUpload,
}: {
  item: Product;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (item: Product) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <article className={styles.card}>
      <Preview image={item.image} title={item.title} />
      <div className={styles.fields}>
        <div className={styles.row}>
          <Field label="Başlık">
            <input
              value={item.title}
              onChange={(event) =>
                onChange({
                  ...item,
                  title: event.target.value,
                  slug: slugify(event.target.value) || item.slug,
                })
              }
            />
          </Field>
          <Field label="Kategori">
            <select
              value={item.category}
              onChange={(event) =>
                onChange({ ...item, category: event.target.value as ShopCategorySlug })
              }
            >
              {shopCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className={styles.row}>
          <Field label="Fiyat (TL)">
            <input
              type="number"
              value={item.priceTRY}
              onChange={(event) => onChange({ ...item, priceTRY: Number(event.target.value) })}
            />
          </Field>
          <Field label="Stok">
            <input
              type="number"
              value={item.stock}
              onChange={(event) => onChange({ ...item, stock: Number(event.target.value) })}
            />
          </Field>
          <Field label="Durum">
            <select
              value={item.availability}
              onChange={(event) =>
                onChange({
                  ...item,
                  availability: event.target.value as Product["availability"],
                })
              }
            >
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Sold">Sold</option>
            </select>
          </Field>
        </div>
        <Field label="Açıklama">
          <textarea
            rows={3}
            value={item.description}
            onChange={(event) => onChange({ ...item, description: event.target.value })}
          />
        </Field>
        <Field label="Shopier linki">
          <input
            value={item.purchaseUrl}
            onChange={(event) => onChange({ ...item, purchaseUrl: event.target.value })}
          />
        </Field>
        <Toolbar
          featured={Boolean(item.featured)}
          index={index}
          total={total}
          disabled={disabled}
          onFeatured={(featured) => onChange({ ...item, featured })}
          onMove={onMove}
          onDelete={onDelete}
          onUpload={onUpload}
        />
      </div>
    </article>
  );
}

function Toolbar({
  featured,
  index,
  total,
  disabled,
  onFeatured,
  onMove,
  onDelete,
  onUpload,
}: {
  featured: boolean;
  index: number;
  total: number;
  disabled: boolean;
  onFeatured: (value: boolean) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className={styles.toolbar}>
      <label className={styles.check}>
        <input
          type="checkbox"
          checked={featured}
          onChange={(event) => onFeatured(event.target.checked)}
        />
        Öne çıkar
      </label>
      <label className={styles.upload}>
        Görsel yükle
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
      </label>
      <button type="button" disabled={index === 0} onClick={() => onMove(-1)}>
        Yukarı
      </button>
      <button type="button" disabled={index === total - 1} onClick={() => onMove(1)}>
        Aşağı
      </button>
      <button type="button" className={styles.danger} onClick={onDelete}>
        Sil
      </button>
    </div>
  );
}

function Preview({ image, title }: { image: string; title: string }) {
  return (
    <div className={styles.preview}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={withBase(image)} alt={title} />
      ) : (
        <span>Görsel yok</span>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      {label}
      {children}
    </label>
  );
}

function moveItem<T>(items: T[], index: number, dir: -1 | 1) {
  const next = [...items];
  const target = index + dir;
  if (target < 0 || target >= next.length) return items;
  const [row] = next.splice(index, 1);
  next.splice(target, 0, row);
  return next.map((item, order) => ({ ...item, order: order + 1 }));
}

function normalize(catalog: Catalog): Catalog {
  return {
    artworks: uniqueSlugs(catalog.artworks).map((item, index) => ({
      ...item,
      order: index + 1,
      slug: item.slug || slugify(item.title) || `work-${index + 1}`,
    })),
    tattoos: uniqueSlugs(catalog.tattoos).map((item, index) => ({
      ...item,
      order: index + 1,
      slug: item.slug || slugify(item.title) || `tattoo-${index + 1}`,
    })),
    products: uniqueSlugs(catalog.products).map((item, index) => ({
      ...item,
      order: index + 1,
      shippingNote: item.shippingNote || site.shippingNote,
      slug: item.slug || slugify(item.title) || `product-${index + 1}`,
    })),
  };
}

function uniqueSlugs<T extends { slug: string; title: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.map((item, index) => {
    let slug = item.slug || slugify(item.title) || `item-${index + 1}`;
    if (seen.has(slug)) slug = `${slug}-${index + 1}`;
    seen.add(slug);
    return { ...item, slug };
  });
}

function newArtwork(count: number): Artwork {
  return {
    slug: `work-${Date.now()}`,
    title: "New work",
    year: new Date().getFullYear(),
    category: "drawings",
    medium: "",
    dimensions: "",
    description: "",
    aspect: "1 / 1",
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    featured: false,
    order: count + 1,
  };
}

function newTattoo(count: number): TattooPiece {
  return {
    slug: `tattoo-${Date.now()}`,
    title: "New tattoo",
    medium: "Tattoo",
    description: "",
    aspect: "1 / 1",
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    featured: false,
    order: count + 1,
  };
}

function newProduct(count: number): Product {
  return {
    slug: `product-${Date.now()}`,
    title: "New piece",
    category: "limited-edition-prints",
    priceTRY: 0,
    stock: 1,
    availability: "Available",
    shippingNote: site.shippingNote,
    description: site.announce,
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    purchaseUrl: site.shopUrl,
    featured: false,
    aspect: "1 / 1",
    order: count + 1,
  };
}

function downloadCatalog(catalog: Catalog) {
  const blob = new Blob([`${JSON.stringify(catalog, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "content.json";
  link.click();
  URL.revokeObjectURL(url);
}

function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1000,
        height: image.naturalHeight || 1000,
      });
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1000, height: 1000 });
    };
    image.src = url;
  });
}
