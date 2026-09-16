import { useEffect } from "react";

const OVERLAY_SELECTORS = [
  ".admin-center-form-overlay",
  ".admin-center-drawer-overlay",
  ".admin-farmer-drawer-overlay",
  ".admin-booking-drawer-overlay",
  ".admin-payment-form-overlay",
  ".admin-sidebar-overlay",
];

function hasOpenOverlay() {
  return OVERLAY_SELECTORS.some(
    (selector) => document.querySelector(selector)
  );
}

function lockPage() {
  const html = document.documentElement;
  const body = document.body;

  if (!html || !body) return;

  const scrollY =
    window.scrollY ||
    window.pageYOffset ||
    0;

  const scrollbarWidth =
    window.innerWidth -
    document.documentElement.clientWidth;

  html.dataset.krishiScrollLocked = "true";

  body.dataset.krishiScrollY =
    String(scrollY);

  body.style.setProperty(
    "--krishi-scrollbar-width",
    `${scrollbarWidth}px`
  );

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";

  html.style.overflow = "hidden";

  document
    .querySelector(".admin-layout")
    ?.setAttribute(
      "data-scroll-locked",
      "true"
    );
}

function unlockPage() {
  const html = document.documentElement;
  const body = document.body;

  if (!html || !body) return;

  const savedY =
    Number(body.dataset.krishiScrollY || 0);

  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";

  html.style.overflow = "";

  delete body.dataset.krishiScrollY;

  document
    .querySelector(".admin-layout")
    ?.removeAttribute(
      "data-scroll-locked"
    );

  html.dataset.krishiScrollLocked =
    "false";

  window.scrollTo(
    0,
    savedY
  );
}

export default function ScrollLockManager() {
  useEffect(() => {
    let locked = false;

    const sync = () => {
      const open = hasOpenOverlay();

      if (open && !locked) {
        lockPage();
        locked = true;
        return;
      }

      if (!open && locked) {
        unlockPage();
        locked = false;
      }
    };

    const observer =
      new MutationObserver(sync);

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "aria-hidden",
        ],
      }
    );

    sync();

    return () => {
      observer.disconnect();

      if (locked) {
        unlockPage();
      }
    };
  }, []);

  return null;
}