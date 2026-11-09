/* Qress-ent: splash gate. Decides before first paint whether the intro plays. */
(function () {
  "use strict";
  var root = document.documentElement;
  try {
    if (!/[?&]replay/.test(location.search)) {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      var type = nav ? nav.type : "navigate";
      var skip = false;
      if (type === "back_forward") skip = true;
      else if (type !== "reload" && document.referrer) {
        try {
          if (new URL(document.referrer).origin === location.origin) skip = true;
        } catch (e) {}
      }
      if (skip) {
        root.classList.add("splash-skip");
        root.classList.remove("splash-lock");
      }
    }
  } catch (e) {}
  // Failsafe: if the intro never completes (script blocked, tab throttled), unlock the page.
  setTimeout(function () {
    if (!root.classList.contains("splash-lock")) return;
    root.classList.remove("splash-lock");
    root.classList.add("splash-skip");
    if (document.body) document.body.classList.remove("splash-active");
    document.dispatchEvent(new CustomEvent("splash:reveal"));
    document.dispatchEvent(new CustomEvent("splash:done"));
  }, 12000);
})();
