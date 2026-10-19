/* ==========================================================================
   Qress-ent — Our Story: kinetic scroll layer
   Vanilla JS, no dependencies. One rAF-throttled scroll loop drives:
     - the pinned name morph (QATRINAH -> QRESSINAH -> QRESS-ENT)
     - the horizontal story track
     - the opening photo, parallax, word-by-word text fill, counter-moving names
   Plus IntersectionObserver reveals and a magnetic button.
   Reduced motion: pinning, travel and scrubbing are off, content is static.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wideMQ = window.matchMedia('(min-width: 901px) and (min-height: 600px)');

  var clamp = function (v, a, b) {
    return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v));
  };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeIO = function (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };

  if (reduce) root.classList.add('os-still');

  /* ---------- Text splitting (screen-reader safe) ----------
     The container keeps the full string in aria-label; the fragments are hidden
     from assistive tech, so reading and copy/paste still work. */
  function split(el, mode) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    var i = 0;
    var words = text.split(' ');
    words.forEach(function (word, wi) {
      var wd = document.createElement('span');
      wd.className = 'wd';
      wd.setAttribute('aria-hidden', 'true');
      var units = mode === 'char' ? Array.from(word) : [word];
      units.forEach(function (u) {
        var m = document.createElement('span');
        m.className = 'm';
        var mi = document.createElement('span');
        mi.className = 'mi';
        mi.style.setProperty('--i', i++);
        mi.textContent = u;
        m.appendChild(mi);
        wd.appendChild(m);
      });
      el.appendChild(wd);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  $$('[data-split]').forEach(function (el) {
    split(el, el.getAttribute('data-split'));
    var s = el.getAttribute('data-stagger');
    if (s) el.style.setProperty('--s', s + 'ms');
  });

  /* Stagger siblings that share a parent (paragraphs under a heading, list rows). */
  $$('.os-twins-copy, .os-founder-copy, .os-principles, .os-phil-end').forEach(function (group) {
    $$('.up', group).forEach(function (el, i) {
      el.style.setProperty('--d', i * 80 + 'ms');
    });
  });
  $$('.os-j-panel').forEach(function (panel) {
    $$('.up', panel).forEach(function (el) {
      el.style.setProperty('--d', '160ms');
    });
  });
  $$('.os-mark span').forEach(function (s, i) {
    s.style.setProperty('--i', i);
  });

  /* ---------- Word fill (mission statements) ---------- */
  var fills = $$('.fill').map(function (p) {
    var text = p.textContent.replace(/\s+/g, ' ').trim();
    p.textContent = '';
    var spans = text.split(' ').map(function (w, i, arr) {
      var s = document.createElement('span');
      s.className = 'fw';
      s.textContent = w;
      p.appendChild(s);
      if (i < arr.length - 1) p.appendChild(document.createTextNode(' '));
      return s;
    });
    return { el: p, words: spans, shown: -1 };
  });

  /* ---------- Reveals ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  $$('.up, [data-split], .os-frame, .os-mark, .os-j-panel').forEach(function (el) {
    io.observe(el);
  });

  /* ---------- Hero: the name morph ---------- */
  var hero = $('.os-hero');
  var stage = $('.os-stage');
  var roll = $('.os-roll');
  var caps = $$('.os-cap');
  var lede = $('.os-lede');
  var cue = $('.os-cue');
  var stageInner = $('.os-stage-inner');

  var WORDS = ['QATRINAH', 'QRESSINAH', 'QRESS-ENT'];
  var COLS = 9;
  var cells = [];

  function buildRoll() {
    if (!roll) return;
    for (var c = 0; c < COLS; c++) {
      var cell = document.createElement('span');
      cell.className = 'os-cell';
      var stack = document.createElement('span');
      stack.className = 'os-stack';
      var glyphs = WORDS.map(function (w) {
        var v = document.createElement('span');
        v.className = 'os-v';
        var i = document.createElement('i');
        // Non-breaking space keeps layout stable when a word is shorter than COLS
        i.textContent = w.charAt(c) || '\u00A0';
        v.appendChild(i);
        stack.appendChild(v);
        return i;
      });
      glyphs[0].parentNode.style.setProperty('--c', c);
      cell.style.setProperty('--c', c);
      cell.appendChild(stack);
      roll.appendChild(cell);
      cells.push({ cell: cell, stack: stack, glyphs: glyphs, em: [0, 0, 0] });
    }
  }

  var fontPx = 16;
  function measure() {
    if (!roll || !cells.length) return;
    fontPx = parseFloat(getComputedStyle(roll).fontSize) || 16;
    cells.forEach(function (o) {
      o.em = o.glyphs.map(function (g) {
        // empty slots (QATRINAH has 8 letters) take no width, so the word stays centred
        return g.textContent === '\u00A0' ? 0 : g.getBoundingClientRect().width / fontPx;
      });
    });
  }

  var rollState = { t1: -1, t2: -1 };
  function renderRoll(p) {
    if (!cells.length) return;
    var t1 = clamp((p - 0.16) / 0.28);  /* after crossfade settles on QATRINAH */
    var t2 = clamp((p - 0.48) / 0.28);
    if (t1 === rollState.t1 && t2 === rollState.t2) return;
    rollState.t1 = t1;
    rollState.t2 = t2;
    var d = 0.07;
    cells.forEach(function (o, c) {
      var pos = 0;
      [t1, t2].forEach(function (t, k) {
        var a = WORDS[k].charAt(c) || '';
        var b = WORDS[k + 1].charAt(c) || '';
        if (a === b) {
          // Same glyph: advance the stack index without a visible roll
          pos += t > 0 ? 1 : 0;
          return;
        }
        pos += easeIO(clamp(t * (1 + COLS * d) - c * d));
      });
      o.stack.style.transform = 'translate3d(0,' + (-pos / 3 * 100) + '%,0)';
      var idx = Math.min(2, Math.floor(pos));
      var frac = pos - idx;
      var w = lerp(o.em[idx], o.em[Math.min(2, idx + 1)], frac) * fontPx;
      o.cell.style.width = Math.max(0, w) + 'px';
    });
  }

  /* Field colour follows the name: rich brown -> terracotta -> gold */
  var BG = [[58, 28, 6], [139, 69, 19], [232, 160, 32]];
  var FG = [[253, 245, 232], [253, 245, 232], [58, 28, 6]];
  function mix(a, b, t) {
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  }
  function rgb(c, a) {
    return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' +
      (a === undefined ? 1 : a.toFixed(3)) + ')';
  }

  function heroTarget() {
    if (!hero) return 0;
    var r = hero.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, hero.offsetHeight - (stage ? stage.offsetHeight : window.innerHeight)));
  }

  var morphEntered = false;
  function renderHero(p) {
    if (!hero) return;

    /*
      Continuous timeline (p 0 → 1 over the hero track):
        0.00–0.04  h1 + lede fully visible (first paint, no flash)
        0.04–0.18  crossfade: h1 exits, roll enters at QATRINAH
        0.18–0.45  QATRINAH → QRESSINAH
        0.45–0.72  QRESSINAH → QRESS-ENT
        0.72–0.88  lede returns, captions settle
        0.88–1.00  stage fades out into founder
    */
    var blend = easeIO(clamp((p - 0.04) / 0.14));          // 0 → 1 over the handoff
    var morphing = p > 0.04;
    var morphDone = blend >= 0.999;

    root.classList.toggle('os-morph', morphing);
    root.classList.toggle('os-morph-done', morphDone);

    // One-shot letter entrance when the blend first commits
    if (morphing && !morphEntered) {
      morphEntered = true;
      root.classList.add('os-morph-enter');
      setTimeout(function () { root.classList.remove('os-morph-enter'); }, 1200);
    }
    if (!morphing) morphEntered = false;

    // Drive the crossfade via CSS variables on the hero (scoped, no layout thrash)
    hero.style.setProperty('--h1-o', (1 - blend).toFixed(3));
    hero.style.setProperty('--h1-y', (-blend * 28).toFixed(1) + 'px');
    hero.style.setProperty('--h1-s', (1 - blend * 0.04).toFixed(4));
    hero.style.setProperty('--roll-o', blend.toFixed(3));
    hero.style.setProperty('--caps-o', clamp((blend - 0.35) / 0.65).toFixed(3));

    // Lede: full with the h1, exits with the crossfade, returns near the end
    var ledeIn = easeIO(clamp((p - 0.70) / 0.14));
    var ledeO = clamp((1 - blend) + ledeIn);
    hero.style.setProperty('--lede-o', ledeO.toFixed(3));
    hero.style.setProperty('--lede-y', ((1 - ledeO) * 16).toFixed(1) + 'px');

    if (morphing) renderRoll(p);

    var c1 = easeIO(clamp((p - 0.10) / 0.28));
    var c2 = easeIO(clamp((p - 0.46) / 0.28));
    var c3 = easeIO(clamp((p - 0.86) / 0.12));
    hero.style.backgroundColor = rgb(mix(mix(BG[0], BG[1], c1), BG[2], c2), 1 - c3);
    if (stageInner) {
      stageInner.style.opacity = (1 - c3).toFixed(3);
      stageInner.style.transform =
        'translate3d(0,' + (-c3 * 36).toFixed(1) + 'px,0) scale(' + (1 - 0.025 * c3).toFixed(4) + ')';
    }
    hero.style.color = rgb(mix(mix(FG[0], FG[1], c1), FG[2], c2));

    var capIdx = p < 0.30 ? 0 : p < 0.62 ? 1 : 2; /* caption swaps at each morph's midpoint */
    caps.forEach(function (c, i) {
      c.classList.toggle('on', morphing && i === capIdx);
    });
    if (cue) cue.classList.toggle('off', p > 0.04);
  }

  /* ---------- Journey: vertical scroll -> horizontal travel ---------- */
  var journey = $('.os-journey');
  var track = $('.os-j-track');
  var fill = $('.os-j-fill');
  var jDist = 0;

  var jStage = $('.os-j-stage');
  var DWELL = 0.3; /* the last card rests for 30% of a screen before the pin releases */

  function pinOn() {
    return !reduce && wideMQ.matches;
  }

  function sizeJourney() {
    if (!journey || !track) return;
    root.classList.remove('os-nopin');
    var pin = pinOn();
    if (pin && jStage) {
      // A card must never be clipped: if the tallest one doesn't fit the pinned stage, stack instead
      var cs = getComputedStyle(jStage);
      var room = jStage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      if (track.offsetHeight > room) pin = false;
    }
    if (!pin) {
      root.classList.add('os-nopin');
      journey.style.height = '';
      track.style.transform = '';
      if (fill) fill.style.transform = '';
      jDist = 0;
      return;
    }
    jDist = Math.max(0, track.offsetWidth - window.innerWidth);
    journey.style.height = (jDist + jStage.offsetHeight + DWELL * window.innerHeight) + 'px';
  }

  function journeyTarget() {
    if (!jDist || !journey) return 0;
    return clamp(-journey.getBoundingClientRect().top / jDist);
  }

  function renderJourney(p) {
    if (!jDist || !track) return;
    track.style.transform = 'translate3d(' + (-p * jDist) + 'px,0,0)';
    if (fill) fill.style.transform = 'scaleX(' + p + ')';
  }

  /* ---------- Scroll-linked extras ---------- */
  var pars = $$('[data-par]').map(function (img) {
    return {
      img: img,
      host: img.parentNode,
      k: parseFloat(img.getAttribute('data-par')) || 0.1
    };
  });
  var bleed = $('.os-bleed');
  var strips = $$('.os-strip-row');
  var strip = $('.os-strip');

  function renderExtras() {
    var vh = window.innerHeight;
    var vw = window.innerWidth;

    pars.forEach(function (o) {
      if (!o.host) return;
      var r = o.host.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var lim = r.height * 0.09 - 1; /* never travel past the overscan, so no edge ever shows */
      var dy = Math.max(-lim, Math.min(lim, (r.top + r.height / 2 - vh / 2) * -o.k));
      o.img.style.setProperty('--py', dy.toFixed(1) + 'px');
    });

    if (bleed) {
      var br = bleed.getBoundingClientRect();
      var k = clamp((vh - br.top) / (vh * 0.8));
      bleed.style.setProperty('--k', easeIO(k).toFixed(3));
    }

    if (strip) {
      var sr = strip.getBoundingClientRect();
      var q = clamp((vh - sr.top) / (vh + sr.height));
      strips.forEach(function (row) {
        var dir = parseFloat(row.getAttribute('data-dir')) || 0;
        var travel = vw * 0.55;
        var x = dir < 0 ? lerp(0, -travel, q) : lerp(-travel * 0.4, travel * 0.6, q);
        row.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      });
    }

    fills.forEach(function (f) {
      var r = f.el.getBoundingClientRect();
      var prog = clamp((vh * 0.88 - r.top) / (vh * 0.42 + r.height));
      var n = Math.round(prog * f.words.length * 1.1);
      if (n === f.shown) return;
      f.words.forEach(function (w, i) {
        w.classList.toggle('on', i < n);
      });
      f.shown = n;
    });
  }

  /* ---------- Magnetic button ---------- */
  var cta = $('.os-cta');
  if (cta && !reduce && window.matchMedia('(hover: hover)').matches) {
    cta.addEventListener('pointermove', function (e) {
      var r = cta.getBoundingClientRect();
      var x = (e.clientX - (r.left + r.width / 2)) * 0.22;
      var y = (e.clientY - (r.top + r.height / 2)) * 0.32;
      cta.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
    cta.addEventListener('pointerleave', function () {
      cta.style.transform = '';
    });
  }

  /* ---------- Loop (progress is eased so scrubbing feels like inertia) ---------- */
  var ticking = false;
  var snap = true;
  var lastT = 0;
  var sm = { h: 0, j: 0 };
  var coarse = window.matchMedia('(pointer: coarse)');
  var prog = document.createElement('div');
  var maxScroll = 1;
  prog.className = 'os-progress';
  prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);

  function measureDoc() {
    maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
  }
  function ease(cur, target, k) {
    var d = target - cur;
    return Math.abs(d) < 0.0004 ? target : cur + d * k;
  }

  /* Time-based easing: identical feel at 60, 90 and 120 Hz. Touch devices already
     have native momentum, so they track 1:1 with no added lag. */
  function frame(now) {
    ticking = false;
    now = now || performance.now();
    var dt = lastT ? Math.min(64, now - lastT) : 16;
    lastT = now;
    var again = false;
    if (!reduce) {
      var th = heroTarget();
      var tj = journeyTarget();
      if (snap || coarse.matches) {
        sm.h = th;
        sm.j = tj;
        snap = false;
      } else {
        sm.h = ease(sm.h, th, 1 - Math.exp(-dt / 110));
        sm.j = ease(sm.j, tj, 1 - Math.exp(-dt / 85));
        again = sm.h !== th || sm.j !== tj;
      }
      renderHero(sm.h);
      renderJourney(sm.j);
    }
    renderExtras();
    prog.style.transform = 'scaleX(' + clamp(window.pageYOffset / maxScroll).toFixed(4) + ')';
    if (again) request(); else lastT = 0;
  }

  function request() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  function layout() {
    if (!reduce) {
      measure();
      rollState.t1 = rollState.t2 = -1;
    }
    sizeJourney();
    measureDoc();
    snap = true;
    frame();
  }

  if (!reduce) buildRoll();
  window.addEventListener('scroll', request, { passive: true });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // Mobile URL-bar show/hide fires height-only resizes mid-scroll: don't re-measure for those
    if (coarse.matches && window.innerWidth === lastW) { measureDoc(); request(); return; }
    lastW = window.innerWidth;
    layout();
  });
  if (window.ResizeObserver) new ResizeObserver(function () { measureDoc(); request(); }).observe(document.body);

  // Support both modern and legacy matchMedia change listeners
  if (wideMQ.addEventListener) {
    wideMQ.addEventListener('change', layout);
  } else if (wideMQ.addListener) {
    wideMQ.addListener(layout);
  }

  root.classList.add('os-ready');
  layout();

  /* The letter widths depend on the real typeface, so wait for Playfair before
     measuring and showing the name. Falls back after 2.5s so it never stays hidden. */
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    layout();
    if (roll) roll.classList.add('ready');
  }

  if (document.fonts && document.fonts.load) {
    // Load a representative sample that covers the morph glyphs
    document.fonts
      .load('500 100px "Playfair Display"', 'QATRINAH QRESS-ENT')
      .then(reveal, reveal);
    if (document.fonts.addEventListener) {
      document.fonts.addEventListener('loadingdone', layout);
    }
  } else {
    window.addEventListener('load', reveal);
  }
  setTimeout(reveal, 2500);
  window.addEventListener('load', layout);
})();
