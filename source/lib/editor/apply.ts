import type { EditorSettings } from "./types";

export function applySettingsCss(settings: EditorSettings) {
  const root = document.documentElement;
  root.style.setProperty("--ink", settings.theme.ink);
  root.style.setProperty("--text", settings.theme.ink);
  root.style.setProperty("--paper", settings.theme.paper);
  root.style.setProperty("--bg", settings.theme.paper);
  root.style.setProperty("--page-pad", settings.layout.pagePad);
  root.style.setProperty("--set-gap", `${settings.layout.columnGapRem}rem`);
  root.style.setProperty("--plate-max", `${settings.layout.plateMaxVw}vw`);
  root.style.setProperty("--drop-thumb", `${settings.layout.dropThumbPx / 16}rem`);
  root.style.setProperty("--drop-weight", String(settings.layout.dropWeight));
  root.style.setProperty("--drop-size", `${settings.layout.dropSizeRem}rem`);
  root.style.setProperty("--logo-h", `${settings.layout.logoHeightRem}rem`);
  root.style.setProperty("--announce-weight", String(settings.layout.announceWeight));
  root.style.setProperty("--header-weight", String(settings.layout.headerWeight));
  root.style.setProperty("--reveal-dur", `${settings.motion.durationMs}ms`);
  if (settings.layout.announceSizeRem == null) root.style.removeProperty("--announce-size");
  else root.style.setProperty("--announce-size", `${settings.layout.announceSizeRem}rem`);
  root.dataset.brush = settings.motion.brush ? "on" : "off";
  root.dataset.dab = settings.motion.dab ? "on" : "off";
  root.dataset.reveal = settings.motion.reveal ? "on" : "off";
  window.dispatchEvent(new Event("a0001-settings"));
}
