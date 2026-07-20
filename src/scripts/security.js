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
    var k = e.key ? e.key.toLowerCase() : "";

    if (e.key === "F12") {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && !e.shiftKey && ["u", "s", "p"].includes(k)) {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k)) {
      e.preventDefault();
      return false;
    }

    var isPrtSc = e.key === "PrintScreen";
    var isMacShot =
      e.metaKey && e.shiftKey && ["3", "4", "5", "6"].includes(e.key);
    var isWinShot = e.key === "PrintScreen" && (e.metaKey || e.altKey);
    if (isPrtSc || isMacShot || isWinShot) {
      _showCaptureOverlay();
      e.preventDefault();
      setTimeout(_hideCaptureOverlay, 400);
    }

    if ((e.ctrlKey || e.metaKey) && ["+", "-", "=", "0"].includes(e.key)) {
      e.preventDefault();
      return false;
    }
  });

  var _devToolsBlocked = false;

  function _checkDevTools() {
    var wGap = window.outerWidth - window.innerWidth;
    var hGap = window.outerHeight - window.innerHeight;
    if ((wGap > 160 || hGap > 160) && !_devToolsBlocked) {
      _devToolsBlocked = true;
      var isDark = _isDarkMode();
      var bg = isDark ? "#000000" : "#F2F2F7";
      var fg = isDark ? "#EBEBF5" : "#3C3C43";
      document.body.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:center;' +
        "height:100vh;background:" +
        bg +
        ';font-family:-apple-system,sans-serif;">' +
        '<p style="font-size:18px;color:' +
        fg +
        ';text-align:center;">' +
        "⚠️ 页面加载异常，请刷新后重试</p></div>";
    }
  }

  setInterval(_checkDevTools, 1000);

  var _overlay = null;

  function _showCaptureOverlay() {
    if (_overlay) return;
    _overlay = document.createElement("div");
    _overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "background:#000",
      "opacity:0",
      "transition:opacity .1s ease",
      "pointer-events:none",
      "will-change:opacity",
    ].join(";");
    document.body.appendChild(_overlay);
    requestAnimationFrame(function () {
      _overlay.style.opacity = "1";
    });
  }

  function _hideCaptureOverlay() {
    if (!_overlay) return;
    _overlay.style.opacity = "0";
    var o = _overlay;
    setTimeout(function () {
      if (o && o.parentNode) o.parentNode.removeChild(o);
      if (_overlay === o) _overlay = null;
    }, 150);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      _showCaptureOverlay();
    } else {
      setTimeout(_hideCaptureOverlay, 80);
    }
  });

  var _trap = /./;
  _trap.toString = function () {
    return "⚠️ 禁止调试";
  };
  setInterval(function () {
    console.log("%c", _trap);
  }, 2000);

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
