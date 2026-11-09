/**
 * Qress-ent: premium behaviour layer
 * Scroll reveals, masked headline rise, parallax, header hide/show,
 * reading progress, essay rhythm. No dependencies. Native scroll only.
 * Everything degrades to fully visible content if this file never runs
 * (see the failsafe snippet in each page's <head>).
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  window.__pm = true;

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function $(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---------- a11y: skip link + main landmark id ---------- */
  (function skipLink() {
    var main = doc.querySelector("main");
    if (!main) return;
    if (!main.id) main.id = "main";
    if (doc.querySelector(".skip-link")) return;
    var a = doc.createElement("a");
    a.className = "skip-link";
    a.href = "#" + main.id;
    a.textContent = "Skip to content";
    doc.body.insertBefore(a, doc.body.firstChild);
  })();

  /* ---------- nav: aria-current ---------- */
  $(".nav-links a.active").forEach(function (a) { a.setAttribute("aria-current", "page"); });

  /* ---------- masked line-rise: stagger index ---------- */
  $("[data-split-lines]").forEach(function (h) {
    $(".ln > span", h).forEach(function (s, i) { s.style.setProperty("--i", i); });
  });

  /* ---------- essay rhythm: staccato lines -> big serif beats, prose stays calm ---------- */
  var essay = doc.querySelector(".essay-body");
  if (essay) {
    var prevTier = "";
    $(":scope > p", essay).forEach(function (p) {
      var len = (p.textContent || "").trim().length;
      var tier = len <= 34 ? "xs" : len <= 84 ? "beat" : "prose";
      p.classList.add("t-" + tier);
      if (prevTier && prevTier !== tier) p.classList.add("t-shift");
      prevTier = tier;
    });
  }

  /* ---------- reveal observer ---------- */
  var io = null;
  function reveal(el) { el.classList.add("is-in"); if (io) io.unobserve(el); }

  function buildObserver() {
    if (!("IntersectionObserver" in window) || reduce) {
      $("[data-reveal], [data-split-lines], .essay-body > p").forEach(reveal);
      return;
    }
    var queue = [];
    var flushing = false;
    function flush() {
      flushing = false;
      // stagger siblings that enter together
      var batch = queue.splice(0, queue.length);
      batch.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left; });
      batch.forEach(function (el, i) {
        el.style.setProperty("--d", Math.min(i, 6) * 90);
        reveal(el);
      });
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        queue.push(e.target);
        io.unobserve(e.target);
      });
      if (queue.length && !flushing) { flushing = true; requestAnimationFrame(flush); }
    }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });

    $("[data-reveal], [data-split-lines], .essay-body > p").forEach(function (el) {
      // hero elements are driven by startHero()
      if (el.closest(".hero-lead") && el.hasAttribute("data-split-lines")) return;
      io.observe(el);
    });
  }

  /* ---------- hero entrance (waits for splash when present) ---------- */
  function startHero() {
    var heroItems = $("[data-hero]");
    heroItems.forEach(function (el, i) { el.style.setProperty("--d", 380 + i * 110); });
    var h1 = doc.querySelector(".hero-lead [data-split-lines]");
    if (h1) {
      $(".ln > span", h1).forEach(function (s, i) { s.style.setProperty("--i", i); });
      requestAnimationFrame(function () { h1.classList.add("is-in"); });
    }
    root.classList.add("hero-ready");
  }

  function boot() {
    buildObserver();
    // inner pages: page-hero label etc. get hero-ready for hairline
    var splashing = root.classList.contains("splash-lock") && !root.classList.contains("splash-skip");
    if (splashing) {
      var started = false;
      var go = function () { if (started) return; started = true; startHero(); };
      doc.addEventListener("splash:reveal", go, { once: true });
      doc.addEventListener("splash:done", go, { once: true });
      setTimeout(go, 13000); // safety net
    } else {
      startHero();
    }
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
  else boot();

  /* ---------- scroll-driven: progress, header, parallax ---------- */
  var bar = doc.createElement("div");
  bar.className = "read-progress";
  bar.setAttribute("aria-hidden", "true");
  // Our Story already ships its own progress bar
  if (!doc.querySelector("main.os")) doc.body.appendChild(bar);

  var header = doc.querySelector(".site-header");
  var parallax = canHover && !reduce ? $("[data-parallax] img") : [];
  var lastY = window.pageYOffset;
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    bar.style.setProperty("--p", Math.min(1, Math.max(0, y / max)).toFixed(4));

    if (header) {
      var menuOpen = doc.body.classList.contains("nav-open");
      var goingDown = y > lastY + 4;
      var goingUp = y < lastY - 4;
      if (!menuOpen && goingDown && y > 520) header.classList.add("is-hidden");
      else if (goingUp || y < 120 || menuOpen) header.classList.remove("is-hidden");
    }
    lastY = y;

    if (parallax.length) {
      var vh = window.innerHeight;
      parallax.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var t = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around viewport centre
        img.style.transform = "translate3d(0," + (t * -28).toFixed(1) + "px,0) scale(1.08)";
      });
    }
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* keep header visible while keyboard focus is inside it */
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
})();
