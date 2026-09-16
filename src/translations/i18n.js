import en from "./en";
import hi from "./hi";
import te from "./te";
import mr from "./mr";
import ta from "./ta";
import bn from "./bn";
import gu from "./gu";
import kn from "./kn";
import ml from "./ml";
import pa from "./pa";

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
,
  {
    id: "mr",
    label: "Marathi",
    nativeLabel: "मराठी",
  },
  {
    id: "ta",
    label: "Tamil",
    nativeLabel: "தமிழ்",
  },
  {
    id: "bn",
    label: "Bengali",
    nativeLabel: "বাংলা",
  },
  {
    id: "gu",
    label: "Gujarati",
    nativeLabel: "ગુજરાતી",
  },
  {
    id: "kn",
    label: "Kannada",
    nativeLabel: "ಕನ್ನಡ",
  },
  {
    id: "ml",
    label: "Malayalam",
    nativeLabel: "മലയാളം",
  },
  {
    id: "pa",
    label: "Punjabi",
    nativeLabel: "ਪੰਜਾਬੀ",
  }
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