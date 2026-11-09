/**
 * Qress-ent splash: "Awaken → Orbit → Word reveal → Convergence → Lockup → Curtain"
 *
 * Dependency-free (Web Animations API): no CDN, nothing to fail on a blocked
 * network, one seekable timeline. Plays on first entry + browser refresh and
 * skips on in-site navigation. Debug: ?replay (keeps splash, shows Replay),
 * ?replay&seek=3.2 (freeze at 3.2s).
 *
 * Events: "splash:reveal" fires as the curtain starts to part (page hero
 * begins its entrance underneath); "splash:done" fires once it is removed.
 */
(function () {
  "use strict";

  var html = document.documentElement;
  var debug = /[?&]replay/.test(location.search);
  var seekMatch = location.search.match(/[?&]seek=([\d.]+)/);
  var seekTo = seekMatch ? parseFloat(seekMatch[1]) : null;

  function clearLocks() {
    html.classList.remove("splash-lock");
    if (document.body) document.body.classList.remove("splash-active");
  }
  function removeEl() {
    var el = document.getElementById("splash");
    if (el && el.parentNode) el.remove();
  }

  function shouldPlay() {
    if (debug) return true;
    try {
      var nav = performance.getEntriesByType("navigation")[0];
      var type = nav ? nav.type : "navigate";
      if (type === "reload") return true;
      if (type === "back_forward") return false;
      var ref = document.referrer || "";
      if (ref) {
        try { if (new URL(ref).origin === location.origin) return false; } catch (e) {}
      }
      return true;
    } catch (e) { return true; }
  }

  if (!shouldPlay()) {
    clearLocks();
    html.classList.add("splash-skip");
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", removeEl, { once: true });
    else removeEl();
    return;
  }

  function boot() {
    var root = document.getElementById("splash");
    if (!root) { clearLocks(); return; }
    if (!root.animate) { // very old browser: no intro, no lock
      clearLocks(); removeEl(); return;
    }

    var q = function (s) { return root.querySelector(s); };
    var el = {
      panelL: q(".panel-l"), panelR: q(".panel-r"), seam: q(".seam"), bar: q(".bar"),
      atmos: q(".atmos"), ambient: q(".ambient"), glow: q(".glow"), flare: q(".flare"),
      orbit: q(".orbit"), sweep: q(".sweep"), portrait: q(".portrait"),
      core: q(".core"), coreRing: q(".core-ring"), ring: q(".ring"),
      brand: q(".brand"), name: q(".brand-name"), divider: q(".divider"), tagline: q(".tagline"),
      btn: q(".btn-skip")
    };
    var words = Array.prototype.slice.call(root.querySelectorAll(".word"));
    var state = "playing";
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ---- split brand name into masked letters ----
    var letters = [];
    if (el.name && !reduce) {
      var txt = el.name.textContent;
      el.name.textContent = "";
      el.name.setAttribute("aria-hidden", "true");
      for (var i = 0; i < txt.length; i++) {
        var mk = document.createElement("span"); mk.className = "mk";
        var ch = document.createElement("span"); ch.className = "ch"; ch.textContent = txt[i];
        mk.appendChild(ch); el.name.appendChild(mk); letters.push(ch);
      }
    }

    // ---- tiny timeline helper (seconds; K scales the whole piece) ----
    var K = 0.82;
    var EASE = {
      out: "cubic-bezier(.22,1,.36,1)",
      out3: "cubic-bezier(.215,.61,.355,1)",
      in3: "cubic-bezier(.55,.055,.675,.19)",
      io: "cubic-bezier(.76,0,.24,1)",
      io2: "cubic-bezier(.45,0,.55,1)",
      lin: "linear"
    };
    var anims = [];
    var markers = [];
    var lastFinish = null;

    function add(target, frames, at, dur, ease, fill) {
      if (!target) return null;
      var a = target.animate(frames, {
        delay: Math.round(at * K * 1000),
        duration: Math.max(1, Math.round(dur * K * 1000)),
        easing: ease || EASE.out,
        fill: fill || "both"
      });
      a.pause();
      anims.push(a);
      return a;
    }
    function mark(at, fn) {
      markers.push({ at: at * K * 1000, fn: fn, fired: false });
    }

    var C = 3.6;            // convergence
    var L = C + 0.95;       // lockup
    var X = L + 1.75;       // exit begins
    var CURTAIN = 1.15;

    function full() {
      // Awaken
      add(el.ambient, [{ opacity: 0, transform: "scale(.7)" }, { opacity: 1, transform: "scale(1)" }], 0, 1.4, EASE.out3);
      add(el.core, [{ opacity: 0 }, { opacity: 1 }], 0.15, 0.3, EASE.out3);
      add(el.coreRing, [
        { opacity: 0, transform: "scale(.5)", offset: 0 },
        { opacity: 0.9, transform: "scale(1)", offset: 0.2 },
        { opacity: 0, transform: "scale(3.2)", offset: 1 }
      ], 0.25, 1.0, EASE.out3);
      add(el.core, [{ opacity: 0 }], 1.2, 0.4, EASE.out3, "forwards");
      add(el.bar, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], 0, X, EASE.lin);
      add(el.btn, [{ opacity: 0 }, { opacity: 1 }], 0.6, 0.4, EASE.out3);

      // Orbit path: ring appears, comet laps once; each value appears as the comet passes it
      add(el.orbit, [{ opacity: 0, transform: "scale(.85) rotate(-12deg)" }, { opacity: 1, transform: "scale(1) rotate(0deg)" }], 0.55, 1.1, EASE.out);
      add(el.sweep, [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], 0.7, 2.4, EASE.lin);
      words.forEach(function (w, i) {
        add(w, [
          { opacity: 0, transform: "translateY(10px) scale(.86)", filter: "blur(6px)" },
          { opacity: 1, transform: "translateY(0) scale(1)", filter: "blur(0px)" }
        ], 0.75 + i * 0.48, 0.8, EASE.out);
      });
      add(el.glow, [{ opacity: 0, transform: "scale(.94)" }, { opacity: 1, transform: "scale(1)" }], 1.0, 1.1, EASE.out3);
      if (el.portrait) {
        add(el.portrait, [{ opacity: 0 }, { opacity: 0.85 }], 1.1, 1.4, EASE.out3);
        add(el.portrait, [{ transform: "scale(1.07) translateY(28px)" }, { transform: "scale(1) translateY(0)" }], 1.1, 2.4, EASE.out3);
      }

      // Convergence
      add(el.ring, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.1)" }], C, 0.7, EASE.in3, "forwards");
      add(el.orbit, [{ opacity: 0, transform: "scale(.2)" }], C, 0.7, EASE.in3, "forwards");
      add(el.glow, [{ opacity: 0, transform: "scale(.94)" }], C + 0.1, 0.7, EASE.io2, "forwards");
      if (el.portrait) add(el.portrait, [{ opacity: 0 }], C + 0.1, 0.7, EASE.io2, "forwards");
      add(el.flare, [{ opacity: 0, transform: "scale(.04)" }, { opacity: 1, transform: "scale(1)" }], C + 0.5, 0.5, EASE.out3);
      add(el.flare, [{ opacity: 0, transform: "scale(1.8)" }], C + 1.0, 0.6, EASE.in3, "forwards");

      // Lockup: masked letter rise, gold flash across the word, hairline, tagline
      add(el.brand, [{ opacity: 0, transform: "translateY(18px) scale(.96)" }, { opacity: 1, transform: "translateY(0) scale(1)" }], L, 0.9, EASE.out);
      letters.forEach(function (ch, i) {
        add(ch, [{ transform: "translateY(112%)" }, { transform: "translateY(0)" }], L + i * 0.045, 0.95, EASE.out);
        add(ch, [{ color: "#fdf5e8" }, { color: "#f6c76a", offset: 0.4 }, { color: "#fdf5e8" }], L + 0.55 + i * 0.07, 0.9, EASE.io2, "forwards");
      });
      add(el.divider, [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], L + 0.4, 0.8, EASE.io);
      add(el.tagline, [{ opacity: 0, letterSpacing: ".3em" }, { opacity: 1, letterSpacing: ".14em" }], L + 0.6, 0.95, EASE.out);

      // Curtain exit: seam flashes, brand lifts away, panels part to reveal the page
      add(el.btn, [{ opacity: 0 }], X, 0.3, EASE.out3, "forwards");
      add(el.bar, [{ opacity: 0 }], X, 0.3, EASE.out3, "forwards");
      add(el.brand, [{ opacity: 0, transform: "translateY(-6px) scale(1.06)" }], X, 0.6, EASE.in3, "forwards");
      add(el.seam, [{ opacity: 0, transform: "scaleY(0)" }, { opacity: 1, transform: "scaleY(1)" }], X - 0.15, 0.45, EASE.out);
      add(el.seam, [{ opacity: 0 }], X + 0.45, 0.6, EASE.out3, "forwards");
      add(el.panelL, [{ transform: "translateX(0)" }, { transform: "translateX(-101%)" }], X + 0.15, CURTAIN, EASE.io, "forwards");
      add(el.panelR, [{ transform: "translateX(0)" }, { transform: "translateX(101%)" }], X + 0.15, CURTAIN, EASE.io, "forwards");
      add(el.atmos, [{ opacity: 0 }], X + 0.15, 0.9, EASE.io2, "forwards");

      mark(X + 0.15, function () { document.dispatchEvent(new CustomEvent("splash:reveal")); });
      return (X + 0.15 + CURTAIN) * K * 1000;
    }

    function reducedTl() {
      if (el.divider) el.divider.style.transform = "scaleX(1)";
      if (el.tagline) el.tagline.style.opacity = "1";
      add(el.brand, [{ opacity: 0 }, { opacity: 1 }], 0, 0.6, EASE.out3);
      add(el.btn, [{ opacity: 0 }, { opacity: 1 }], 0, 0.3, EASE.out3);
      add(root, [{ opacity: 1 }, { opacity: 0 }], 1.9, 0.55, EASE.io2, "forwards");
      mark(1.9, function () { document.dispatchEvent(new CustomEvent("splash:reveal")); });
      return (1.9 + 0.55) * K * 1000;
    }

    var total = 0;
    var raf = 0, t0 = 0, rate = 1, clock = 0;

    function release() {
      cancelAnimationFrame(raf);
      clearLocks();
      removeEl();
      document.dispatchEvent(new CustomEvent("splash:done"));
    }
    function finish() {
      state = "done";
      if (debug) {
        clearLocks();
        root.classList.add("is-done");
        if (el.btn) { el.btn.textContent = "Replay"; el.btn.disabled = false; el.btn.style.opacity = 1; }
        document.dispatchEvent(new CustomEvent("splash:done"));
      } else {
        release();
      }
    }

    // one clock drives marker events + completion, so skip (rate) stays in sync
    function tick(now) {
      if (!t0) t0 = now;
      clock += (now - t0) * rate; t0 = now;
      markers.forEach(function (m) { if (!m.fired && clock >= m.at) { m.fired = true; m.fn(); } });
      if (clock >= total) { finish(); return; }
      raf = requestAnimationFrame(tick);
    }
    function play() {
      state = "playing"; clock = 0; t0 = 0; rate = 1;
      markers.forEach(function (m) { m.fired = false; });
      anims.forEach(function (a) { a.updatePlaybackRate(1); a.currentTime = 0; a.play(); });
      raf = requestAnimationFrame(tick);
    }
    function skip() {
      if (state !== "playing" || rate > 1) return;
      rate = 3;
      anims.forEach(function (a) { a.updatePlaybackRate(3); });
      if (el.btn) el.btn.disabled = true;
    }

    if (el.btn) {
      el.btn.addEventListener("click", function () {
        if (state === "done") {
          root.classList.remove("is-done");
          html.classList.add("splash-lock");
          document.body.classList.add("splash-active");
          el.btn.textContent = "Skip intro"; el.btn.disabled = false; el.btn.style.opacity = "";
          play();
        } else skip();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") skip();
    });

    // ---- wait (briefly) for fonts + portrait so the first frames are clean ----
    var ready = [];
    if (document.fonts && document.fonts.load) {
      ready.push(document.fonts.load('600 48px "Playfair Display"'));
      ready.push(document.fonts.load('italic 400 24px "Playfair Display"'));
    }
    if (el.portrait && el.portrait.decode) {
      ready.push(el.portrait.decode().catch(function () { if (el.portrait.parentNode) el.portrait.remove(); el.portrait = null; }));
    }
    var started = false;
    function start() {
      if (started) return; started = true;
      total = reduce ? reducedTl() : full();
      if (seekTo !== null && debug) {
        anims.forEach(function (a) { a.currentTime = seekTo * 1000; a.pause(); });
        if (seekTo * 1000 >= (X + 0.15) * K * 1000) { /* curtain frames */ }
        document.documentElement.setAttribute("data-splash-seeked", String(seekTo));
        return;
      }
      play();
    }
    Promise.race([
      Promise.all(ready.map(function (p) { return p.catch(function () {}); })),
      new Promise(function (r) { setTimeout(r, 2000); })
    ]).then(start);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
