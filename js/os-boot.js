/* Qress-ent: Our Story (classic) hidden states only apply while scripts run. */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");
  setTimeout(function () {
    if (!root.classList.contains("os-ready")) root.classList.add("os-fail");
  }, 4000);
})();
