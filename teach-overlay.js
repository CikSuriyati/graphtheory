/*!
 * teach-overlay.js — a classroom annotation layer for your own website.
 *
 * Drop this on any page and you can draw over it while you teach.
 *
 *   <script src="teach-overlay.js" defer></script>
 *
 * Toggle drawing mode with  Option/Alt + D  (or click the pencil button, bottom right).
 * Escape leaves drawing mode so you can click the page again.
 *
 * Marks are anchored to the page content, so you can keep scrolling while you
 * draw and everything stays attached to what you drew it on.
 *
 * Everything lives inside a shadow root, so it cannot inherit or leak CSS
 * from the host page.
 *
 * No dependencies. No build step. No network calls.
 */
(function () {
  'use strict';

  if (window.__teachOverlay) return;

  /* ------------------------------------------------------------------ *
   * Config — tweak these freely
   * ------------------------------------------------------------------ */
  var CONFIG = {
    // Only wake up if the address carries ?teach — students loading the page
    // normally get nothing at all. Once you arrive with the flag, it sticks
    // for the rest of that browser tab, so you can move around your site
    // without retyping it. Set to null to make it always available.
    gate: null,

    toggleKey: 'd',          // used with Option/Alt
    colors: [
      { name: 'Red',    hex: '#ff3b30' },
      { name: 'Yellow', hex: '#ffcc00' },
      { name: 'Green',  hex: '#30d158' },
      { name: 'Blue',   hex: '#0a84ff' },
      { name: 'White',  hex: '#ffffff' },
      { name: 'Black',  hex: '#1c1c1e' }
    ],
    widths: [3, 6, 12],
    spotlightRadius: 190,
    spotlightDim: 0.74,

    // true  → marks stick to the page content and scroll along with it.
    //         You can scroll freely while still in drawing mode.
    // false → marks stay pinned to the screen, and scrolling is held still
    //         while drawing (otherwise the page slides out from under them).
    anchorToPage: true
  };

  /* ------------------------------------------------------------------ *
   * Gate — bail out entirely unless this is a teaching session
   * ------------------------------------------------------------------ */
  if (CONFIG.gate) {
    var unlocked = false;
    var STORE_KEY = 'teach-overlay:on';
    try {
      if (new URLSearchParams(window.location.search).has(CONFIG.gate)) {
        unlocked = true;
        window.sessionStorage.setItem(STORE_KEY, '1');
      } else if (window.sessionStorage.getItem(STORE_KEY) === '1') {
        unlocked = true;
      }
    } catch (err) {
      // private browsing can block sessionStorage — fall back to the URL only
      unlocked = window.location.search.indexOf(CONFIG.gate) !== -1;
    }
    if (!unlocked) return;
  }

  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (fn) { return setTimeout(fn, 16); };

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  var S = {
    active: false,
    tool: 'pen',
    color: CONFIG.colors[0].hex,
    width: CONFIG.widths[1],
    shapes: [],
    draft: null,
    spotlight: false,
    glow: false,
    blank: false,
    pointer: { x: -9999, y: -9999 },
    fxRunning: false
  };

  /* ------------------------------------------------------------------ *
   * DOM — everything inside a shadow root
   * ------------------------------------------------------------------ */
  var host = document.createElement('div');
  host.id = 'teach-overlay-host';
  host.style.cssText =
    'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
  var root = host.attachShadow({ mode: 'open' });

  root.innerHTML = [
    '<style>',
    ':host,*{box-sizing:border-box;}',
    '.backdrop{position:fixed;inset:0;background:#fbfbfd;opacity:0;',
    '  transition:opacity .18s ease;pointer-events:none;}',
    '.backdrop.on{opacity:1;}',
    'canvas{position:fixed;inset:0;width:100%;height:100%;display:block;}',
    '#ink{pointer-events:none;touch-action:none;cursor:crosshair;}',
    '#ink.on{pointer-events:auto;}',
    '#fx{pointer-events:none;}',

    /* launcher */
    '.launch{position:fixed;right:20px;bottom:20px;width:52px;height:52px;',
    '  border-radius:50%;border:none;pointer-events:auto;cursor:pointer;',
    '  background:#1c1c1e;color:#fff;font-size:22px;line-height:1;',
    '  box-shadow:0 6px 22px rgba(0,0,0,.32);display:flex;',
    '  align-items:center;justify-content:center;opacity:.5;',
    '  transition:opacity .16s ease,transform .16s ease;}',
    '.launch:hover{opacity:1;transform:scale(1.06);}',
    '.launch.hidden{display:none;}',

    /* toolbar */
    '.bar{position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(140%);',
    '  display:flex;align-items:center;gap:6px;padding:8px;border-radius:16px;',
    '  background:rgba(28,28,30,.92);backdrop-filter:blur(18px);',
    '  -webkit-backdrop-filter:blur(18px);box-shadow:0 10px 34px rgba(0,0,0,.4);',
    '  pointer-events:auto;opacity:0;transition:transform .2s ease,opacity .2s ease;',
    '  font:500 13px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '  color:#fff;user-select:none;max-width:calc(100vw - 24px);flex-wrap:wrap;',
    '  justify-content:center;}',
    '.bar.on{transform:translateX(-50%) translateY(0);opacity:1;}',
    '.bar button{all:unset;cursor:pointer;width:40px;height:40px;border-radius:11px;',
    '  display:flex;align-items:center;justify-content:center;font-size:17px;',
    '  transition:background .12s ease;}',
    '.bar button:hover{background:rgba(255,255,255,.14);}',
    '.bar button.sel{background:#fff;color:#1c1c1e;}',
    '.sep{width:1px;height:26px;background:rgba(255,255,255,.2);margin:0 4px;}',
    '.sw{all:unset;cursor:pointer;width:26px;height:26px;border-radius:50%;',
    '  box-shadow:inset 0 0 0 1px rgba(0,0,0,.28);transition:transform .12s ease;}',
    '.sw:hover{transform:scale(1.14);}',
    '.sw.sel{box-shadow:0 0 0 2.5px #fff,inset 0 0 0 1px rgba(0,0,0,.28);}',
    '.wd{all:unset;cursor:pointer;width:30px;height:34px;border-radius:9px;',
    '  display:flex;align-items:center;justify-content:center;}',
    '.wd:hover{background:rgba(255,255,255,.14);}',
    '.wd.sel{background:rgba(255,255,255,.24);}',
    '.wd i{display:block;background:#fff;border-radius:99px;}',

    /* text input */
    '.tin{position:fixed;min-width:2ch;padding:2px 6px;border:2px dashed rgba(255,255,255,.45);',
    '  border-radius:6px;background:rgba(0,0,0,.35);outline:none;white-space:pre;',
    '  pointer-events:auto;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '  font-weight:600;}',

    /* hint */
    '.hint{position:fixed;left:50%;top:20px;transform:translateX(-50%);',
    '  padding:7px 15px;border-radius:99px;background:rgba(28,28,30,.9);color:#fff;',
    '  font:500 12.5px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '  opacity:0;transition:opacity .25s ease;pointer-events:none;letter-spacing:.2px;}',
    '.hint.on{opacity:1;}',
    '</style>',

    '<div class="backdrop" id="backdrop"></div>',
    '<canvas id="ink"></canvas>',
    '<canvas id="fx"></canvas>',
    '<div class="hint" id="hint"></div>',
    '<button class="launch" id="launch" title="Annotate (Option+D)">&#9998;</button>',
    '<div class="bar" id="bar"></div>'
  ].join('');

  document.documentElement.appendChild(host);

  var ink = root.getElementById('ink');
  var fx = root.getElementById('fx');
  var bar = root.getElementById('bar');
  var hintEl = root.getElementById('hint');
  var launch = root.getElementById('launch');
  var backdrop = root.getElementById('backdrop');
  var ictx = ink.getContext('2d');
  var fctx = fx.getContext('2d');

  /* ------------------------------------------------------------------ *
   * Toolbar
   * ------------------------------------------------------------------ */
  var TOOLS = [
    { id: 'pen',         icon: '✏️', key: 'P', label: 'Pen' },
    { id: 'highlighter', icon: '🖍',  key: 'H', label: 'Highlighter' },
    { id: 'arrow',       icon: '↗',        key: 'A', label: 'Arrow' },
    { id: 'box',         icon: '▢',        key: 'R', label: 'Box' },
    { id: 'text',        icon: 'T',             key: 'T', label: 'Text' },
    { id: 'eraser',      icon: '⌫',        key: 'E', label: 'Eraser' }
  ];

  function el(tag, cls, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  TOOLS.forEach(function (t) {
    var b = el('button', '', { title: t.label + '  (' + t.key + ')', 'data-tool': t.id });
    b.textContent = t.icon;
    b.addEventListener('click', function () { setTool(t.id); });
    bar.appendChild(b);
  });

  bar.appendChild(el('div', 'sep'));

  CONFIG.colors.forEach(function (c) {
    var b = el('button', 'sw', { title: c.name, 'data-color': c.hex });
    b.style.background = c.hex;
    b.style.width = '26px';
    b.style.height = '26px';
    b.addEventListener('click', function () { setColor(c.hex); });
    bar.appendChild(b);
  });

  bar.appendChild(el('div', 'sep'));

  CONFIG.widths.forEach(function (w) {
    var b = el('button', 'wd', { title: w + 'px', 'data-width': String(w) });
    var dot = el('i');
    var d = Math.max(4, Math.round(w * 1.25));
    dot.style.width = d + 'px';
    dot.style.height = d + 'px';
    b.appendChild(dot);
    b.addEventListener('click', function () { setWidth(w); });
    bar.appendChild(b);
  });

  bar.appendChild(el('div', 'sep'));

  function actionBtn(icon, title, fn, id) {
    var b = el('button', '', { title: title });
    if (id) b.id = id;
    b.textContent = icon;
    b.addEventListener('click', fn);
    bar.appendChild(b);
    return b;
  }

  var spotBtn = actionBtn('🔦', 'Spotlight  (S)', toggleSpotlight, 'spot');
  var glowBtn = actionBtn('◎', 'Highlight cursor  (G)', toggleGlow, 'glow');
  var blankBtn = actionBtn('□', 'Blank canvas  (B)', toggleBlank, 'blank');
  bar.appendChild(el('div', 'sep'));
  actionBtn('↶', 'Undo  (Cmd+Z)', undo);
  actionBtn('🗑', 'Clear all  (C)', clearAll);
  actionBtn('✕', 'Exit  (Esc)', function () { setActive(false); });

  /* ------------------------------------------------------------------ *
   * Canvas sizing
   * ------------------------------------------------------------------ */
  var dpr = 1;

  function sizeCanvases() {
    dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    [ink, fx].forEach(function (c) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    });
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  window.addEventListener('resize', sizeCanvases);
  sizeCanvases();

  /* ------------------------------------------------------------------ *
   * Drawing
   * ------------------------------------------------------------------ */
  function strokeStyleFor(s) {
    ictx.lineCap = 'round';
    ictx.lineJoin = 'round';
    ictx.strokeStyle = s.color;
    ictx.fillStyle = s.color;
    ictx.globalAlpha = s.type === 'highlighter' ? 0.32 : 1;
    ictx.lineWidth = s.type === 'highlighter' ? s.width * 4 : s.width;
  }

  function drawShape(s) {
    strokeStyleFor(s);

    if (s.type === 'pen' || s.type === 'highlighter') {
      var p = s.points;
      if (!p || p.length === 0) return;
      ictx.beginPath();
      if (p.length === 1) {
        ictx.arc(p[0].x, p[0].y, ictx.lineWidth / 2, 0, Math.PI * 2);
        ictx.fill();
      } else {
        ictx.moveTo(p[0].x, p[0].y);
        for (var i = 1; i < p.length - 1; i++) {
          var mx = (p[i].x + p[i + 1].x) / 2;
          var my = (p[i].y + p[i + 1].y) / 2;
          ictx.quadraticCurveTo(p[i].x, p[i].y, mx, my);
        }
        ictx.lineTo(p[p.length - 1].x, p[p.length - 1].y);
        ictx.stroke();
      }
    } else if (s.type === 'box') {
      ictx.beginPath();
      var r = Math.min(8, Math.abs(s.x1 - s.x0) / 3, Math.abs(s.y1 - s.y0) / 3);
      roundRect(ictx, s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0, Math.max(0, r));
      ictx.stroke();
    } else if (s.type === 'arrow') {
      drawArrow(s);
    } else if (s.type === 'text') {
      ictx.globalAlpha = 1;
      ictx.font = '600 ' + s.size + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
      ictx.textBaseline = 'top';
      ictx.fillText(s.text, s.x0, s.y0);
    }

    ictx.globalAlpha = 1;
  }

  function roundRect(ctx, x, y, w, h, r) {
    if (w < 0) { x += w; w = -w; }
    if (h < 0) { y += h; h = -h; }
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawArrow(s) {
    var dx = s.x1 - s.x0;
    var dy = s.y1 - s.y0;
    var len = Math.hypot(dx, dy);
    if (len < 2) return;
    var head = Math.min(len * 0.34, 12 + s.width * 3);
    var ang = Math.atan2(dy, dx);
    var bx = s.x1 - Math.cos(ang) * head * 0.72;
    var by = s.y1 - Math.sin(ang) * head * 0.72;

    ictx.beginPath();
    ictx.moveTo(s.x0, s.y0);
    ictx.lineTo(bx, by);
    ictx.stroke();

    ictx.beginPath();
    ictx.moveTo(s.x1, s.y1);
    ictx.lineTo(
      s.x1 - Math.cos(ang - 0.42) * head,
      s.y1 - Math.sin(ang - 0.42) * head
    );
    ictx.lineTo(
      s.x1 - Math.cos(ang + 0.42) * head,
      s.y1 - Math.sin(ang + 0.42) * head
    );
    ictx.closePath();
    ictx.fill();
  }

  function redraw() {
    ictx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // Shapes are stored in page coordinates; shift the whole canvas by the
    // current scroll offset so they land on the content they were drawn on.
    ictx.save();
    ictx.translate(-scrollX(), -scrollY());
    for (var i = 0; i < S.shapes.length; i++) drawShape(S.shapes[i]);
    if (S.draft) drawShape(S.draft);
    ictx.restore();
  }

  /* ------------------------------------------------------------------ *
   * Pointer handling
   * ------------------------------------------------------------------ */
  function scrollX() {
    return CONFIG.anchorToPage ? (window.scrollX || window.pageXOffset || 0) : 0;
  }
  function scrollY() {
    return CONFIG.anchorToPage ? (window.scrollY || window.pageYOffset || 0) : 0;
  }

  // Pointer position in canvas space: page coordinates when anchored to the
  // page, screen coordinates when not.
  function pos(e) {
    return { x: e.clientX + scrollX(), y: e.clientY + scrollY() };
  }

  ink.addEventListener('pointerdown', function (e) {
    if (!S.active) return;
    e.preventDefault();
    ink.setPointerCapture(e.pointerId);
    var p = pos(e);

    if (S.tool === 'eraser') { eraseAt(p); return; }
    if (S.tool === 'text') { openTextInput(p); return; }

    if (S.tool === 'pen' || S.tool === 'highlighter') {
      S.draft = { type: S.tool, color: S.color, width: S.width, points: [p] };
    } else {
      S.draft = {
        type: S.tool, color: S.color, width: S.width,
        x0: p.x, y0: p.y, x1: p.x, y1: p.y
      };
    }
    redraw();
  });

  ink.addEventListener('pointermove', function (e) {
    var p = pos(e);
    if (!S.active || !S.draft) {
      if (S.tool === 'eraser' && S.active && e.buttons === 1) eraseAt(p);
      return;
    }
    if (S.draft.points) {
      var last = S.draft.points[S.draft.points.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.4) return;
      S.draft.points.push(p);
    } else {
      S.draft.x1 = p.x;
      S.draft.y1 = p.y;
      if (e.shiftKey && (S.draft.type === 'arrow')) {
        // constrain to 45° increments
        var dx = p.x - S.draft.x0, dy = p.y - S.draft.y0;
        var a = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
        var l = Math.hypot(dx, dy);
        S.draft.x1 = S.draft.x0 + Math.cos(a) * l;
        S.draft.y1 = S.draft.y0 + Math.sin(a) * l;
      }
    }
    redraw();
  });

  function endStroke(e) {
    if (!S.draft) return;
    var d = S.draft;
    var meaningful =
      (d.points && d.points.length > 0) ||
      (!d.points && Math.hypot(d.x1 - d.x0, d.y1 - d.y0) > 4);
    S.draft = null;
    if (meaningful) S.shapes.push(d);
    redraw();
  }

  ink.addEventListener('pointerup', endStroke);
  ink.addEventListener('pointercancel', endStroke);
  ink.addEventListener('pointerleave', endStroke);

  // keep the FX layer following the cursor even outside the ink canvas
  window.addEventListener('pointermove', function (e) {
    S.pointer = { x: e.clientX, y: e.clientY };
  }, true);

  /* ------------------------------------------------------------------ *
   * Eraser — removes whole strokes you touch
   * ------------------------------------------------------------------ */
  function eraseAt(p) {
    var tol = 12;
    for (var i = S.shapes.length - 1; i >= 0; i--) {
      if (hits(S.shapes[i], p, tol)) {
        S.shapes.splice(i, 1);
        redraw();
        return;
      }
    }
  }

  function hits(s, p, tol) {
    var pad = tol + (s.width || 3);
    if (s.points) {
      for (var i = 0; i < s.points.length - 1; i++) {
        if (distToSeg(p, s.points[i], s.points[i + 1]) < pad) return true;
      }
      return s.points.length === 1 &&
        Math.hypot(p.x - s.points[0].x, p.y - s.points[0].y) < pad;
    }
    if (s.type === 'arrow') {
      return distToSeg(p, { x: s.x0, y: s.y0 }, { x: s.x1, y: s.y1 }) < pad;
    }
    if (s.type === 'box') {
      var x0 = Math.min(s.x0, s.x1), x1 = Math.max(s.x0, s.x1);
      var y0 = Math.min(s.y0, s.y1), y1 = Math.max(s.y0, s.y1);
      var inside = p.x > x0 - pad && p.x < x1 + pad && p.y > y0 - pad && p.y < y1 + pad;
      var core = p.x > x0 + pad && p.x < x1 - pad && p.y > y0 + pad && p.y < y1 - pad;
      return inside && !core;
    }
    if (s.type === 'text') {
      ictx.font = '600 ' + s.size + 'px -apple-system,sans-serif';
      var w = ictx.measureText(s.text).width;
      return p.x > s.x0 - pad && p.x < s.x0 + w + pad &&
             p.y > s.y0 - pad && p.y < s.y0 + s.size + pad;
    }
    return false;
  }

  function distToSeg(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  /* ------------------------------------------------------------------ *
   * Text tool
   * ------------------------------------------------------------------ */
  var textBox = null;

  function openTextInput(p) {
    commitText();
    var size = Math.round(S.width * 4 + 12);
    textBox = el('div', 'tin');
    textBox.contentEditable = 'true';
    // p is in page coords; the input is position:fixed, so convert back
    textBox.style.left = (p.x - scrollX()) + 'px';
    textBox.style.top = (p.y - scrollY()) + 'px';
    textBox.style.color = S.color;
    textBox.style.fontSize = size + 'px';
    textBox.dataset.x = String(p.x);
    textBox.dataset.y = String(p.y);
    textBox.dataset.size = String(size);
    root.appendChild(textBox);
    textBox.focus();

    textBox.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitText(); }
      if (e.key === 'Escape') { e.preventDefault(); cancelText(); }
    });
    textBox.addEventListener('blur', commitText);
  }

  function commitText() {
    if (!textBox) return;
    var t = textBox.textContent.trim();
    var x = parseFloat(textBox.dataset.x);
    var y = parseFloat(textBox.dataset.y);
    var size = parseFloat(textBox.dataset.size);
    var color = textBox.style.color;
    var node = textBox;
    textBox = null;
    node.remove();
    if (t) {
      S.shapes.push({ type: 'text', text: t, x0: x, y0: y, size: size, color: color, width: 2 });
      redraw();
    }
  }

  function cancelText() {
    if (!textBox) return;
    var node = textBox;
    textBox = null;
    node.remove();
  }

  /* ------------------------------------------------------------------ *
   * FX layer — spotlight + cursor glow
   * ------------------------------------------------------------------ */
  function fxLoop() {
    if (!S.fxRunning) return;
    var w = window.innerWidth, h = window.innerHeight;
    fctx.clearRect(0, 0, w, h);

    if (S.spotlight) {
      fctx.globalCompositeOperation = 'source-over';
      fctx.fillStyle = 'rgba(0,0,0,' + CONFIG.spotlightDim + ')';
      fctx.fillRect(0, 0, w, h);

      fctx.globalCompositeOperation = 'destination-out';
      var r = CONFIG.spotlightRadius;
      var g = fctx.createRadialGradient(
        S.pointer.x, S.pointer.y, r * 0.55,
        S.pointer.x, S.pointer.y, r
      );
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fctx.fillStyle = g;
      fctx.beginPath();
      fctx.arc(S.pointer.x, S.pointer.y, r, 0, Math.PI * 2);
      fctx.fill();
      fctx.globalCompositeOperation = 'source-over';
    }

    if (S.glow) {
      var gr = fctx.createRadialGradient(
        S.pointer.x, S.pointer.y, 0,
        S.pointer.x, S.pointer.y, 34
      );
      gr.addColorStop(0, 'rgba(255,214,10,.85)');
      gr.addColorStop(0.55, 'rgba(255,214,10,.35)');
      gr.addColorStop(1, 'rgba(255,214,10,0)');
      fctx.fillStyle = gr;
      fctx.beginPath();
      fctx.arc(S.pointer.x, S.pointer.y, 34, 0, Math.PI * 2);
      fctx.fill();
    }

    raf(fxLoop);
  }

  function syncFx() {
    var need = S.spotlight || S.glow;
    if (need && !S.fxRunning) {
      S.fxRunning = true;
      raf(fxLoop);
    } else if (!need && S.fxRunning) {
      S.fxRunning = false;
      fctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
    spotBtn.classList.toggle('sel', S.spotlight);
    glowBtn.classList.toggle('sel', S.glow);
  }

  /* ------------------------------------------------------------------ *
   * Mode / tool switching
   * ------------------------------------------------------------------ */
  function setTool(t) {
    S.tool = t;
    commitText();
    Array.prototype.forEach.call(bar.querySelectorAll('[data-tool]'), function (b) {
      b.classList.toggle('sel', b.getAttribute('data-tool') === t);
    });
    ink.style.cursor = t === 'eraser' ? 'cell' : (t === 'text' ? 'text' : 'crosshair');
    if (!S.active) setActive(true);
  }

  function setColor(hex) {
    S.color = hex;
    Array.prototype.forEach.call(bar.querySelectorAll('[data-color]'), function (b) {
      b.classList.toggle('sel', b.getAttribute('data-color') === hex);
    });
    if (textBox) textBox.style.color = hex;
  }

  function setWidth(w) {
    S.width = w;
    Array.prototype.forEach.call(bar.querySelectorAll('[data-width]'), function (b) {
      b.classList.toggle('sel', b.getAttribute('data-width') === String(w));
    });
  }

  function toggleSpotlight() { S.spotlight = !S.spotlight; syncFx(); }
  function toggleGlow() { S.glow = !S.glow; syncFx(); }

  function toggleBlank() {
    S.blank = !S.blank;
    backdrop.classList.toggle('on', S.blank);
    blankBtn.classList.toggle('sel', S.blank);
    if (S.blank && !S.active) setActive(true);
  }

  function undo() {
    commitText();
    S.shapes.pop();
    redraw();
  }

  function clearAll() {
    cancelText();
    S.shapes.length = 0;
    redraw();
  }

  var hintTimer = null;
  function hint(msg) {
    hintEl.textContent = msg;
    hintEl.classList.add('on');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(function () { hintEl.classList.remove('on'); }, 1500);
  }

  function setActive(on) {
    if (S.active === on) return;
    S.active = on;
    host.style.pointerEvents = on ? 'auto' : 'none';
    ink.classList.toggle('on', on);
    bar.classList.toggle('on', on);
    launch.classList.toggle('hidden', on);
    if (on) {
      setTool(S.tool);
      hint('Drawing — Esc to exit');
    } else {
      commitText();
      hint('Page is live again');
    }
  }

  /* ------------------------------------------------------------------ *
   * Scroll lock while drawing
   * ------------------------------------------------------------------ */
  // Anchored to the page: scroll freely, just repaint at the new offset.
  var scrollQueued = false;
  window.addEventListener('scroll', function () {
    if (!CONFIG.anchorToPage || scrollQueued) return;
    scrollQueued = true;
    raf(function () {
      scrollQueued = false;
      redraw();
      if (textBox) {
        textBox.style.left = (parseFloat(textBox.dataset.x) - scrollX()) + 'px';
        textBox.style.top = (parseFloat(textBox.dataset.y) - scrollY()) + 'px';
      }
    });
  }, { passive: true });

  // Pinned to the screen: hold the page still, or marks drift off their target.
  function blockScroll(e) {
    if (S.active) e.preventDefault();
  }
  if (!CONFIG.anchorToPage) {
    window.addEventListener('wheel', blockScroll, { passive: false });
    window.addEventListener('touchmove', blockScroll, { passive: false });
  }

  /* ------------------------------------------------------------------ *
   * Keyboard
   * ------------------------------------------------------------------ */
  var KEYMAP = { p: 'pen', h: 'highlighter', a: 'arrow', r: 'box', t: 'text', e: 'eraser' };

  window.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();

    // Option/Alt + D toggles from anywhere
    if (e.altKey && k === CONFIG.toggleKey) {
      e.preventDefault();
      setActive(!S.active);
      return;
    }

    if (!S.active) return;
    if (textBox) return; // typing

    var tgt = e.target;
    var typing = tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
    if (typing) return;

    if (k === 'escape') { e.preventDefault(); setActive(false); return; }
    if ((e.metaKey || e.ctrlKey) && k === 'z') { e.preventDefault(); undo(); return; }
    if (e.metaKey || e.ctrlKey) return;

    if (KEYMAP[k]) { e.preventDefault(); setTool(KEYMAP[k]); return; }
    if (k === 's') { e.preventDefault(); toggleSpotlight(); return; }
    if (k === 'g') { e.preventDefault(); toggleGlow(); return; }
    if (k === 'b') { e.preventDefault(); toggleBlank(); return; }
    if (k === 'c') { e.preventDefault(); clearAll(); return; }

    var n = parseInt(k, 10);
    if (n >= 1 && n <= CONFIG.colors.length) {
      e.preventDefault();
      setColor(CONFIG.colors[n - 1].hex);
    }
  }, true);

  launch.addEventListener('click', function () { setActive(true); });

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  setColor(S.color);
  setWidth(S.width);
  Array.prototype.forEach.call(bar.querySelectorAll('[data-tool]'), function (b) {
    b.classList.toggle('sel', b.getAttribute('data-tool') === S.tool);
  });

  window.__teachOverlay = {
    show: function () { setActive(true); },
    hide: function () { setActive(false); },
    clear: clearAll,
    undo: undo,
    setTool: setTool,
    setColor: setColor,
    state: S,
    config: CONFIG
  };
})();
