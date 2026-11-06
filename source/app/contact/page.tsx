
import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { site } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="meta">05 / Studio</p>
        <h1>Contact</h1>
        <p>
          For commissions, available works, or tattoo inquiries. The form
          prepares a message; email still goes out from your own client until
          a backend is connected.
        </p>
      </header>
      <div className={styles.layout}>
        <ContactForm />
        <aside className={styles.aside}>
          <p className="meta">Direct</p>
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <p>
            <a href={site.instagramUrl} rel="noreferrer" target="_blank">
              {site.instagramLabel}
            </a>
          </p>
          <p className="meta">{site.location}</p>
        </aside>
      </div>
    </div>
  );
}
