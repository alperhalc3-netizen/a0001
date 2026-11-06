import raw from "../../data/editor-settings.json";
import { parseSettings } from "./validate";
import type { EditorSettings } from "./types";

const parsed = parseSettings(raw);

if (!parsed.ok) {
  throw new Error(parsed.error);
}

export const publishedSettings: EditorSettings = parsed.settings;

export function cloneSettings(settings: EditorSettings): EditorSettings {
  return structuredClone(settings);
}
