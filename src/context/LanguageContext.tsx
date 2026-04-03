"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Lang, translations } from "@/lib/translations";

type LanguageContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Record<string, string>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>("en");

  // Load from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("vitalink_lang") as Lang;
    if (savedLang && ["en", "hi", "te", "ta", "kn"].includes(savedLang)) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("vitalink_lang", newLang);
  };

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
