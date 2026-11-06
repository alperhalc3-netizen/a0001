"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { applySettingsCss } from "@/lib/editor/apply";
import { publishedSettings } from "@/lib/editor/published";
import type { EditorSettings } from "@/lib/editor/types";

type State = {
  settings: EditorSettings;
  localImages: { newDrop?: string };
  setPreview: (settings: EditorSettings, localImages?: { newDrop?: string }) => void;
};

const SettingsContext = createContext<State>({
  settings: publishedSettings,
  localImages: {},
  setPreview: () => {},
});

export function useEditorSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreviewState] = useState<{
    settings: EditorSettings;
    localImages: { newDrop?: string };
  } | null>(null);

  const setPreview = useCallback((settings: EditorSettings, localImages?: { newDrop?: string }) => {
    setPreviewState({ settings, localImages: localImages ?? {} });
  }, []);

  const value = useMemo<State>(
    () => ({
      settings: preview?.settings ?? publishedSettings,
      localImages: preview?.localImages ?? {},
      setPreview,
    }),
    [preview, setPreview],
  );

  useEffect(() => {
    applySettingsCss(value.settings);
  }, [value.settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
