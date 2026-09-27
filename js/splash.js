/**
 * Qress-ent splash — every visit, auto-hides when the timeline ends.
 * Requires GSAP (loaded before this file).
 */
(function () {
  function runSplash() {
    if (typeof gsap === "undefined") {
      // Fail open: never block the site
      finishSplash();
      return;
    }

    document.body.classList.add("splash-active");

    var container = document.getElementById("splashContainer");
    var main = document.getElementById("splashMain");
    var lining = document.getElementById("splashLining");
    var monogram = document.getElementById("splashMonogram");
    var brandWrap = document.getElementById("splashBrand");
    var brandTitle = document.getElementById("splashBrandTitle");
    var goldLine = document.getElementById("splashGoldLine");
    var tagline = document.getElementById("splashTagline");

    if (!container || !main) {
      finishSplash();
      return;
    }

    var tl = gsap.timeline({
      onComplete: finishSplash,
    });

    var swapWords = gsap.utils.toArray(".splash-swap-word");

    // Phase 1 — word swap
    swapWords.forEach(function (word) {
      tl.fromTo(
        word,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }
      ).to(
        word,
        { opacity: 0, y: -25, duration: 0.6, ease: "power2.in" },
        "+=0.25"
      );
    });

    // Phase 2 — brand + monogram
    if (monogram) {
      tl.to(
        monogram,
        { opacity: 1, scale: 1, duration: 1.3, ease: "power3.out" },
        "-=0.1"
      );
    }
    if (brandWrap) {
      tl.to(
        brandWrap,
        {
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power3.out",
        },
        "<"
      );
    }

    tl.add(function () {
      if (brandTitle) brandTitle.classList.add("splash-shimmer");
    }, "-=0.6");

    if (goldLine) {
      tl.to(
        goldLine,
        { width: "140px", duration: 0.8, ease: "expo.out" },
        "-=0.6"
      );
    }
    if (tagline) {
      tl.to(
        tagline,
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
        "-=0.5"
      );
    }

    tl.to({}, { duration: 0.9 });

    // Phase 3 — curtain exit
    tl.to(main, {
      y: "-100%",
      duration: 1.0,
      ease: "power4.inOut",
    });
    if (lining) {
      tl.to(
        lining,
        { y: "-100%", duration: 1.0, ease: "power4.inOut" },
        "-=0.85"
      );
    }
  }

  function finishSplash() {
    document.body.classList.remove("splash-active");
    document.body.style.overflow = "";
    var container = document.getElementById("splashContainer");
    if (container) {
      container.classList.add("is-done");
      container.setAttribute("aria-hidden", "true");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runSplash);
  } else {
    runSplash();
  }
})();
