import {
  Moon,
  Star,
  Sun,
  Trees,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";


const THEMES = [
  {
    id: "light",
    label: "Light",
    icon: Sun,
  },

  {
    id: "dark",
    label: "Dark",
    icon: Moon,
  },

  {
    id: "forest",
    label: "Forest",
    icon: Trees,
  },

  {
    id: "midnight",
    label: "Midnight",
    icon: Star,
  },
];


function ThemeToggle() {

  const [
    theme,
    setTheme,
  ] =
    useState(
      () =>
        localStorage.getItem(
          "krishisetu-theme"
        ) ||
        "light"
    );


  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "krishisetu-theme",
      theme
    );

  }, [
    theme,
  ]);


  function cycleTheme() {

    const currentIndex =
      THEMES.findIndex(
        item =>
          item.id ===
          theme
      );


    const nextIndex =
      currentIndex ===
      -1
        ? 0
        : (
            currentIndex + 1
          ) %
          THEMES.length;


    setTheme(
      THEMES[
        nextIndex
      ].id
    );

  }


  const currentTheme =
    THEMES.find(
      item =>
        item.id ===
        theme
    ) ||
    THEMES[0];


  const CurrentIcon =
    currentTheme.icon;


  return (

    <button
      type="button"
      className="theme-selector-button"
      onClick={
        cycleTheme
      }
      aria-label={
        `Switch theme. Current theme: ${currentTheme.label}`
      }
      title={
        `Current theme: ${currentTheme.label}. Click for ${THEMES[
          (
            THEMES.findIndex(
              item =>
                item.id ===
                theme
            ) + 1
          ) %
          THEMES.length
        ].label}`
      }
    >

      <CurrentIcon
        size={20}
      />


      <span>
        {
          currentTheme.label
        }
      </span>

    </button>

  );

}


export default ThemeToggle;