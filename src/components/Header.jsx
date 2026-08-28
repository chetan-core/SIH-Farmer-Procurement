import {
  ChevronDown,
  CircleHelp,
} from "lucide-react";
import Logo from "./Logo";
import { Link } from "react-router";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { useLanguage } from "../translations/LanguageContext";

function Header({ showHelp = true }) {
  const {
    language,
    setLanguage,
    languages,
  } = useLanguage();

  const [languageOpen, setLanguageOpen] =
    useState(false);

  const currentLanguage =
    languages.find(
      (item) => item.id === language
    ) || languages[0];

  const handleLanguageChange = (
    languageId
  ) => {
    setLanguage(languageId);
    setLanguageOpen(false);
  };

  return (
    <header className="app-header">
      <Link
        to="/"
        className="app-header-brand"
      >
        <Logo
  size={40}
  showName
/>
      </Link>

      <div className="app-header-actions">
        <div className="language-selector">
          <button
            type="button"
            className="language-selector-button"
            onClick={() =>
              setLanguageOpen(
                (current) => !current
              )
            }
            aria-expanded={languageOpen}
          >
            <span className="language-globe">
              {currentLanguage.id === "te"
                ? "తె"
                : currentLanguage.id === "hi"
                ? "हि"
                : "EN"}
            </span>

            <span className="language-current-label">
              {currentLanguage.nativeLabel}
            </span>

            <ChevronDown
              size={15}
              className={
                languageOpen
                  ? "language-chevron open"
                  : "language-chevron"
              }
            />
          </button>

          {languageOpen && (
            <div className="language-dropdown">
              <div className="language-dropdown-heading">
                <span>Choose language</span>
              </div>

              {languages.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    item.id === language
                      ? "language-option active"
                      : "language-option"
                  }
                  onClick={() =>
                    handleLanguageChange(
                      item.id
                    )
                  }
                >
                  <div className="language-option-code">
                    {item.id === "te"
                      ? "తె"
                      : item.id === "hi"
                      ? "हि"
                      : "EN"}
                  </div>

                  <div className="language-option-text">
                    <strong>
                      {item.nativeLabel}
                    </strong>

                    <span>
                      {item.label}
                    </span>
                  </div>

                  {item.id === language && (
                    <span className="language-active-dot"></span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <ThemeToggle />

        {showHelp && (
          <Link
            to="/farmer/help"
            className="header-help-button"
          >
            <CircleHelp size={18} />
            <span>Help</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;