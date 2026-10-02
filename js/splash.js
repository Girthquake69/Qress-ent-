/**
 * Qress-ent cinematic splash — heritage → gravity → identity → brand
 * Every visit; auto-removes when complete.
 */
(function () {
  "use strict";

  function init() {
    var splash = document.getElementById("splash");
    var heritagePattern = document.getElementById("heritagePattern");
    var ambientGlow = document.getElementById("ambientGlow");
    var orbitSystem = document.getElementById("orbitSystem");
    var orbitLine = document.getElementById("orbitLine");
    var orbitStroke = document.getElementById("orbitStroke");
    var orbitPath = document.getElementById("orbitPath");
    var orbitLight = document.getElementById("orbitLight");
    var values = Array.prototype.slice.call(document.querySelectorAll(".splash .value"));
    var identityCore = document.getElementById("identityCore");
    var brandLockup = document.getElementById("brandLockup");
    var brandTitle = document.getElementById("brandTitle");
    var brandDivider = document.getElementById("brandDivider");
    var tagline = document.getElementById("tagline");
    var curtain = document.getElementById("splashCurtain");

    if (
      !splash ||
      !heritagePattern ||
      !ambientGlow ||
      !orbitSystem ||
      !orbitLine ||
      !orbitStroke ||
      !orbitPath ||
      !orbitLight ||
      !values.length ||
      !identityCore ||
      !brandLockup ||
      !brandTitle ||
      !brandDivider ||
      !tagline ||
      !curtain ||
      typeof gsap === "undefined"
    ) {
      document.body.classList.remove("splash-active");
      if (splash) splash.remove();
      return;
    }

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dismissed = false;

    function revealBrand(tl, cinematic) {
      tl.set(brandLockup, { visibility: "visible" });
      if (!cinematic) {
        tl.to(brandLockup, { opacity: 1, duration: 0.4 });
      } else {
        tl.fromTo(
          brandLockup,
          { opacity: 0, y: 10, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, duration: 0.78, ease: "power3.out" }
        );
      }
      tl.to(brandTitle, { backgroundPosition: "-15% 50%", duration: 0.72, ease: "power2.inOut" }, "-=0.55");
      tl.to(brandTitle, { backgroundPosition: "110% 50%", duration: 1.0, ease: "power1.inOut" }, "-=0.9");
      tl.to(brandDivider, { width: "142px", duration: 0.55, ease: "power3.inOut" }, "-=0.85");
      tl.to(tagline, { opacity: 0.92, clipPath: "inset(0 0% 0 0%)", duration: 0.62, ease: "power2.out" }, "-=0.36");
    }

    function dismissSplash() {
      if (dismissed) return;
      dismissed = true;
      document.body.classList.remove("splash-active");
      splash.setAttribute("aria-hidden", "true");
      gsap.to(splash, {
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
        onComplete: function () {
          splash.remove();
        }
      });
    }

    var tl = gsap.timeline({
      defaults: { overwrite: "auto" },
      onComplete: dismissSplash
    });

    if (reducedMotion) {
      revealBrand(tl, false);
      tl.to({}, { duration: 0.5 }).to(splash, { opacity: 0, duration: 0.28, ease: "power1.out" });
      return;
    }

    /* 1. Darkness -> warm light */
    tl.to(ambientGlow, { opacity: 1, scale: 1, duration: 0.62, ease: "power2.out" });
    tl.to(heritagePattern, { opacity: 0.26, duration: 0.9, ease: "power1.out" }, "-=0.85");

    /* 2. Organic orbit */
    tl.fromTo(
      orbitLine,
      { opacity: 0, scale: 0.9, rotation: -18 },
      { opacity: 0.72, scale: 1, rotation: -9, duration: 0.62, ease: "power2.out" },
      "-=0.75"
    );

    var pathLength = orbitPath.getTotalLength();
    gsap.set(orbitPath, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    tl.to(orbitStroke, { opacity: 0.75, duration: 0.25 }, "-=0.7");
    tl.to(orbitPath, { strokeDashoffset: 0, duration: 0.95, ease: "power2.out" }, "<");

    /* 3. Light travels orbit */
    var lightMotion = { t: 0 };
    tl.to(orbitLight, { opacity: 0.85, duration: 0.25 }, "-=0.65");
    tl.to(
      lightMotion,
      {
        t: 1,
        duration: 1.9,
        ease: "power1.inOut",
        onUpdate: function () {
          var point = orbitPath.getPointAtLength(pathLength * lightMotion.t);
          var x = ((point.x - 50) / 100) * orbitSystem.offsetWidth;
          var y = ((point.y - 50) / 100) * orbitSystem.offsetHeight;
          gsap.set(orbitLight, { x: x, y: y });
        }
      },
      "-=1.0"
    );

    /* 4. Five values */
    var valueAnimations = [
      { x: -50, y: -15, rotate: -2 },
      { x: 12, y: 5, rotate: 2 },
      { x: 8, y: 12, rotate: -1 },
      { x: -8, y: 12, rotate: 1 },
      { x: -12, y: 5, rotate: -2 }
    ];

    values.forEach(function (value, index) {
      var anim = valueAnimations[index];
      tl.fromTo(
        value,
        {
          opacity: 0,
          x: anim.x,
          y: anim.y,
          rotate: anim.rotate,
          scale: 0.965,
          filter: "blur(5px)"
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: index === values.length - 1 ? 0.62 : 0.52,
          ease: "power2.out"
        },
        index === 0 ? "+=0.02" : "-=0.29"
      );
    });

    /* 5. Brief hold */
    tl.to({}, { duration: 0.28 });

    /* 6. Ember awakens */
    tl.to(identityCore, { opacity: 0.48, scale: 1.8, duration: 0.18, ease: "power2.out" })
      .to(identityCore, { opacity: 0.18, scale: 1, duration: 0.15, ease: "power2.inOut" })
      .to(identityCore, { opacity: 0.72, scale: 2.4, duration: 0.22, ease: "power2.out" });

    tl.to(ambientGlow, { opacity: 0.95, scale: 1.12, duration: 0.45, ease: "power2.out" }, "<");
    tl.to(orbitSystem, { rotation: 7, scale: 1.03, duration: 0.42, ease: "power2.inOut" }, "<");
    tl.to(
      orbitLine,
      { rotation: -17, scaleX: 0.96, scaleY: 0.9, opacity: 0.55, duration: 0.45, ease: "power2.inOut" },
      "<"
    );

    /* 7. Gravity / collection */
    var convergence = gsap.timeline();
    var delays = [0, 0.07, 0.13, 0.19, 0.25];
    values.forEach(function (value, index) {
      convergence.to(
        value,
        {
          x: 0,
          y: 0,
          rotate: index % 2 === 0 ? 6 : -6,
          scale: 0.58,
          opacity: 0,
          filter: "blur(4px)",
          duration: 0.68,
          ease: "power3.in"
        },
        delays[index]
      );
    });
    tl.add(convergence, "+=0.02");

    tl.to(identityCore, { scale: 4.2, opacity: 0.9, duration: 0.38, ease: "power2.out" }, "-=0.28");
    tl.to(identityCore, { scale: 10, opacity: 0.08, duration: 0.42, ease: "power2.out" }, "-=0.12");
    tl.to([orbitLine, orbitStroke, orbitLight], { opacity: 0, duration: 0.42, ease: "power2.in" }, "-=0.36");
    tl.to(orbitSystem, { scale: 0.72, rotation: 14, opacity: 0.16, duration: 0.42, ease: "power3.in" }, "<");

    /* 8. Brand */
    revealBrand(tl, true);

    /* 9. Short hold */
    tl.to({}, { duration: 0.62 });

    /* 10. Exit */
    tl.to(heritagePattern, { opacity: 0, duration: 0.45, ease: "power1.out" });
    tl.to(ambientGlow, { opacity: 0, scale: 1.25, duration: 0.38, ease: "power2.in" }, "<");
    tl.set(curtain, { yPercent: 100 });
    tl.to(curtain, { yPercent: 0, duration: 0.62, ease: "power3.inOut" }, "-=0.25");
    tl.to(splash, { opacity: 0, duration: 0.38, ease: "power2.out" }, "-=0.32");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
