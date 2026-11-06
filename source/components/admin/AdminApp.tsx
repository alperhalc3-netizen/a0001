"use client";

import { withBase } from "@/lib/basePath";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PUBLIC_ADMIN_PASSWORD,
  SESSION_KEY,
} from "@/lib/admin/password";
import { slugify, uniqueSlug } from "@/lib/admin/slug";
import {
  aspectFromSize,
  shopCategories,
  workCategories,
  type Artwork,
  type Availability,
  type Catalog,
  type Product,
  type ShopCategorySlug,
  type TattooPiece,
  type WorkCategorySlug,
} from "@/lib/content";
import styles from "./AdminApp.module.css";

type Tab = "artworks" | "tattoos" | "products";
type Draft = Artwork | TattooPiece | Product;

const TABS: { id: Tab; label: string; upload: "works" | "tattoo" | "shop" }[] = [
  { id: "artworks", label: "Works", upload: "works" },
  { id: "tattoos", label: "Tattoo", upload: "tattoo" },
  { id: "products", label: "Shop", upload: "shop" },
];

function emptyCatalog(): Catalog {
  return { artworks: [], tattoos: [], products: [] };
}

function blankArtwork(order: number): Artwork {
  const year = new Date().getFullYear();
  return {
    slug: "",
    title: "",
    year,
    category: "drawings",
    medium: "",
    dimensions: "",
    description: "",
    aspect: "1 / 1",
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    featured: false,
    order,
  };
}

function blankTattoo(order: number): TattooPiece {
  return {
    slug: "",
    title: "",
    medium: "Tattoo",
    description: "",
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    aspect: "1 / 1",
    featured: false,
    order,
  };
}

function blankProduct(order: number): Product {
  return {
    slug: "",
    title: "",
    category: "limited-edition-prints",
    priceTRY: 0,
    stock: 1,
    availability: "Available",
    shippingNote: "",
    description: "",
    image: "",
    imageWidth: 1000,
    imageHeight: 1000,
    purchaseUrl: "",
    featured: false,
    aspect: "1 / 1",
    order,
  };
}

function blankItem(tab: Tab, order: number): Draft {
  if (tab === "artworks") return blankArtwork(order);
  if (tab === "tattoos") return blankTattoo(order);
  return blankProduct(order);
}

function sortItems<T extends { order: number; title: string }>(items: T[]) {
  return [...items].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function reindex<T extends { order: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

async function loginAgainstApi(password: string) {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "x-admin-password": password },
    });
    if (res.ok) return { remote: true as const, ok: true };
    if (res.status === 401) return { remote: true as const, ok: false };
  } catch {
    /* static host */
  }
  return { remote: false as const, ok: password === PUBLIC_ADMIN_PASSWORD };
}

