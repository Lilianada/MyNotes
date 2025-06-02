"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode
} from "react";

interface UserPreferences {
  selectedTags: string[];
  selectedCategories: string[];
  recentTags: string[];
  recentCategories: string[];
  lastSelectedNoteId: number | null;
  maxRecentItems: number;
}

interface UserPreferencesContextType {
  preferences: UserPreferences;
  addSelectedTag: (tag: string) => void;
  removeSelectedTag: (tag: string) => void;
  clearSelectedTags: () => void;
  addSelectedCategory: (category: string) => void;
  removeSelectedCategory: (category: string) => void;
  clearSelectedCategories: () => void;
  addRecentTag: (tag: string) => void;
  addRecentCategory: (category: string) => void;
  setLastSelectedNoteId: (noteId: number | null) => void;
  isTagSelected: (tag: string) => boolean;
  isCategorySelected: (category: string) => boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = "noteapp-user-preferences";
const defaultPreferences: UserPreferences = {
  selectedTags: [],
  selectedCategories: [],
  recentTags: [],
  recentCategories: [],
  lastSelectedNoteId: null,
  maxRecentItems: 10
};

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load from localStorage on client only
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences((prev) => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.warn("Failed to load user preferences:", error);
      }
    }
    // No deps: only run on mount
    // eslint-disable-next-line
  }, []);

  // Save to localStorage whenever preferences changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch (error) {
        console.warn("Failed to save user preferences:", error);
      }
    }
  }, [preferences]);

  // Memoize all updater functions
  const addSelectedTag = useCallback((tag: string) => {
    setPreferences((prev) =>
      prev.selectedTags.includes(tag)
        ? prev
        : { ...prev, selectedTags: [...prev.selectedTags, tag] }
    );
  }, []);

  const removeSelectedTag = useCallback((tag: string) => {
    setPreferences((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.filter((t) => t !== tag)
    }));
  }, []);

  const clearSelectedTags = useCallback(() => {
    setPreferences((prev) => ({ ...prev, selectedTags: [] }));
  }, []);

  const addSelectedCategory = useCallback((category: string) => {
    setPreferences((prev) =>
      prev.selectedCategories.includes(category)
        ? prev
        : { ...prev, selectedCategories: [...prev.selectedCategories, category] }
    );
  }, []);

  const removeSelectedCategory = useCallback((category: string) => {
    setPreferences((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.filter((c) => c !== category)
    }));
  }, []);

  const clearSelectedCategories = useCallback(() => {
    setPreferences((prev) => ({ ...prev, selectedCategories: [] }));
  }, []);

  const addRecentTag = useCallback((tag: string) => {
    setPreferences((prev) => {
      const filtered = prev.recentTags.filter((t) => t !== tag);
      const updated = [tag, ...filtered].slice(0, prev.maxRecentItems);
      return { ...prev, recentTags: updated };
    });
  }, []);

  const addRecentCategory = useCallback((category: string) => {
    setPreferences((prev) => {
      const filtered = prev.recentCategories.filter((c) => c !== category);
      const updated = [category, ...filtered].slice(0, prev.maxRecentItems);
      return { ...prev, recentCategories: updated };
    });
  }, []);

  const setLastSelectedNoteId = useCallback((noteId: number | null) => {
    setPreferences((prev) => ({ ...prev, lastSelectedNoteId: noteId }));
  }, []);

  const isTagSelected = useCallback(
    (tag: string) => preferences.selectedTags.includes(tag),
    [preferences.selectedTags]
  );
  const isCategorySelected = useCallback(
    (category: string) => preferences.selectedCategories.includes(category),
    [preferences.selectedCategories]
  );

  // Memoize value to avoid unnecessary rerenders
  const value = useMemo(
    () => ({
      preferences,
      addSelectedTag,
      removeSelectedTag,
      clearSelectedTags,
      addSelectedCategory,
      removeSelectedCategory,
      clearSelectedCategories,
      addRecentTag,
      addRecentCategory,
      setLastSelectedNoteId,
      isTagSelected,
      isCategorySelected
    }),
    [
      preferences,
      addSelectedTag,
      removeSelectedTag,
      clearSelectedTags,
      addSelectedCategory,
      removeSelectedCategory,
      clearSelectedCategories,
      addRecentTag,
      addRecentCategory,
      setLastSelectedNoteId,
      isTagSelected,
      isCategorySelected
    ]
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
}