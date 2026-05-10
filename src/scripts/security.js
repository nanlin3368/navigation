/**
 * ════════════════════════════════════════
 *  通用源码防护脚本 · security.js
 *  路径: src/scripts/security.js
 *  说明: 由任意页面通过 <script src defer> 加载，无需修改即可复用。
 *
 *  主题检测策略（自动探测，兼容多种项目）：
 *    优先级 1 — data-theme="dark"（<html> 或 <body> 属性）
 *    优先级 2 — body.classList.contains('dark')
 *    优先级 3 — CSS 变量 --primary-bg 的实际计算值（兜底）
 *
 *  包含:
 *    ⓪ 禁止文本复制 CSS（user-select 动态注入）
 *    ⓪ 禁止复制/剪切事件（copy / cut 双重拦截）
 *    ① 禁用右键菜单
 *    ② 禁用危险快捷键（F12 / Ctrl+U/S/P / Ctrl+Shift+I/J/C / 截图键）
 *    ③ DevTools 尺寸检测
 *    ④ 截图 / 录屏视觉遮罩
 *    ⑤ console 陷阱
 * ════════════════════════════════════════
 */
(function () {
    'use strict';

    /* ─────────────────────────────────────────
       工具函数：自动探测当前是否为深色模式
       兼容 data-theme 属性 与 body.dark class 两种方案
    ───────────────────────────────────────── */
    function _isDarkMode() {
        // 优先级 1：<html data-theme="dark"> 或 <body data-theme="dark">
        var htmlTheme = document.documentElement.getAttribute('data-theme');
        var bodyTheme = document.body ? document.body.getAttribute('data-theme') : null;
        if (htmlTheme === 'dark' || bodyTheme === 'dark') return true;
        if (htmlTheme === 'light' || bodyTheme === 'light') return false;

        // 优先级 2：body.dark class
        if (document.body && document.body.classList.contains('dark')) return true;

        // 优先级 3：CSS 变量兜底（读取 --primary-bg 亮度判断）
        try {
            var bg = getComputedStyle(document.documentElement)
                         .getPropertyValue('--primary-bg').trim();
            if (bg) {
                // 简单判断：颜色字符串中 # 后两位（R 通道）< 80 视为深色
                var hex = bg.replace('#', '');
                if (hex.length >= 2) {
                    return parseInt(hex.substring(0, 2), 16) < 80;
                }
            }
        } catch (err) { /* 忽略 */ }

        // 最终兜底：跟随系统
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    /* ─────────────────────────────────────────
       ⓪ 禁止文本复制（CSS 动态注入，与页面样式解耦）
          body 全局禁止选中；input / textarea 保留正常选中
    ───────────────────────────────────────── */
    (function _injectUserSelectCSS() {
        var style = document.createElement('style');
        style.id  = 'security-user-select';
        style.textContent = [
            'body{',
            '  user-select:none;',
            '  -webkit-user-select:none;',
            '  -moz-user-select:none;',
            '  -ms-user-select:none;',
            '}',
            'input,textarea{',
            '  user-select:text;',
            '  -webkit-user-select:text;',
            '}'
        ].join('\n');
        (document.head || document.documentElement).appendChild(style);
    })();

    /* ─────────────────────────────────────────
       ⓪-JS 禁止复制 / 剪切事件（双重保险）
          input / textarea 内操作不受影响
    ───────────────────────────────────────── */
    document.addEventListener('copy', function (e) {
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
            if (e.clipboardData) e.clipboardData.setData('text/plain', '');
        }
    });

    document.addEventListener('cut', function (e) {
        var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
        if (tag !== 'input' && tag !== 'textarea') {
            e.preventDefault();
        }
    });

    /* ─────────────────────────────────────────
       ① 禁用右键菜单
    ───────────────────────────────────────── */
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    /* ─────────────────────────────────────────
       ② 禁用危险快捷键
          F12 / Ctrl+U / Ctrl+S / Ctrl+P
          Ctrl+Shift+I / J / C（DevTools）
          截图快捷键（PrtSc / Mac Cmd+Shift+3/4/5/6）
    ───────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
        var k = e.key ? e.key.toLowerCase() : '';

        // F12
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }

        // Ctrl+U / S / P
        if (e.ctrlKey && !e.shiftKey && ['u', 's', 'p'].includes(k)) {
            e.preventDefault();
            return false;
        }

        // Ctrl+Shift+I / J / C
        if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(k)) {
            e.preventDefault();
            return false;
        }

        // 截图：PrtSc / Win+PrtSc / Mac Cmd+Shift+3/4/5/6
        var isPrtSc   = e.key === 'PrintScreen';
        var isMacShot = e.metaKey && e.shiftKey && ['3', '4', '5', '6'].includes(e.key);
        var isWinShot = e.key === 'PrintScreen' && (e.metaKey || e.altKey);
        if (isPrtSc || isMacShot || isWinShot) {
            _showCaptureOverlay();
            e.preventDefault();
            setTimeout(_hideCaptureOverlay, 400);
        }
    });

    /* ─────────────────────────────────────────
       ③ DevTools 尺寸检测
          侧边 / 底部弹出时，outer 与 inner 宽高差 > 160px
          触发时读取当前主题，颜色与页面保持一致
    ───────────────────────────────────────── */
    var _devToolsBlocked = false;

    function _checkDevTools() {
        var wGap = window.outerWidth  - window.innerWidth;
        var hGap = window.outerHeight - window.innerHeight;
        if ((wGap > 160 || hGap > 160) && !_devToolsBlocked) {
            _devToolsBlocked = true;
            var isDark = _isDarkMode();
            var bg = isDark ? '#000000' : '#F2F2F7';
            var fg = isDark ? '#EBEBF5' : '#3C3C43';
            document.body.innerHTML =
                '<div style="display:flex;align-items:center;justify-content:center;' +
                'height:100vh;background:' + bg + ';font-family:-apple-system,sans-serif;">' +
                '<p style="font-size:18px;color:' + fg + ';text-align:center;">' +
                '⚠️ 请关闭开发者工具后刷新页面</p></div>';
        }
    }

    setInterval(_checkDevTools, 1000);

    /* ─────────────────────────────────────────
       ④ 截图 / 录屏视觉遮罩
    ───────────────────────────────────────── */
    var _overlay = null;

    function _showCaptureOverlay() {
        if (_overlay) return;
        _overlay = document.createElement('div');
        _overlay.style.cssText = [
            'position:fixed', 'inset:0', 'z-index:2147483647',
            'background:#000', 'opacity:0',
            'transition:opacity .1s ease',
            'pointer-events:none',
            'will-change:opacity'
        ].join(';');
        document.body.appendChild(_overlay);
        requestAnimationFrame(function () { _overlay.style.opacity = '1'; });
    }

    function _hideCaptureOverlay() {
        if (!_overlay) return;
        _overlay.style.opacity = '0';
        var o = _overlay;
        setTimeout(function () {
            if (o && o.parentNode) o.parentNode.removeChild(o);
            if (_overlay === o) _overlay = null;
        }, 150);
    }

    // 页面失焦时遮黑（切至录屏工具 / 系统截图界面时触发）
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            _showCaptureOverlay();
        } else {
            setTimeout(_hideCaptureOverlay, 80);
        }
    });

    /* ─────────────────────────────────────────
       ⑤ console 陷阱
          toString 触发时说明控制台已打开
    ───────────────────────────────────────── */
    var _trap = /./;
    _trap.toString = function () {
        return '⚠️ 禁止调试';
    };
    setInterval(function () {
        console.log('%c', _trap);
    }, 2000);

})();
