"use client";

import { usePathname } from "next/navigation";
import { site } from "@/lib/content";
import styles from "./Footer.module.css";

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  // Home has its own bottom bar in the hero composition
  const path = pathname?.replace(/\/$/, "") || "/";
  if (path === "/" || path === "/preview" || path.startsWith("/editor")) return null;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <a className={styles.mail} href={`mailto:${site.email}`}>
          {site.email}
        </a>
        <p className={styles.copy}>All rights reserved. ©{new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
