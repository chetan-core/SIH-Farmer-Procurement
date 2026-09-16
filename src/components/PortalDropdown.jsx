import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";


function getViewportPosition(
  anchor
) {
  if (!anchor) {
    return {
      top: 0,
      left: 0,
      width: 0,
      placement: "bottom",
    };
  }

  const rect =
    anchor.getBoundingClientRect();

  const gap = 8;

  const estimatedHeight = 360;

  const spaceBelow =
    window.innerHeight -
    rect.bottom;

  const spaceAbove =
    rect.top;

  const shouldOpenAbove =
    spaceBelow <
      Math.min(
        estimatedHeight,
        window.innerHeight * 0.45
      ) &&
    spaceAbove >
      spaceBelow;

  const rawTop =
    shouldOpenAbove
      ? rect.top -
        gap -
        Math.min(
          estimatedHeight,
          window.innerHeight * 0.45
        )
      : rect.bottom + gap;

  return {
    top:
      Math.max(
        12,
        Math.min(
          rawTop,
          window.innerHeight - 12
        )
      ),

    left:
      Math.max(
        12,
        Math.min(
          rect.left,
          window.innerWidth -
            rect.width -
            12
        )
      ),

    width:
      Math.min(
        rect.width,
        window.innerWidth - 24
      ),

    placement:
      shouldOpenAbove
        ? "top"
        : "bottom",
  };
}


export default function PortalDropdown({
  open,
  anchorRef,
  children,
  onOutsideClick,
  className = "",
  maxHeight = 360,
}) {

  const menuRef =
    useRef(null);

  const [position, setPosition] =
    useState(() =>
      getViewportPosition(
        anchorRef?.current
      )
    );


  /* ========================================================
     POSITION
  ======================================================== */

  const updatePosition = () => {

    if (
      !anchorRef?.current
    ) {
      return;
    }

    setPosition(
      getViewportPosition(
        anchorRef.current
      )
    );
  };


  useLayoutEffect(() => {

    if (!open) {
      return;
    }

    updatePosition();

  }, [
    open,
  ]);


  useEffect(() => {

    if (!open) {
      return;
    }


    const handleResize =
      () => {
        updatePosition();
      };


    const handleScroll =
      () => {
        updatePosition();
      };


    window.addEventListener(
      "resize",
      handleResize
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      true
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
        true
      );

    };

  }, [
    open,
  ]);


  /* ========================================================
     OUTSIDE CLICK
  ======================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }


    const handlePointerDown =
      (event) => {

        const target =
          event.target;


        if (
          menuRef.current?.contains(
            target
          )
        ) {
          return;
        }


        if (
          anchorRef?.current?.contains(
            target
          )
        ) {
          return;
        }


        onOutsideClick?.();

      };


    document.addEventListener(
      "pointerdown",
      handlePointerDown,
      true
    );


    return () => {

      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
        true
      );

    };

  }, [
    open,
    onOutsideClick,
    anchorRef,
  ]);


  /* ========================================================
     ESCAPE
  ======================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }


    const handleKeyDown =
      (event) => {

        if (
          event.key ===
          "Escape"
        ) {
          onOutsideClick?.();
        }

      };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

    };

  }, [
    open,
    onOutsideClick,
  ]);


  if (
    !open ||
    typeof document ===
      "undefined"
  ) {
    return null;
  }


  return createPortal(

    <div
      ref={menuRef}
      className={
        `krishi-portal-dropdown ${className}`
      }
      style={{
        position: "fixed",

        top:
          position.top,

        left:
          position.left,

        width:
          position.width,

        maxHeight:
          `min(${maxHeight}px, calc(100dvh - 24px))`,

        zIndex:
          9999999,

        overflowY:
          "auto",

        overflowX:
          "hidden",

        boxSizing:
          "border-box",
      }}
      onWheel={(event) => {
        event.stopPropagation();
      }}
    >
      {children}
    </div>,

    document.body
  );
}