import en from "./en";
import hi from "./hi";
import te from "./te";

const translations = {
  en,
  hi,
  te,
};

const LANGUAGE_KEY = "krishisetu-language";

export const supportedLanguages = [
  {
    id: "en",
    label: "English",
    nativeLabel: "English",
  },
  {
    id: "hi",
    label: "Hindi",
    nativeLabel: "हिन्दी",
  },
  {
    id: "te",
    label: "Telugu",
    nativeLabel: "తెలుగు",
  },
];

function getNestedValue(object, path) {
  return path
    .split(".")
    .reduce((current, key) => {
      if (
        current === null ||
        current === undefined
      ) {
        return undefined;
      }

      return current[key];
    }, object);
}

export function getSavedLanguage() {
  const savedLanguage =
    localStorage.getItem(LANGUAGE_KEY);

  if (
    savedLanguage &&
    translations[savedLanguage]
  ) {
    return savedLanguage;
  }

  return "en";
}

export function saveLanguage(language) {
  if (!translations[language]) {
    return;
  }

  localStorage.setItem(
    LANGUAGE_KEY,
    language
  );
}

export function translate(
  language,
  key,
  fallback = ""
) {
  const languagePack =
    translations[language] ||
    translations.en;

  const value = getNestedValue(
    languagePack,
    key
  );

  if (
    value !== undefined &&
    value !== null
  ) {
    return value;
  }

  const englishValue = getNestedValue(
    translations.en,
    key
  );

  if (
    englishValue !== undefined &&
    englishValue !== null
  ) {
    return englishValue;
  }

  return fallback || key;
}

export { translations };