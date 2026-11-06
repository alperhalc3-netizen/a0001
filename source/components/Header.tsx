"use client";

import { withBase } from "@/lib/basePath";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useEditorSettings } from "@/components/editor/SettingsProvider";
import { artworks, nav, products, site } from "@/lib/content";
import styles from "./Header.module.css";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setIndexOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    return () => document.body.classList.remove("menu-open");
  }, [open]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-index", indexOpen);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIndexOpen(false);
    };
    if (indexOpen) window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("is-index");
      window.removeEventListener("keydown", onKey);
    };
  }, [indexOpen]);

  const { settings } = useEditorSettings();

  const path = pathname?.replace(/\/$/, "") || "/";
  if (path.startsWith("/admin") || path.startsWith("/editor")) return null;

  function isCurrent(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const indexRows = [
    ...artworks.map((item, i) => ({
      href: `/works/${item.slug}`,
      num: String(i + 1).padStart(2, "0"),
      title: item.title,
      did: "Works",
      year: String(item.year),
    })),
    {
      href: "/tattoo",
      num: "T",
      title: "Tattoo",
      did: "Practice",
      year: "",
    },
    {
      href: "/shop",
      num: "S",
      title: "Shop",
      did: `${products.length} pieces`,
      year: "",
    },
  ];

  return (
    <>
      <header className={styles.header}>
        <p className={styles.role}>
          <Link href="/" className={styles.mark}>
            <Image
              src={withBase("/brand/logo.jpg")}
              alt=""
              width={970}
              height={847}
              className={styles.logo}
              priority
            />
            <span>{settings.text.name}</span>
          </Link>
          <span className={styles.motto}>{settings.text.tagline}</span>
        </p>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav
          id="site-nav"
          className={`${styles.nav} ${open ? styles.navOpen : ""}`}
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isCurrent(item.href) ? "page" : undefined}
              className={styles.link}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            className={styles.link}
            aria-expanded={indexOpen}
            aria-controls="site-index"
            onClick={() => setIndexOpen((value) => !value)}
          >
            {indexOpen ? "Close" : "Index"}
          </button>
        </nav>
      </header>

      <div
        className={styles.index}
        id="site-index"
        hidden={!indexOpen}
        data-no-brush
      >
        <ol className={styles.indexList}>
          {indexRows.map((row, index) => (
            <li key={row.href} style={{ ["--n" as string]: index }}>
              <Link href={row.href} className={styles.indexLink} onClick={() => setIndexOpen(false)}>
                <span className={styles.ixNum}>{row.num}</span>
                <span className={styles.ixTitle}>{row.title}</span>
                <span className={styles.ixDid}>{row.did}</span>
                <span className={styles.ixYear}>{row.year}</span>
                <i aria-hidden="true">↗</i>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
