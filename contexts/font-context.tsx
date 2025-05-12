"use client"

import { createContext, useContext, useState, ReactNode } from 'react';

type FontType = 'sans' | 'mono';

interface FontContextProps {
  fontType: FontType;
  toggleFont: () => void;
}

const FontContext = createContext<FontContextProps | undefined>(undefined);

export function FontProvider({ children }: { children: ReactNode }) {
  const [fontType, setFontType] = useState<FontType>('mono');

  const toggleFont = () => {
    setFontType((prev) => prev === 'mono' ? 'sans' : 'mono');
  };

  return (
    <FontContext.Provider value={{ fontType, toggleFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
