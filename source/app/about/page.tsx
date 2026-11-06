import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  const paragraphs = site.about.filter((paragraph) => !paragraph.startsWith("My practice"));

  return (
    <div className="wrap">
      <header className="page-head">
        <p className="meta">04 / Biography</p>
        <h1>About</h1>
      </header>
      <div className={styles.body}>
        <div className={styles.copy}>
          {paragraphs.map((paragraph, index) => (
            <Reveal key={paragraph} delay={index * 90}>
              <p>{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
