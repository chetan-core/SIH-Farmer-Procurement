import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSavedLanguage,
  saveLanguage,
  supportedLanguages,
  translate,
} from "./i18n";

const LanguageContext =
  createContext(null);

export function LanguageProvider({
  children,
}) {
  const [language, setLanguageState] =
    useState(getSavedLanguage);

  useEffect(() => {
    saveLanguage(language);

    document.documentElement.setAttribute(
      "lang",
      language
    );
  }, [language]);

  const setLanguage = (nextLanguage) => {
    const exists =
      supportedLanguages.some(
        (item) =>
          item.id === nextLanguage
      );

    if (!exists) {
      return;
    }

    setLanguageState(nextLanguage);
  };

  const t = (
    key,
    fallback = ""
  ) =>
    translate(
      language,
      key,
      fallback
    );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languages: supportedLanguages,
      t,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider."
    );
  }

  return context;
}