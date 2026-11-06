import type { Metadata } from "next";
import { EditorApp } from "@/components/editor/EditorApp";

export const metadata: Metadata = {
  title: "Görsel düzenleyici",
  robots: { index: false, follow: false },
};

export default function EditorPage() {
  return <EditorApp />;
}
