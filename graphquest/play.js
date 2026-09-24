/**
 * GRAPH QUEST — shared play screen for World 1, World 4 and the Boss Level
 * ------------------------------------------------------------------
 * One screen (#screen-play) that each of those modules fills: the header,
 * the map, the readout, the question area, hints and the XP panel. Plus
 * the graph tools they share: building a route (optionally one-way), and
 * laying a network of edges (connected? loop? minimum total weight?).
 *
 * Graphs here are { nodes:[{id,x,y}], edges:[{a,b,w?,m?,dir?}] } where
 * dir:true means the edge only runs from a to b.
 *
 * Loaded before the main script; uses the shell's helpers (T, tt, st, $,
 * show, renderMap, xpCardHtml, wireXp) only when called.
 */
(function (root) {
  'use strict';

  /* ============================================================
     Graph tools
     ============================================================ */
  const other = (e, v) => e.a === v ? e.b : e.a;
  const touches = (e, v) => e.a === v || e.b === v;
  const canGo = (e, from) => e.dir ? e.a === from : touches(e, from);

  /** Everything reachable from s, following direction if edges have one. */
  function reach(g, s, edgeSet) {
    const seen = new Set([s]), stack = [s];
    while (stack.length) {
      const u = stack.pop();
      g.edges.forEach((e, i) => {
        if (edgeSet && !edgeSet.has(i)) return;
        if (!canGo(e, u)) return;
        const v = other(e, u);
        if (!seen.has(v)) { seen.add(v); stack.push(v); }
      });
    }
    return seen;
  }
  const connectedAll = (g, set) => reach(g, g.nodes[0].id, set).size === g.nodes.length;

  /** The edges of set that sit on a loop (cycle). Empty when set is a forest. */
  function loopEdges(g, set) {
    const out = [];
    set.forEach(i => {
      const rest = new Set(set); rest.delete(i);
      if (reach(g, g.edges[i].a, rest).has(g.edges[i].b)) out.push(i);
    });
    return out;
  }
  const cost = (g, set) => [...set].reduce((s, i) => s + g.edges[i].w, 0);

  /** Kruskal, with its working: every edge in cost order, taken or skipped. */
  function kruskal(g) {
    const order = g.edges.map((e, i) => i).sort((x, y) => g.edges[x].w - g.edges[y].w);
    const parent = {}; g.nodes.forEach(n => { parent[n.id] = n.id; });
    const find = x => parent[x] === x ? x : (parent[x] = find(parent[x]));
    const tree = new Set(), steps = [];
    order.forEach(i => {
      const e = g.edges[i], ra = find(e.a), rb = find(e.b);
      const take = ra !== rb;
      if (take) { parent[ra] = rb; tree.add(i); }
      steps.push({ i, take });
    });
    return { tree, steps, total: cost(g, tree) };
  }
  /** Only one cheapest network? True when no left-out edge could swap in at equal cost. */
  function mstUnique(g) {
    const { tree } = kruskal(g);
    return g.edges.every((e, i) => {
      if (tree.has(i)) return true;
      // the tree path between e's ends: every edge on it must be strictly cheaper
      const onPath = [...tree].filter(j => { const rest = new Set(tree); rest.delete(j); return !reach(g, e.a, rest).has(e.b); });
      return onPath.every(j => g.edges[j].w < e.w);
    });
  }

  /* ---------- building a route ---------- */
  function Route(g, s, opt) {
    this.g = g; this.nodes = [s]; this.edges = []; this.opt = opt || {};
  }
  Route.prototype.end = function () { return this.nodes[this.nodes.length - 1]; };
  /** Returns { ok } or { why: 'undo' | 'closed' | 'not_here' | 'direction' | 'repeat' }. */
  Route.prototype.tapEdge = function (i) {
    const e = this.g.edges[i], end = this.end();
    if (this.edges.length && this.edges[this.edges.length - 1] === i) { this.undo(); return { why: 'undo' }; }
    if (this.opt.closed && this.opt.closed.has(i)) return { why: 'closed' };
    if (!touches(e, end)) return { why: 'not_here' };
    if (!canGo(e, end)) return { why: 'direction' };
    const to = other(e, end);
    if (!this.opt.allowRepeat && this.nodes.includes(to)) return { why: 'repeat', to };
    this.nodes.push(to); this.edges.push(i);
    return { ok: true, to };
  };
  Route.prototype.tapNode = function (id) {
    const end = this.end();
    if (id === end) { if (this.edges.length) { this.undo(); return { why: 'undo' }; } return { why: 'here' }; }
    let idx = this.g.edges.findIndex((e, i) => touches(e, end) && touches(e, id) && canGo(e, end) && !(this.opt.closed && this.opt.closed.has(i)));
    if (idx < 0) idx = this.g.edges.findIndex(e => touches(e, end) && touches(e, id));
    if (idx < 0) return { why: 'no_edge' };
    return this.tapEdge(idx);
  };
  Route.prototype.undo = function () { if (this.edges.length) { this.edges.pop(); this.nodes.pop(); } };
  Route.prototype.reset = function () { this.nodes.length = 1; this.edges.length = 0; };
  Route.prototype.total = function (key) { return this.edges.reduce((s, i) => s + (this.g.edges[i][key] || 0), 0); };

  /* ============================================================
     The screen
     ============================================================ */
  let cfg = null, portrait = false, clock = null, t0 = 0, frozen = null;
  const P = v => portrait ? { id: v.id, x: v.y, y: v.x } : v;

  /**
   * cfg: { world, i, levels (array with .title), title:[en,bm], story:[en,bm], terms:[[en,bm]…],
   *        target, where:[en,bm] (optional), onTap({node}|{edge}), render() (re-draw all, for language) }
   */
  function open(c) {
    cfg = c; frozen = null;
    $('screen-play').innerHTML =
      '<div class="lvl-head"><div class="lvl-meta"><button class="btn ghost sm" id="p-map"></button><span id="p-where"></span><span class="clock" id="p-clock"></span></div>' +
      '<div class="steps" id="p-steps"></div></div>' +
      '<div class="mission"><h2 id="p-title"></h2><p id="p-story" style="margin-bottom:8px;"></p><div id="p-terms"></div></div>' +
      '<div id="p-banner"></div>' +
      '<div class="board"><svg id="svgp" viewBox="0 0 640 400" role="group"></svg></div>' +
      '<div class="readout"><div class="trail" id="p-trail"></div><div class="total" id="p-total"></div></div>' +
      '<div class="say" id="p-say" role="status" aria-live="polite"></div>' +
      '<div class="controls" id="p-controls"></div>' +
      '<div id="p-ask"></div><div id="p-aid"></div><div id="p-panel"></div>';
    $('p-map').addEventListener('click', () => { stopClock(); renderMap(); show('map'); });
    $('svgp').addEventListener('click', ev => {
      const t = ev.target.closest('[data-edge],[data-node]');
      if (!t || !cfg.onTap) return;
      if (t.dataset.node) cfg.onTap({ node: t.dataset.node }); else cfg.onTap({ edge: +t.dataset.edge });
    });
    $('svgp').addEventListener('keydown', ev => {
      const t = ev.target.closest('[data-node]');
      if (t && cfg.onTap && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); cfg.onTap({ node: t.dataset.node }); }
    });
    show('play');
    header();
    startClock();
  }

  function header() {
    const c = cfg, n = c.levels.length;
    $('p-map').textContent = T('← Map', '← Peta');
    $('p-where').textContent = c.where ? tt(c.where) : T('World ', 'Dunia ') + c.world + T(' · Level ', ' · Tahap ') + (c.i + 1) + T(' of ', ' daripada ') + n;
    $('p-steps').innerHTML = c.levels.map((_, k) => {
      const done = st.done[c.world + '-' + (k + 1)];
      return '<div class="step ' + (k === c.i ? 'now' : done ? 'done' : '') + '" style="cursor:default"><b>' + (done && k !== c.i ? '✓' : k + 1) + '</b></div>';
    }).join('');
    $('p-title').innerHTML = (c.where ? '' : T('Level ', 'Tahap ') + (c.i + 1) + ' · ') + '<span class="script">' + tt(c.title) + '</span>';
    $('p-story').innerHTML = tt(c.story);
    $('p-terms').innerHTML = (c.terms || []).map(p => '<span class="term">' + tt(p) + ' <i>· ' + T(p[1], p[0]) + '</i></span>').join('');
    tick();
  }

  /* ---------- clock ---------- */
  function startClock() {
    t0 = Date.now(); frozen = null;
    clearInterval(clock);
    clock = setInterval(tick, 1000);
  }
  function tick() { if (current === 'play' && cfg && frozen == null) $('p-clock').textContent = '⏱ ' + secs() + ' / ' + cfg.target + ' s'; }
  const secs = () => frozen != null ? frozen : Math.round((Date.now() - t0) / 1000);
  function stopClock() { if (frozen == null) frozen = Math.round((Date.now() - t0) / 1000); clearInterval(clock); if ($('p-clock')) $('p-clock').textContent = frozen + ' s'; return frozen; }

  /* ---------- drawing ---------- */
  /**
   * o: { name(id), edgeCls(i), label(i) → string|null, nodeCls(id), tag(id) → short text in the circle,
   *      ring: id (pulsing ring), lorry: id (a marker emoji above), marker: '🧭' }
   */
  function draw(g, o) {
    o = o || {};
    portrait = $('svgp').parentElement.clientWidth < 560;
    $('svgp').setAttribute('viewBox', portrait ? '0 0 400 640' : '0 0 640 400');
    const pos = id => P(g.nodes.find(n => n.id === id));
    let roads = '', labels = '', towns = '';
    g.edges.forEach((e, i) => {
      const A = pos(e.a), B = pos(e.b), cls = o.edgeCls ? o.edgeCls(i) : '';
      if (cls === 'gone') return;
      const xy = 'x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '"';
      const on = cls.split(/\s+/).includes('on');
      roads += '<g class="edge ' + cls + '" data-edge="' + i + '" id="p-e' + i + '"><line class="hit" ' + xy + '/><line class="road" ' + xy + '/>' +
        (on ? '<line class="route-o" ' + xy + '/><line class="route" ' + xy + '/>' : '');
      if (e.dir) {
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        const tx = B.x - ux * 24, ty = B.y - uy * 24, px = -uy, py = ux;
        roads += '<polygon class="arrow" points="' + tx + ',' + ty + ' ' + (tx - ux * 16 + px * 8) + ',' + (ty - uy * 16 + py * 8) + ' ' + (tx - ux * 16 - px * 8) + ',' + (ty - uy * 16 - py * 8) + '"/>';
        const mx = A.x + dx * 0.45, my = A.y + dy * 0.45;
        roads += '<polygon class="arrow" points="' + (mx + ux * 9) + ',' + (my + uy * 9) + ' ' + (mx - ux * 7 + px * 7) + ',' + (my - uy * 7 + py * 7) + ' ' + (mx - ux * 7 - px * 7) + ',' + (my - uy * 7 - py * 7) + '"/>';
      }
      roads += '</g>';
      const lb = o.label ? o.label(i) : null;
      if (lb != null) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, w = 16 + String(lb).replace(/<[^>]+>/g, '').length * 7.4;
        labels += '<g class="lbl ' + cls + '" data-edge="' + i + '" id="p-l' + i + '"><rect x="' + (mx - w / 2) + '" y="' + (my - 13) + '" width="' + w + '" height="26" rx="9"/>' +
          '<text x="' + mx + '" y="' + (my + 4.5) + '" text-anchor="middle">' + lb + '</text></g>';
      }
    });
    g.nodes.map(P).forEach(v => {
      const cls = o.nodeCls ? o.nodeCls(v.id) : '', tag = o.tag ? o.tag(v.id) : '', nm = o.name ? o.name(v.id) : v.id;
      towns += '<g class="town ' + cls + '" data-node="' + v.id + '" id="p-n' + v.id + '" tabindex="0" role="button" aria-label="' + nm + '">' +
        (o.ring === v.id ? '<circle class="ring" cx="' + v.x + '" cy="' + v.y + '" r="20"/>' : '') +
        '<circle cx="' + v.x + '" cy="' + v.y + '" r="34" fill="transparent"/>' +
        '<circle class="shadow" cx="' + v.x + '" cy="' + (v.y + 3) + '" r="19"/><circle class="dot" cx="' + v.x + '" cy="' + v.y + '" r="19"/>' +
        (tag ? '<text class="tag" x="' + v.x + '" y="' + (v.y + 4) + '" text-anchor="middle">' + tag + '</text>' : '') +
        '<text class="name" x="' + v.x + '" y="' + (v.y + 39) + '" text-anchor="middle">' + nm + '</text></g>';
    });
    let marker = '';
    if (o.lorry) { const L = pos(o.lorry); marker = '<text class="lorry" x="' + L.x + '" y="' + (L.y - 25) + '" text-anchor="middle">' + (o.marker || '🧭') + '</text>'; }
    $('svgp').innerHTML = roads + labels + towns + marker;
  }

  function say(msg, warn) { if (warn && msg) SFX.play('wrong'); $('p-say').textContent = msg || ''; $('p-say').classList.toggle('warn', !!warn); }
  function shake(id) {
    const el = $(id); if (!el) return;
    el.classList.remove('shake'); void el.getBBox(); el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }
  function controls(list) {
    $('p-controls').innerHTML = list.map(b => b ? '<button class="btn ' + (b.primary ? '' : 'ghost sm') + '" id="' + b.id + '"' + (b.disabled ? ' disabled' : '') + '>' + b.label + '</button>' : '<span class="grow"></span>').join('');
    list.forEach(b => { if (b && b.on) $(b.id).addEventListener('click', b.on); });
  }

  /* ---------- quick check, then XP ---------- */
  function quick(head, qc, done) {
    $('p-panel').innerHTML = head + '<div class="note"><h3>' + T('Quick check', 'Semakan pantas') + ' <span class="pill new">+20 XP</span></h3><p>' + qc.q + '</p>' +
      '<div class="opts">' + qc.opts.map(o => '<button class="opt" data-opt="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><div id="p-qc-out"></div></div>';
    $('p-panel').querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
      const ok = b.dataset.opt === qc.answer;
      SFX.play(ok ? 'right' : 'wrong');
      $('p-panel').querySelectorAll('[data-opt]').forEach(x => {
        x.disabled = true;
        if (x.dataset.opt === qc.answer) x.classList.add('right'); else if (x === b) x.classList.add('wrong');
      });
      $('p-qc-out').innerHTML = '<p style="margin:12px 0;">' + (ok ? T('Right — ', 'Betul — ') : T('Not quite — ', 'Belum tepat — ')) + qc.why + '</p>' +
        '<button class="btn sm" id="p-score">' + T('See my XP', 'Lihat XP saya') + '</button>';
      $('p-score').addEventListener('click', () => done(ok));
    }));
    $('p-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /** The four standard parts of a level's XP. */
  function parts(label, reasoning, hints, learn, time, target) {
    const p = [
      ['correct', label, 60],
      ['reasoning', T('Quick check', 'Semakan pantas'), reasoning ? 20 : 0],
      ['nohint', T('No hint or Learn', 'Tanpa petunjuk atau Belajar'), (hints || learn) ? 0 : 10],
      ['speed', T('Speed · under ', 'Kelajuan · bawah ') + target + ' s (' + time + ' s)', time <= target ? 10 : 0]
    ];
    if (learn) p.push(['learn', T('Used Learn', 'Guna Belajar'), -10]);
    return p;
  }

  function xp(head, w, i, x) {
    $('p-panel').innerHTML = head + xpCardHtml(w, i, x);
    wireXp($('p-panel'), w, i);
  }

  /* ---------- Discover: pick the true statement, then meet the terms ----------
     o: { w, opts:[[key, text]…], answer, why(pick) → text, terms:[[en, bm, dEn, dBm]…] } */
  let dz = { w: null, pick: null, o: null };
  function discover(o) {
    if (dz.w !== o.w) dz = { w: o.w, pick: null, o };
    dz.o = o;
    const done = !!st.discovered[o.w], answered = dz.pick !== null || done, pick = dz.pick || (done ? o.answer : null);
    let html = '<div class="badge">' + T('World ', 'Dunia ') + o.w + T(' · Discover', ' · Temui') + '</div>' +
      '<h1>' + T('What did you <span class="script">notice?</span>', 'Apa yang anda <span class="script">perasan?</span>') + '</h1>' +
      '<p>' + T('Think back over the five levels. Which statement is always true?', 'Fikirkan semula lima tahap tadi. Pernyataan manakah yang sentiasa benar?') + '</p>' +
      '<div class="opts">' + o.opts.map(x => '<button class="opt' + (answered ? (x[0] === o.answer ? ' right' : x[0] === pick ? ' wrong' : '') : '') + '" data-pick="' + x[0] + '"' + (answered ? ' disabled' : '') + '>' + x[1] + '</button>').join('') + '</div>';
    if (answered) {
      html += '<p style="margin-top:16px;"><b class="ink">' + o.why(pick) + '</b></p>';
      if (done) {
        html += '<div class="sec-title" style="margin-top:22px;">' + T('Now it has a name', 'Kini ia ada nama') + '</div><div class="terms">' +
          o.terms.map(t => '<div class="tcard"><b>' + T(t[0], t[1]) + '</b><i>' + T(t[1], t[0]) + '</i><span>' + T(t[2], t[3]) + '</span></div>').join('') + '</div>';
      }
      html += '<div class="row" style="margin-top:24px;"><button class="btn" id="p-disc-map">' + T('Back to map', 'Kembali ke peta') + '</button>' +
        '<span class="muted">' + (done ? T('+20 XP for discovering', '+20 XP kerana menemui') : '') + '</span></div>';
    }
    $('screen-discover').innerHTML = html;
    $('screen-discover').querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
      dz.pick = b.dataset.pick;
      if (dz.pick === o.answer && !st.discovered[o.w]) { st.discovered[o.w] = true; save(); }
      SFX.play(dz.pick === o.answer ? 'discover' : 'wrong');
      discover(dz.o);
      if (dz.pick !== o.answer) setTimeout(() => { dz.pick = null; discover(dz.o); }, 4200);
    }));
    const back = $('p-disc-map');
    if (back) back.addEventListener('click', () => { dz.pick = null; renderMap(); show('map'); });
  }

  let rt = null;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (current === 'play' && cfg && cfg.render && (($('svgp').parentElement.clientWidth < 560) !== portrait)) cfg.render(); }, 150);
  });

  root.PLAY = {
    open, header, draw, say, shake, controls, quick, parts, xp, secs, stopClock, discover,
    rerender: () => { if (cfg && cfg.render) { header(); cfg.render(); } },
    Route, reach, connectedAll, loopEdges, cost, kruskal, mstUnique, canGo, touches, other
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PLAY;
})(typeof window !== 'undefined' ? window : globalThis);
