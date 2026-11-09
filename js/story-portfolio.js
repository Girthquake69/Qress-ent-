/**
 * Our Story (portfolio edition): behaviour layer on top of premium.js
 * (premium.js already handles [data-reveal], [data-split-lines], [data-parallax]).
 * Here: cursor-led image preview, scroll-linked word fill, stat count-up.
 */
(function () {
  "use strict";
  var doc = document;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---- cursor-led preview ---- */
  var peek = doc.querySelector(".sp-peek");
  if (peek && fine && !reduce) {
    var img = peek.querySelector("img");
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, active = false, lastX = 0;
    var W = 230, H = 300;
    function loop() {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      var tilt = clamp((tx - lastX) * 0.35, -9, 9); lastX = tx;
      peek.style.transform = "translate3d(" + (x - W / 2).toFixed(1) + "px," + (y - H / 2).toFixed(1) + "px,0) rotate(" + tilt.toFixed(2) + "deg)";
      raf = active ? requestAnimationFrame(loop) : 0;
    }
    $$("[data-peek]").forEach(function (row) {
      row.addEventListener("pointerenter", function (e) {
        var src = row.getAttribute("data-peek");
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        tx = x = e.clientX + 40; ty = y = e.clientY; lastX = tx;
        active = true; peek.classList.add("on");
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener("pointermove", function (e) { tx = e.clientX + 40; ty = e.clientY; });
      row.addEventListener("pointerleave", function () { active = false; peek.classList.remove("on"); });
    });
  }

  /* ---- scroll-linked word fill ---- */
  var fills = $$(".sp-fill").map(function (p) {
    var text = p.textContent.replace(/\s+/g, " ").trim();
    p.setAttribute("aria-label", text);
    p.textContent = "";
    var words = text.split(" ").map(function (w, i, a) {
      var s = doc.createElement("span");
      s.className = "fw"; s.setAttribute("aria-hidden", "true"); s.textContent = w;
      p.appendChild(s);
      if (i < a.length - 1) p.appendChild(doc.createTextNode(" "));
      return s;
    });
    return { el: p, words: words, shown: -1 };
  });
  function renderFill() {
    var vh = window.innerHeight;
    fills.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var prog = reduce ? 1 : clamp((vh * 0.9 - r.top) / (vh * 0.45 + r.height), 0, 1);
      var n = Math.round(prog * f.words.length * 1.08);
      if (n === f.shown) return;
      f.words.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      f.shown = n;
    });
  }
  var tick = false;
  window.addEventListener("scroll", function () {
    if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; renderFill(); }); }
  }, { passive: true });
  window.addEventListener("resize", renderFill, { passive: true });
  renderFill();

  /* ---- stat count-up (once, when in view) ---- */
  var nums = $$("[data-count]");
  if (nums.length && "IntersectionObserver" in window && !reduce) {
    nums.forEach(function (n) { n.textContent = "0"; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, end = parseInt(el.getAttribute("data-count"), 10), t0 = null, dur = 1500;
        function step(now) {
          if (t0 === null) t0 = now;
          var p = clamp((now - t0) / dur, 0, 1), k = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(end * k);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { io.observe(n); });
  }
})();
