import {
  useEffect,
  useRef,
} from "react";

import {
  useLocation,
} from "react-router";

import {
  gsap,
} from "gsap";


function PageTransition({
  children,
}) {

  const location =
    useLocation();

  const containerRef =
    useRef(null);


  useEffect(() => {

    const container =
      containerRef.current;


    if (!container) {
      return;
    }


    const page =
      container.querySelector(
        ".page-transition-page"
      );

    const curtain =
      container.querySelector(
        ".page-transition-curtain"
      );

    const glow =
      container.querySelector(
        ".page-transition-glow"
      );


    if (
      !page ||
      !curtain ||
      !glow
    ) {
      return;
    }


    /*
     * IMPORTANT
     * =====================================================
     * Never apply transform / filter / scale / translate
     * to .page-transition-page.
     *
     * That element contains page-level modals and drawers.
     * A transformed/filter ancestor can change the containing
     * block of position: fixed children and cause exactly
     * the "modal opens down the page" problem.
     *
     * Page transitions therefore use opacity only.
     *
     * The curtain + glow provide the visual transition
     * without transforming the page container.
     * =====================================================
     */


    const isLoginPage =
      location.pathname ===
        "/farmer/login" ||
      location.pathname ===
        "/admin/login";


    /*
     * Kill any previous animation
     */
    gsap.killTweensOf(
      page
    );

    gsap.killTweensOf(
      curtain
    );

    gsap.killTweensOf(
      glow
    );


    /* =====================================================
       INTERNAL PAGES
       Fast, clean fade.
    ===================================================== */

    if (!isLoginPage) {

      gsap.fromTo(

        page,

        {
          opacity: 0,
        },

        {
          opacity: 1,

          duration:
            0.16,

          ease:
            "power2.out",

          clearProps:
            "opacity",
        }

      );


      return () => {

        gsap.killTweensOf(
          page
        );

        /*
         * Explicitly remove any accidental
         * transform/filter left by another
         * transition implementation.
         */
        gsap.set(
          page,
          {
            clearProps:
              "transform,filter,scale,x,y",
          }
        );

      };

    }


    /* =====================================================
       LOGIN PAGES
       Premium cinematic transition WITHOUT transforming
       the page container.
    ===================================================== */

    const timeline =
      gsap.timeline();


    /*
     * Curtain starts outside the viewport.
     */
    timeline.set(
      curtain,
      {
        xPercent:
          -100,
      }
    );


    /*
     * Glow starts outside the viewport.
     */
    timeline.set(
      glow,
      {
        xPercent:
          -100,

        opacity:
          0,
      }
    );


    /*
     * Page starts transparent only.
     *
     * NO:
     * y
     * scale
     * filter
     * transform
     *
     * This is the critical fix.
     */
    timeline.set(
      page,
      {
        opacity:
          0,
      }
    );


    /*
     * Curtain enters.
     */
    timeline.to(
      curtain,
      {
        xPercent:
          0,

        duration:
          0.42,

        ease:
          "power4.inOut",
      }
    );


    /*
     * Glow follows curtain.
     */
    timeline.to(
      glow,
      {
        xPercent:
          0,

        opacity:
          1,

        duration:
          0.35,

        ease:
          "power3.out",
      },
      "-=0.30"
    );


    /*
     * Reveal page using opacity only.
     */
    timeline.to(
      page,
      {
        opacity:
          1,

        duration:
          0.45,

        ease:
          "power3.out",
      },
      "-=0.08"
    );


    /*
     * Glow exits.
     */
    timeline.to(
      glow,
      {
        xPercent:
          100,

        opacity:
          0,

        duration:
          0.4,

        ease:
          "power3.inOut",
      }
    );


    /*
     * Curtain exits.
     */
    timeline.to(
      curtain,
      {
        xPercent:
          100,

        duration:
          0.48,

        ease:
          "power4.inOut",
      },
      "-=0.34"
    );


    return () => {

      timeline.kill();

      gsap.killTweensOf(
        page
      );

      gsap.killTweensOf(
        curtain
      );

      gsap.killTweensOf(
        glow
      );


      /*
       * Absolutely guarantee that no transform/filter
       * remains on the page wrapper.
       */
      gsap.set(
        page,
        {
          clearProps:
            "transform,filter,scale,x,y",
        }
      );

    };

  }, [
    location.pathname,
  ]);


  return (

    <div
      ref={
        containerRef
      }
      className="page-transition"
    >

      <div
        className=
          "page-transition-curtain"
        aria-hidden="true"
      />

      <div
        className=
          "page-transition-glow"
        aria-hidden="true"
      />

      <div
        className=
          "page-transition-page"
      >

        {children}

      </div>

    </div>

  );

}


export default PageTransition;