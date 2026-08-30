
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
     * Login pages keep the premium cinematic
     * transition exactly as before.
     */

    const isLoginPage =
      location.pathname ===
        "/farmer/login" ||
      location.pathname ===
        "/admin/login";


    /*
     * Internal pages use a very short
     * transition so navigation feels instant.
     */

    if (!isLoginPage) {

      gsap.fromTo(

        page,

        {
          opacity: 0,
          y: 6,
        },

        {
          opacity: 1,
          y: 0,

          duration: 0.16,

          ease:
            "power2.out",
        }

      );

      return;

    }


    /*
     * =====================================================
     * PREMIUM LOGIN TRANSITION
     * =====================================================
     */

    const timeline =
      gsap.timeline();


    timeline.set(
      curtain,
      {
        xPercent:
          -100,
      }
    );


    timeline.set(
      glow,
      {
        xPercent:
          -100,

        opacity:
          0,
      }
    );


    timeline.set(
      page,
      {
        opacity:
          0,

        y:
          35,

        scale:
          0.985,

        filter:
          "blur(7px)",
      }
    );


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


    timeline.to(
      page,
      {
        opacity:
          1,

        y:
          0,

        scale:
          1,

        filter:
          "blur(0px)",

        duration:
          0.58,

        ease:
          "power3.out",
      },
      "-=0.08"
    );


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

      <div className="page-transition-curtain" />

      <div className="page-transition-glow" />

      <div className="page-transition-page">

        {children}

      </div>

    </div>

  );

}


export default PageTransition;
