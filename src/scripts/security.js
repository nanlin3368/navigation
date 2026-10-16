(function () {
  "use strict";

  function _isDarkMode() {
    var htmlTheme = document.documentElement.getAttribute("data-theme");
    var bodyTheme = document.body
      ? document.body.getAttribute("data-theme")
      : null;
    if (htmlTheme === "dark" || bodyTheme === "dark") return true;
    if (htmlTheme === "light" || bodyTheme === "light") return false;
    if (document.body && document.body.classList.contains("dark")) return true;
    try {
      var bg = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-bg")
        .trim();
      if (bg) {
        var hex = bg.replace("#", "");
        if (hex.length >= 2) {
          return parseInt(hex.substring(0, 2), 16) < 80;
        }
      }
    } catch (err) {}
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  (function _injectUserSelectCSS() {
    var style = document.createElement("style");
    style.id = "security-user-select";
    style.textContent = [
      "body{",
      "  user-select:none;",
      "  -webkit-user-select:none;",
      "  -moz-user-select:none;",
      "  -ms-user-select:none;",
      "}",
      "input,textarea{",
      "  user-select:text;",
      "  -webkit-user-select:text;",
      "}",
    ].join("\n");
    (document.head || document.documentElement).appendChild(style);
  })();

  document.addEventListener("copy", function (e) {
    var tag =
      e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea") {
      e.preventDefault();
      if (e.clipboardData) e.clipboardData.setData("text/plain", "");
    }
  });

  document.addEventListener("cut", function (e) {
    var tag =
      e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea") {
      e.preventDefault();
    }
  });

  document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  document.addEventListener("keydown", function (e) {
    var key = (e.key || "").toLowerCase();

    if (e.ctrlKey || e.metaKey) {
      if (key === "s") {
        e.preventDefault();
        return false;
      }

      if (["+", "-", "=", "0"].includes(e.key)) {
        e.preventDefault();
        return false;
      }
    }
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.touches.length > 1) e.preventDefault();
    },
    { passive: false },
  );

  document.addEventListener(
    "gesturestart",
    function (e) {
      e.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener(
    "gesturechange",
    function (e) {
      e.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener(
    "gestureend",
    function (e) {
      e.preventDefault();
    },
    { passive: false },
  );

  window.addEventListener(
    "wheel",
    function (e) {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    },
    { passive: false },
  );
})();
