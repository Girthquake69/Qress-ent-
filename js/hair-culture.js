/**
 * Hair & Culture: section nav (scroll-spy + sliding marker), header sync,
 * essay reading progress. No innerHTML, no dynamic strings from the URL:
 * the hash is only ever compared against a fixed allowlist.
 */
(function () {
  "use strict";
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ALLOWED = { "hair-care": 1, "hairstyles": 1, "culture": 1, "identity": 1 };

  var nav = doc.querySelector(".hx-nav");
  var inner = nav && nav.querySelector(".hx-nav-inner");
  var links = nav ? [].slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  var sections = [];
  links.forEach(function (a) {
    var id = (a.getAttribute("href") || "").slice(1);
    if (!ALLOWED[id]) return;
    var el = doc.getElementById(id);
    if (el) sections.push({ id: id, el: el, link: a });
  });

  var activeId = null;
  function mark(id) {
    if (id === activeId) return;
    activeId = id;
    var current = null;
    sections.forEach(function (s) {
      var on = s.id === id;
      s.link.classList.toggle("is-active", on);
      if (on) { s.link.setAttribute("aria-current", "true"); current = s.link; }
      else s.link.removeAttribute("aria-current");
    });
    if (!inner) return;
    if (current) {
      inner.style.setProperty("--x", current.offsetLeft + "px");
      inner.style.setProperty("--w", current.offsetWidth + "px");
      inner.classList.add("has-active");
      var left = current.offsetLeft - (inner.clientWidth - current.offsetWidth) / 2;
      if (inner.scrollWidth > inner.clientWidth) {
        inner.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
      }
    } else {
      inner.classList.remove("has-active");
    }
  }

  var essay = doc.querySelector(".hx-essay");
  var bar = doc.querySelector(".hx-essay-progress");
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight || 800;
    var probe = vh * 0.38;
    var found = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].el.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { found = sections[i].id; break; }
    }
    mark(found);

    if (essay && bar) {
      var er = essay.getBoundingClientRect();
      var p = (vh * 0.55 - er.top) / Math.max(1, er.height);
      bar.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    }
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { activeId = null; onScroll(); }, { passive: true });

  /* keep the nav pill clear of the site header while it slides in and out */
  var header = doc.querySelector(".site-header");
  if (nav && header) {
    var sync = function () { nav.classList.toggle("is-low", !header.classList.contains("is-hidden")); };
    sync();
    if ("MutationObserver" in window) {
      new MutationObserver(sync).observe(header, { attributes: true, attributeFilter: ["class"] });
    }
  }

  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { activeId = null; onScroll(); });
  onScroll();
})();
