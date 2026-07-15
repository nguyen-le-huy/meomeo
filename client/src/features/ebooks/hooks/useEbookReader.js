import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEbookBookmark, deleteEbookBookmark, getEbookBookmarks, getEbookProgress, getEbookReaderSettings, saveEbookProgress, saveEbookReaderSettings,
} from "../services/ebookApi.js";
import { getGuestSessionId } from "../../../utils/sessionId.js";
import { READER_FONT_IDS, READER_THEME_IDS } from "../config/readerAppearance.js";

const defaults = { fontSize: 18, fontFamily: "serif", theme: "light", letterSpacing: 0, lineHeight: 1.65 };

function normalizeSettings(value) {
  return {
    fontSize: Number.isFinite(value?.fontSize) ? value.fontSize : defaults.fontSize,
    fontFamily: READER_FONT_IDS.includes(value?.fontFamily) ? value.fontFamily : defaults.fontFamily,
    theme: READER_THEME_IDS.includes(value?.theme) ? value.theme : defaults.theme,
    letterSpacing: Number.isFinite(value?.letterSpacing) ? value.letterSpacing : defaults.letterSpacing,
    lineHeight: Number.isFinite(value?.lineHeight) ? value.lineHeight : defaults.lineHeight,
  };
}

export function useEbookReader(ebookId) {
  const sessionId = useMemo(() => getGuestSessionId(), []);
  const client = useQueryClient();
  const [settings, setSettings] = useState(defaults);
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  const progressQuery = useQuery({ enabled: Boolean(ebookId), queryKey: ["ebook-progress", ebookId, sessionId], queryFn: async () => (await getEbookProgress(ebookId, sessionId)).data.data.progress });
  const bookmarksQuery = useQuery({ enabled: Boolean(ebookId), queryKey: ["ebook-bookmarks", ebookId, sessionId], queryFn: async () => (await getEbookBookmarks(ebookId, sessionId)).data.data.bookmarks });
  const settingsQuery = useQuery({ queryKey: ["ebook-reader-settings"], queryFn: async () => (await getEbookReaderSettings()).data.data.settings });
  const saveProgressMutation = useMutation({ mutationFn: (data) => saveEbookProgress(ebookId, { ...data, sessionId }), onSuccess: () => client.invalidateQueries({ queryKey: ["ebook-progress", ebookId, sessionId] }) });
  const addBookmarkMutation = useMutation({ mutationFn: (data) => createEbookBookmark(ebookId, { ...data, sessionId }), onSuccess: () => client.invalidateQueries({ queryKey: ["ebook-bookmarks", ebookId, sessionId] }) });
  const removeBookmarkMutation = useMutation({ mutationFn: ({ id, bookmarkId }) => deleteEbookBookmark(id, bookmarkId, sessionId), onSuccess: () => client.invalidateQueries({ queryKey: ["ebook-bookmarks", ebookId, sessionId] }) });
  const saveSettingsMutation = useMutation({
    mutationFn: (payload) => saveEbookReaderSettings(normalizeSettings(payload)),
    onSuccess: (response) => {
      const nextSettings = normalizeSettings(response.data.data.settings);
      client.setQueryData(["ebook-reader-settings"], nextSettings);
      setSettings(nextSettings);
      setHasUnsavedSettings(false);
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setSettings((current) => (hasUnsavedSettings ? current : normalizeSettings(settingsQuery.data)));
  }, [hasUnsavedSettings, settingsQuery.data]);

  const updateSettings = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }));
    setHasUnsavedSettings(true);
  }, []);

  const saveSettings = useCallback(() => saveSettingsMutation.mutateAsync(settings), [saveSettingsMutation, settings]);

  return {
    sessionId,
    settings,
    updateSettings,
    saveSettings,
    hasUnsavedSettings,
    isSavingSettings: saveSettingsMutation.isPending,
    settingsError: settingsQuery.isError || saveSettingsMutation.isError,
    progress: progressQuery.data,
    bookmarks: bookmarksQuery.data || [],
    saveProgress: saveProgressMutation.mutate,
    saveProgressAsync: saveProgressMutation.mutateAsync,
    addBookmark: addBookmarkMutation.mutateAsync,
    removeBookmark: (bookmarkId) => removeBookmarkMutation.mutateAsync({ id: ebookId, bookmarkId }),
    isLoading: progressQuery.isLoading || bookmarksQuery.isLoading || settingsQuery.isLoading,
  };
}