function downloadJson(catalog: Catalog) {
  const blob = new Blob([`${JSON.stringify(catalog, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "content.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function withSlugs<T extends { slug: string; title: string; order: number }>(
  items: T[],
  key: string,
): T[] {
  const used: string[] = [];
  return items.map((item, index) => {
    const base = item.slug || item.title || `${key}-${index + 1}`;
    const slug = uniqueSlug(base, used);
    used.push(slug);
    return { ...item, slug, order: index + 1 };
  });
}

function ensureSlugs(catalog: Catalog): Catalog {
  return {
    artworks: withSlugs(catalog.artworks, "artworks"),
    tattoos: withSlugs(catalog.tattoos, "tattoos"),
    products: withSlugs(catalog.products, "products"),
  };
}

export function AdminApp() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [remote, setRemote] = useState(false);
  const [catalog, setCatalog] = useState<Catalog>(emptyCatalog);
  const [tab, setTab] = useState<Tab>("artworks");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const items = catalog[tab];
  const uploadCollection = TABS.find((item) => item.id === tab)?.upload ?? "works";

  const load = useCallback(async (pw: string, canRemote: boolean) => {
    setBusy(true);
    setStatus("");
    try {
      if (canRemote) {
        const res = await fetch("/api/admin/content", {
          headers: { "x-admin-password": pw },
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as Catalog;
          setCatalog({
            artworks: sortItems(data.artworks ?? []),
            tattoos: sortItems(data.tattoos ?? []),
            products: sortItems(data.products ?? []),
          });
          return;
        }
      }
      const res = await fetch("/data/content.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load content.json");
      const data = (await res.json()) as Catalog;
      setCatalog({
        artworks: sortItems(data.artworks ?? []),
        tattoos: sortItems(data.tattoos ?? []),
        products: sortItems(data.products ?? []),
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load content.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return;
    void (async () => {
      const result = await loginAgainstApi(stored);
      if (!result.ok) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      setPassword(stored);
      setRemote(result.remote);
      setAuthed(true);
      await load(stored, result.remote);
    })();
  }, [load]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError("");
    const result = await loginAgainstApi(password);
    if (!result.ok) {
      setLoginError("Wrong password.");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, password);
    setRemote(result.remote);
    setAuthed(true);
    await load(password, result.remote);
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPassword("");
    setCatalog(emptyCatalog());
    setDraft(null);
  }

  function openNew() {
    setDraftIndex(null);
    setDraft(blankItem(tab, items.length + 1));
  }

  function openEdit(index: number) {
    setDraftIndex(index);
    setDraft({ ...items[index] });
  }

  function updateList(nextItems: Draft[]) {
    const sorted = reindex(sortItems(nextItems));
    setCatalog((current) => {
      if (tab === "artworks") return { ...current, artworks: sorted as Artwork[] };
      if (tab === "tattoos") return { ...current, tattoos: sorted as TattooPiece[] };
      return { ...current, products: sorted as Product[] };
    });
  }

  function saveDraft() {
    if (!draft) return;
    const titled = {
      ...draft,
      title: draft.title.trim() || "Untitled",
      slug: draft.slug.trim() || slugify(draft.title || "item"),
    } as Draft;
    const next = [...items];
    if (draftIndex === null) next.push(titled);
    else next[draftIndex] = titled;
    const slugs = next.map((item, index) =>
      index === (draftIndex ?? next.length - 1) ? "" : item.slug,
    );
    const unique = uniqueSlug(titled.slug || titled.title, slugs.filter(Boolean));
    const finalized = { ...titled, slug: unique };
    if (draftIndex === null) next[next.length - 1] = finalized;
    else next[draftIndex] = finalized;
    updateList(next);
    setDraft(null);
    setDraftIndex(null);
    setStatus("Change stored in this session. Download content.json or save on the server.");
  }

  function removeItem(index: number) {
    const item = items[index];
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    updateList(items.filter((_, i) => i !== index));
    setStatus("Item removed in this session.");
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    updateList(next);
  }

  async function saveRemote() {
    if (!remote) {
      setStatus("Live static host cannot write files. Download content.json and replace data/content.json, then rebuild.");
      return;
    }
    setBusy(true);
    try {
      const payload = ensureSlugs(catalog);
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setCatalog(data.catalog ?? payload);
      setStatus("Saved to data/content.json on this computer.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File) {
    if (!draft) return;
    if (remote) {
      const body = new FormData();
      body.set("file", file);
      body.set("collection", uploadCollection);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-admin-password": password },
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      await applyImage(String(data.image));
      setStatus(`Uploaded to ${data.image}`);
      return;
    }
    if (file.size > 400 * 1024) {
      throw new Error(
        "On the live static site, new image files cannot be stored. Put the file in public/uploads/ and paste the path (for example /uploads/works/photo.jpg), or run npm run dev to upload.",
      );
    }
    const dataUrl = await fileToDataUrl(file);
    await applyImage(dataUrl);
    setStatus("Small image stored as a data URL in the downloaded JSON.");
  }

  async function applyImage(src: string) {
    if (!draft) return;
    let width = draft.imageWidth;
    let height = draft.imageHeight;
    try {
      const size = await probeImage(src);
      width = size.width;
      height = size.height;
    } catch {
      /* keep existing size */
    }
    setDraft({
      ...draft,
      image: src,
      imageWidth: width,
      imageHeight: height,
      aspect: aspectFromSize(width, height),
    });
  }

  const note = useMemo(() => {
    if (remote) {
      return "Local server mode: saves write data/content.json and uploads go to public/uploads/.";
    }
    return "Live static mode: edits stay in this browser until you download content.json. Binary uploads need npm run dev.";
  }, [remote]);

  if (!authed) {
    return (
      <div className={`wrap ${styles.page}`}>
        <header className="page-head">
          <p className="meta">04 / Studio</p>
          <h1>Admin</h1>
          <p>Sign in to add, edit, reorder or remove Works, Tattoo and Shop entries.</p>
        </header>
        <form className={styles.login} onSubmit={handleLogin}>
          <label>
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {loginError ? <p className={styles.error}>{loginError}</p> : null}
          <button className={styles.primary} type="submit">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <header className="page-head">
        <p className="meta">04 / Studio</p>
        <h1>Admin</h1>
        <p>{note}</p>
      </header>

      <div className={styles.toolbar}>
        <nav className="filter-bar" aria-label="Collections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => {
                setTab(item.id);
                setDraft(null);
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={openNew}>
            Add {TABS.find((item) => item.id === tab)?.label}
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => downloadJson(ensureSlugs(catalog))}
          >
            Download content.json
          </button>
          <button type="button" className={styles.primary} onClick={saveRemote} disabled={busy}>
            {remote ? "Save on server" : "Save (dev only)"}
          </button>
          <button type="button" className={styles.ghost} onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {status ? <p className={styles.status}>{status}</p> : null}

      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={`${item.slug}-${index}`} className={styles.row}>
            <div className={styles.thumb}>
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={withBase(item.image)} alt="" />
              ) : (
                <span>No image</span>
              )}
            </div>
            <div className={styles.meta}>
              <p className="meta">{String(index + 1).padStart(2, "0")}</p>
              <h2>{item.title}</h2>
              <p>{item.slug}</p>
            </div>
            <div className={styles.rowActions}>
              <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0}>
                Up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
              >
                Down
              </button>
              <button type="button" onClick={() => openEdit(index)}>
                Edit
              </button>
              <button type="button" onClick={() => removeItem(index)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {items.length === 0 ? <p className="empty">No entries in this collection yet.</p> : null}

      {draft ? (
        <ItemEditor
          tab={tab}
          draft={draft}
          remote={remote}
          busy={busy}
          onChange={setDraft}
          onCancel={() => {
            setDraft(null);
            setDraftIndex(null);
          }}
          onSave={saveDraft}
          onUpload={async (file) => {
            setBusy(true);
            try {
              await uploadImage(file);
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Upload failed.");
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function probeImage(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Could not read image size."));
    image.src = src;
  });
}

function ItemEditor({
  tab,
  draft,
  remote,
  busy,
  onChange,
  onCancel,
  onSave,
  onUpload,
}: {
  tab: Tab;
  draft: Draft;
  remote: boolean;
  busy: boolean;
  onChange: (draft: Draft) => void;
  onCancel: () => void;
  onSave: () => void;
  onUpload: (file: File) => Promise<void>;
}) {
  function patch(update: Record<string, unknown>) {
    onChange({ ...draft, ...update } as Draft);
  }

  return (
    <div className={styles.overlay}>
      <form
        className={styles.editor}
        onSubmit={(event) => {
          event.preventDefault();
          onSave();
        }}
      >
        <p className="meta">{draft.slug ? "Edit entry" : "New entry"}</p>
        <h2>{tab === "artworks" ? "Work" : tab === "tattoos" ? "Tattoo" : "Shop item"}</h2>

        <label>
          <span>Title</span>
          <input
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            required
          />
        </label>
        <label>
          <span>Slug</span>
          <input
            value={draft.slug}
            onChange={(event) => patch({ slug: event.target.value })}
            placeholder="generated-from-title"
          />
        </label>

        {tab === "artworks" ? (
          <>
            <label>
              <span>Year</span>
              <input
                type="number"
                value={(draft as Artwork).year}
                onChange={(event) => patch({ year: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Category</span>
              <select
                value={(draft as Artwork).category}
                onChange={(event) =>
                  patch({ category: event.target.value as WorkCategorySlug })
                }
              >
                {workCategories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Medium</span>
              <input
                value={(draft as Artwork).medium}
                onChange={(event) => patch({ medium: event.target.value })}
              />
            </label>
            <label>
              <span>Dimensions</span>
              <input
                value={(draft as Artwork).dimensions}
                onChange={(event) => patch({ dimensions: event.target.value })}
              />
            </label>
          </>
        ) : null}

        {tab === "tattoos" ? (
          <label>
            <span>Medium</span>
            <input
              value={(draft as TattooPiece).medium}
              onChange={(event) => patch({ medium: event.target.value })}
            />
          </label>
        ) : null}

        {tab === "products" ? (
          <>
            <label>
              <span>Category</span>
              <select
                value={(draft as Product).category}
                onChange={(event) =>
                  patch({ category: event.target.value as ShopCategorySlug })
                }
              >
                {shopCategories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Price (TRY)</span>
              <input
                type="number"
                value={(draft as Product).priceTRY}
                onChange={(event) => patch({ priceTRY: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Stock</span>
              <input
                type="number"
                value={(draft as Product).stock}
                onChange={(event) => patch({ stock: Number(event.target.value) })}
              />
            </label>
            <label>
              <span>Availability</span>
              <select
                value={(draft as Product).availability}
                onChange={(event) =>
                  patch({ availability: event.target.value as Availability })
                }
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
              </select>
            </label>
            <label>
              <span>Purchase URL</span>
              <input
                value={(draft as Product).purchaseUrl}
                onChange={(event) => patch({ purchaseUrl: event.target.value })}
              />
            </label>
            <label>
              <span>Shipping note</span>
              <input
                value={(draft as Product).shippingNote}
                onChange={(event) => patch({ shippingNote: event.target.value })}
              />
            </label>
          </>
        ) : null}

        <label className={styles.wide}>
          <span>Description</span>
          <textarea
            rows={4}
            value={"description" in draft ? draft.description : ""}
            onChange={(event) => patch({ description: event.target.value })}
          />
        </label>

        <label className={styles.wide}>
          <span>Image path</span>
          <input
            value={draft.image}
            onChange={(event) => patch({ image: event.target.value })}
            placeholder="/uploads/works/photo.jpg"
          />
        </label>

        <label>
          <span>{remote ? "Upload image" : "Small image (optional)"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onUpload(file);
            }}
          />
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={Boolean(draft.featured)}
            onChange={(event) => patch({ featured: event.target.checked })}
          />
          <span>Featured</span>
        </label>

        <div className={styles.editorActions}>
          <button type="button" className={styles.ghost} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.primary}>
            Apply
          </button>
        </div>
      </form>
    </div>
  );
}
