/**
 * Qress-ent splash — orbit values, portrait, smooth fade exit
 * Plays on first entry + browser refresh.
 * Skips when arriving via in-site navigation (e.g. Home link).
 * Force with ?replay
 */
(function () {
  "use strict";

  var debug = /[?&]replay/.test(location.search);

  function clearSplashLocks() {
    document.documentElement.classList.remove("splash-lock");
    document.body.classList.remove("splash-active");
  }

  function removeSplashEl() {
    var root = document.getElementById("splash");
    if (root && root.parentNode) root.remove();
  }

  /** Should this page load show the splash? */
  function shouldPlaySplash() {
    if (debug) return true;
    try {
      var entries = performance.getEntriesByType("navigation");
      var nav = entries && entries[0];
      var type = nav ? nav.type : "navigate"; // navigate | reload | back_forward | prerender
      // Browser refresh → always play
      if (type === "reload") return true;
      // Back/forward → skip (already saw site)
      if (type === "back_forward") return false;
      // Link / typed URL / external: skip only if came from same site (Home, etc.)
      var ref = document.referrer || "";
      if (ref) {
        try {
          var refOrigin = new URL(ref).origin;
          if (refOrigin === location.origin) return false;
        } catch (e) {}
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  if (!shouldPlaySplash()) {
    clearSplashLocks();
    document.documentElement.classList.add("splash-skip");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", removeSplashEl, { once: true });
    } else {
      removeSplashEl();
    }
    return;
  }

  function boot() {
    var root = document.getElementById("splash");
    var html = document.documentElement;
    if (!root) {
      clearSplashLocks();
      return;
    }
    if (typeof gsap === "undefined") {
      clearSplashLocks();
      root.remove();
      return;
    }

    var q = function (s) { return root.querySelector(s); };
    var ambient = q(".ambient");
    var glow = q(".glow");
    var flare = q(".flare");
    var orbit = q(".orbit");
    var arc = q(".arc");
    var img = q(".portrait");
    var core = q(".core");
    var coreRing = q(".core-ring");
    var ring = q(".ring");
    var brand = q(".brand");
    var brandName = q(".brand-name");
    var divider = q(".divider");
    var tagline = q(".tagline");
    var btn = q(".btn-skip");
    var words = gsap.utils.toArray(".word", root);
    var mm = gsap.matchMedia();
    var tl;
    var state = "playing";

    function release() {
      clearSplashLocks();
      if (root.parentNode) root.remove();
      document.dispatchEvent(new CustomEvent("splash:done"));
    }

    function finish() {
      if (debug) {
        state = "done";
        clearSplashLocks();
        root.classList.add("is-done");
        if (btn) {
          btn.textContent = "Replay";
          gsap.set(btn, { opacity: 1 });
        }
        document.dispatchEvent(new CustomEvent("splash:done"));
      } else {
        requestAnimationFrame(function () {
          mm.revert();
          release();
        });
      }
    }

    if (btn) {
      btn.addEventListener("click", function () {
        if (state === "done") {
          state = "playing";
          root.classList.remove("is-done");
          html.classList.add("splash-lock");
          document.body.classList.add("splash-active");
          btn.textContent = "Skip intro";
          gsap.set(btn, { opacity: 0 });
          if (tl) tl.restart();
        } else if (tl) {
          tl.timeScale(3);
          btn.disabled = true;
        }
      });
    }

    function full() {
      var portrait = img && img.isConnected ? img : null;
      var pg = [glow, portrait].filter(Boolean);
      var t = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: finish
      });

      t.set(ambient, { scale: 0.7 })
        .set(orbit, { scale: 0.85, rotation: -12 })
        .set(glow, { scale: 0.94 })
        .set(coreRing, { scale: 0.5 })
        .set(flare, { scale: 0.04 })
        .set(brand, { y: 18, scale: 0.96 })
        .set(words, { y: 10, scale: 0.86 });

      t.to(ambient, { opacity: 1, scale: 1, duration: 1.4 }, 0)
        .to(btn, { opacity: 1, duration: 0.4 }, 0.6)
        .to(core, { opacity: 1, duration: 0.4 }, 0.2)
        .to(coreRing, {
          keyframes: [
            { opacity: 0.9, scale: 1, duration: 0.2 },
            { opacity: 0, scale: 3.2, duration: 0.9 }
          ]
        }, 0.3)
        .to(orbit, { opacity: 1, scale: 1, rotation: 0, duration: 1.1, ease: "power3.out" }, 0.7)
        .to(arc, { rotation: 360, duration: 2.4, ease: "none" }, 0.7)
        .to(glow, { opacity: 1, scale: 1, duration: 1.1 }, 1)
        .to(core, { opacity: 0, duration: 0.4 }, 1.2);

      if (portrait) {
        t.set(portrait, { scale: 1.07, y: 28 }, 0)
          .to(portrait, { opacity: 0.85, duration: 1.4 }, 1.1)
          .to(portrait, { scale: 1, y: 0, duration: 2.4, ease: "power2.out" }, 1.1);
      }

      t.to(words, { opacity: 1, scale: 1, y: 0, duration: 0.7, stagger: 0.15, ease: "power3.out" }, 1.7)
        .addLabel("converge", 3.6)
        .to(ring, { scale: 0.1, opacity: 0, duration: 0.7, ease: "power3.in" }, "converge")
        .to(orbit, { opacity: 0, scale: 0.2, duration: 0.7, ease: "power3.in" }, "converge")
        .to(pg, { opacity: 0, scale: 0.94, duration: 0.7, ease: "power2.inOut" }, "converge+=.1")
        .to(flare, { opacity: 1, scale: 1, duration: 0.5 }, "converge+=.5")
        .to(flare, { opacity: 0, scale: 1.8, duration: 0.6, ease: "power2.in" }, "converge+=1")
        .addLabel("lockup", "converge+=.95")
        .to(brand, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out" }, "lockup")
        .to(brandName, { backgroundPosition: "0% 50%", duration: 1.6, ease: "power2.inOut" }, "lockup+=.2")
        .to(divider, { scaleX: 1, duration: 0.8, ease: "power2.inOut" }, "lockup+=.4")
        .to(tagline, { opacity: 1, duration: 0.8 }, "lockup+=.6")
        .addLabel("exit", "lockup+=2.1")
        .to(btn, { opacity: 0, duration: 0.3 }, "exit")
        .to(root, { opacity: 0, duration: 0.85, ease: "power2.inOut" }, "exit");

      return t;
    }

    function reduced() {
      gsap.set(divider, { scaleX: 1 });
      gsap.set(tagline, { opacity: 1 });
      gsap.set(brand, { y: 0, scale: 1 });
      return gsap.timeline({ onComplete: finish })
        .to(brand, { opacity: 1, duration: 0.5 }, 0)
        .to(btn, { opacity: 1, duration: 0.3 }, 0)
        .to(root, { opacity: 0, duration: 0.55, ease: "power2.inOut" }, 1.9);
    }

    var imgReady = Promise.resolve();
    if (img) {
      if (img.decode) {
        imgReady = img.decode().catch(function () {
          if (img.parentNode) img.remove();
        });
      } else if (!img.complete) {
        imgReady = new Promise(function (resolve) {
          img.onload = img.onerror = function () { resolve(); };
        });
      }
    }

    Promise.race([
      Promise.all([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        imgReady
      ]),
      new Promise(function (r) { setTimeout(r, 2500); })
    ]).then(function () {
      mm.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          normal: "(prefers-reduced-motion: no-preference)"
        },
        function (ctx) {
          tl = ctx.conditions.reduce ? reduced() : full();
        }
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
