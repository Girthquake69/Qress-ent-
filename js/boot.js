/* Qress-ent: early boot flags (external so pages can run a strict script-src 'self' policy) */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js-motion");
  // If the motion layer never reports in, force everything visible.
  setTimeout(function () {
    if (!window.__pm) root.classList.add("motion-failsafe");
  }, 3500);
})();
