"use client";

import { useEffect } from "react";
import { HomeExperience } from "@/components/HomeExperience";
import { useEditorSettings } from "@/components/editor/SettingsProvider";
import { artworks, featuredProducts, products, tattoos } from "@/lib/content";
import { parseSettings } from "@/lib/editor/validate";

function isTattooFree(item: { slug: string; title: string; category: string; description: string }) {
  const blob = `${item.slug} ${item.title} ${item.category} ${item.description}`.toLowerCase();
  return !blob.includes("tatt") && !blob.includes("dövm") && !blob.includes("dovme") && !blob.includes("dövme");
}

export default function PreviewPage() {
  const { setPreview } = useEditorSettings();

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; settings?: unknown; localImage?: unknown };
      if (!data || data.type !== "a0001-preview-settings") return;
      const parsed = parseSettings(data.settings);
      if (!parsed.ok) return;
      const localImages: { newDrop?: string } = {};
      if (
        typeof data.localImage === "string" &&
        data.localImage.startsWith("data:image/") &&
        data.localImage.length < 380_000
      ) {
        localImages.newDrop = data.localImage;
      }
      setPreview(parsed.settings, localImages);
    }
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "a0001-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [setPreview]);

  const works = artworks.filter((item) => Boolean(item.image) && isTattooFree(item));
  const featured = featuredProducts();
  const shop = featured.length ? featured : products;
  const featuredTattoos = tattoos.filter((item) => item.featured);
  const tattooItems = (featuredTattoos.length ? featuredTattoos : tattoos).slice(0, 3);

  return <HomeExperience works={works} tattoos={tattooItems} products={shop} />;
}
