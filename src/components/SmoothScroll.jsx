
import {
  useEffect,
} from "react";

import Lenis from "lenis";

import {
  gsap,
} from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";


gsap.registerPlugin(
  ScrollTrigger
);


function SmoothScroll() {

  useEffect(() => {

    /* =====================================================
       SMOOTH SCROLL
    ====================================================== */

    const lenis =
      new Lenis({
        lerp:
          0.12,

        smoothWheel:
          true,

        syncTouch:
          false,

        autoRaf:
          false,
      });


    function raf(
      time
    ) {

      lenis.raf(
        time * 1000
      );

    }


    lenis.on(
      "scroll",
      ScrollTrigger.update
    );


    gsap.ticker.add(
      raf
    );


    gsap.ticker.lagSmoothing(
      0
    );


    /* =====================================================
       SINGLE REVEALS
       Play when entering from either direction.
    ====================================================== */

    const reveals =
      document.querySelectorAll(
        ".scroll-reveal"
      );


    reveals.forEach(
      (
        element
      ) => {

        gsap.fromTo(

          element,

          {
            opacity:
              0,

            y:
              55,

            scale:
              0.985,

            filter:
              "blur(5px)",
          },

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
              0.8,

            ease:
              "power3.out",

            scrollTrigger: {

              trigger:
                element,

              start:
                "top 88%",

              end:
                "bottom 12%",

              toggleActions:
                "play reverse play reverse",

            },

          }

        );

      }
    );


    /* =====================================================
       STAGGERED GROUPS
    ====================================================== */

    const groups =
      document.querySelectorAll(
        ".scroll-reveal-group"
      );


    groups.forEach(
      (
        group
      ) => {

        const items =
          group.querySelectorAll(
            ".scroll-reveal-item"
          );


        if (
          items.length ===
          0
        ) {

          return;

        }


        gsap.fromTo(

          items,

          {
            opacity:
              0,

            y:
              48,

            scale:
              0.97,

            filter:
              "blur(4px)",
          },

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
              0.7,

            stagger:
              0.1,

            ease:
              "power3.out",

            scrollTrigger: {

              trigger:
                group,

              start:
                "top 84%",

              end:
                "bottom 10%",

              toggleActions:
                "play reverse play reverse",

            },

          }

        );

      }
    );


    /* =====================================================
       REFRESH AFTER LAYOUT
    ====================================================== */

    requestAnimationFrame(
      () => {

        requestAnimationFrame(
          () => {

            ScrollTrigger.refresh();

          }
        );

      }
    );


    /* =====================================================
       CLEANUP
    ====================================================== */

    return () => {

      ScrollTrigger.getAll().forEach(
        (
          trigger
        ) => trigger.kill()
      );


      gsap.killTweensOf(
        ".scroll-reveal"
      );


      gsap.killTweensOf(
        ".scroll-reveal-item"
      );


      gsap.ticker.remove(
        raf
      );


      lenis.destroy();

    };

  }, []);


  return null;

}


export default SmoothScroll;
