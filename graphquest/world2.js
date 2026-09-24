/**
 * GRAPH QUEST — World 2, Graph Detective (degree and types of graph)
 * ------------------------------------------------------------------
 * Case #007: The Missing Trophy. Places in a school are vertices,
 * corridors are edges, and every clue is about degree.
 *
 * Loaded before the main script. Nothing here runs at load time except
 * defining window.W2, so it can use the shell's helpers (T, tt, st, save,
 * show, $, toast, logAttempt, finishLevel, …) whenever it is called.
 *
 * Graphs here are { nodes:[{id,x,y}], edges:[{a,b}] }; a loop has a === b
 * and two edges with the same ends are multiple edges. Every clue in the
 * fixed levels is checked by checkLevels() — one answer each.
 */
(function (root) {
  'use strict';

  const PLACES = {
    G: ['Gate', 'Pagar'], O: ['Office', 'Pejabat'], C: ['Canteen', 'Kantin'], L: ['Library', 'Perpustakaan'],
    H: ['Hall', 'Dewan'], F: ['Field', 'Padang'], S: ['Surau', 'Surau'], M: ['Science Lab', 'Makmal Sains'],
    K: ['Co-op', 'Koperasi'], B: ['Staffroom', 'Bilik Guru'], W: ['Workshop', 'Bengkel'], A: ['Art Room', 'Bilik Seni']
  };
  const nm = id => tt(PLACES[id]);
  const p = (id, x, y) => ({ id, x, y });
  const e = (a, b) => ({ a, b });

  /* ============================================================
     Graph helpers
     ============================================================ */
  function degree(g, v) {
    return g.edges.reduce((d, ed) => d + (ed.a === v ? 1 : 0) + (ed.b === v ? 1 : 0), 0);
  }
  function adjacent(g, v, u) {
    return v !== u && g.edges.some(ed => (ed.a === v && ed.b === u) || (ed.a === u && ed.b === v));
  }
  const hasLoop = (g, v) => g.edges.some(ed => ed.a === v && ed.b === v);
  const pairKey = ed => [ed.a, ed.b].sort().join('|');
  function isMulti(g, i) {
    const k = pairKey(g.edges[i]);
    return g.edges[i].a !== g.edges[i].b && g.edges.filter(ed => pairKey(ed) === k).length > 1;
  }
  const inMultiPair = (g, v) => g.edges.some((ed, i) => (ed.a === v || ed.b === v) && isMulti(g, i));
  const degSum = g => g.nodes.reduce((s, v) => s + degree(g, v.id), 0);

  function clueHolds(g, v, c) {
    if (c.k === 'deg') return degree(g, v) === c.d;
    if (c.k === 'adj') return adjacent(g, v, c.u);
    return v !== c.u && !adjacent(g, v, c.u);
  }
  const fits = (g, clues) => g.nodes.map(v => v.id).filter(v => clues.every(c => clueHolds(g, v, c)));

  /* ============================================================
     Content — five levels. L5 is generated fresh every time.
     ============================================================ */
  const LEVELS = [
    {
      title: ['Count the corridors', 'Kira koridor'], target: 60, terms: 'basic',
      story: ['<b class="ink">Case #007: The Missing Trophy.</b> The hockey trophy vanished from the school overnight. First, learn the map: each place is a <b class="ink">vertex</b> and each corridor is an <b class="ink">edge</b>. The number of corridors meeting at a place is its <b class="ink">degree</b>.',
        '<b class="ink">Kes #007: Trofi Yang Hilang.</b> Trofi hoki sekolah hilang pada waktu malam. Mula-mula, kenali peta: setiap tempat ialah <b class="ink">bucu</b> dan setiap koridor ialah <b class="ink">sisi</b>. Bilangan koridor yang bertemu di sesuatu tempat ialah <b class="ink">darjah</b>nya.'],
      g: {
        nodes: [p('G', 90, 200), p('O', 250, 90), p('C', 250, 310), p('L', 430, 90), p('H', 430, 310)],
        edges: [e('G', 'O'), e('G', 'C'), e('O', 'C'), e('O', 'L'), e('C', 'H'), e('L', 'H')]
      },
      steps: [{ t: 'count', v: 'O' }, { t: 'count', v: 'G' }, { t: 'count', v: 'C' }],
      qc: {
        q: ['If a new corridor is built between the Canteen and the Library, the Canteen\'s degree becomes…', 'Jika koridor baharu dibina antara Kantin dan Perpustakaan, darjah Kantin menjadi…'],
        opts: [['a', '4'], ['b', '5'], ['c', '3']], answer: 'a',
        why: ['A new corridor adds 1 to each end: the Canteen goes from 3 to 4, and the Library from 2 to 3.', 'Koridor baharu menambah 1 pada setiap hujung: Kantin daripada 3 menjadi 4, dan Perpustakaan daripada 2 menjadi 3.']
      }
    },
    {
      title: ['Follow the suspect', 'Jejak suspek'], target: 60,
      story: ['The CCTV shows three places the suspect visited, described only by how many corridors meet there. Find each place.',
        'Rakaman CCTV menunjukkan tiga tempat yang dilawati suspek, diterangkan hanya melalui bilangan koridor yang bertemu di situ. Cari setiap tempat.'],
      g: {
        nodes: [p('G', 80, 220), p('O', 230, 100), p('C', 230, 320), p('L', 410, 90), p('H', 420, 300), p('F', 570, 300)],
        edges: [e('F', 'H'), e('G', 'O'), e('G', 'C'), e('O', 'C'), e('O', 'L'), e('O', 'H'), e('L', 'H')]
      },
      steps: [{ t: 'find', d: 4, lead: 0 }, { t: 'find', d: 1, lead: 1 }, { t: 'find', d: 3, lead: 2 }],
      qc: {
        q: ['The Field has degree 1. What does that tell you?', 'Padang mempunyai darjah 1. Apakah maksudnya?'],
        opts: [['a', ['Only one corridor leads there — a dead end', 'Hanya satu koridor menuju ke situ — jalan mati']],
          ['b', ['It is the busiest place', 'Ia tempat paling sibuk']],
          ['c', ['It is not connected to anything', 'Ia tidak bersambung dengan apa-apa']]], answer: 'a',
        why: ['Degree 1 means exactly one edge touches it. Degree 0 would mean nothing reaches it at all.', 'Darjah 1 bermaksud tepat satu sisi menyentuhnya. Darjah 0 pula bermaksud tiada apa yang sampai ke situ.']
      }
    },
    {
      title: ['Loops and twin corridors', 'Gelung dan koridor berkembar'], target: 90, terms: 'types',
      story: ['Near the Field the map gets strange: a running track leaves the Field and comes straight back, and two separate corridors join the Canteen and the Hall.',
        'Berhampiran Padang, peta menjadi pelik: trek larian keluar dari Padang dan terus kembali, dan dua koridor berasingan menghubungkan Kantin dan Dewan.'],
      g: {
        nodes: [p('O', 90, 110), p('S', 90, 310), p('L', 260, 300), p('C', 280, 90), p('H', 440, 200), p('F', 580, 210)],
        edges: [e('O', 'C'), e('O', 'L'), e('O', 'S'), e('S', 'L'), e('L', 'H'), e('C', 'H'), e('C', 'H'), e('H', 'F'), e('F', 'F')]
      },
      steps: [{ t: 'loop' }, { t: 'multi' }, { t: 'count', v: 'F' }, { t: 'count', v: 'H' }],
      qc: {
        q: ['Is this map a simple graph?', 'Adakah peta ini graf mudah?'],
        opts: [['a', ['No — it has a loop and a pair of multiple edges', 'Tidak — ia ada gelung dan sepasang sisi berbilang']],
          ['b', ['Yes — every place can be reached', 'Ya — setiap tempat boleh dicapai']],
          ['c', ['Yes — no place has degree 0', 'Ya — tiada tempat berdarjah 0']]], answer: 'a',
        why: ['A simple graph has no loops and no multiple edges. Whether every place can be reached is a different idea.', 'Graf mudah tiada gelung dan tiada sisi berbilang. Sama ada setiap tempat boleh dicapai ialah idea yang berbeza.']
      }
    },
    {
      title: ['Three witnesses', 'Tiga saksi'], target: 90,
      story: ['Three witnesses each saw one thing. Only one place fits all three clues — that\'s where the trophy is hidden.',
        'Tiga saksi masing-masing nampak satu perkara. Hanya satu tempat yang sepadan dengan ketiga-tiga petunjuk — di situlah trofi disembunyikan.'],
      g: {
        nodes: [p('G', 70, 200), p('O', 200, 90), p('C', 200, 310), p('L', 350, 70), p('M', 360, 200), p('H', 350, 330), p('F', 520, 300), p('S', 520, 110)],
        edges: [e('G', 'O'), e('G', 'C'), e('O', 'L'), e('O', 'M'), e('C', 'M'), e('C', 'H'), e('L', 'S'), e('M', 'S'), e('M', 'H'), e('H', 'F'), e('S', 'F')]
      },
      steps: [{ t: 'clues', clues: [{ k: 'deg', d: 2 }, { k: 'adj', u: 'S' }, { k: 'nadj', u: 'L' }], ans: 'F' }]
    },
    {
      title: ['Timed case', 'Kes berpemasa'], target: 120, random: true,
      story: ['A new school map every time. Work fast — the bonus clock is ticking.',
        'Peta sekolah baharu setiap kali. Bertindak pantas — jam bonus sedang berdetik.']
    }
  ];

  const LEADS = [
    ['The suspect started at the place where', 'Suspek bermula di tempat'],
    ['Then they hid at the place where', 'Kemudian mereka bersembunyi di tempat'],
    ['They escaped from the place where', 'Mereka melarikan diri dari tempat']
  ];

  /** Every fixed level must have exactly one answer per question. */
  function checkLevels() {
    const problems = [];
    LEVELS.forEach((L, i) => {
      if (!L.g) return;
      if (degSum(L.g) !== 2 * L.g.edges.length) problems.push('L' + (i + 1) + ' degree sum');
      L.steps.forEach(s => {
        if (s.t === 'find' && L.g.nodes.filter(v => degree(L.g, v.id) === s.d).length !== 1) problems.push('L' + (i + 1) + ' find ' + s.d);
        if (s.t === 'clues') {
          const f = fits(L.g, s.clues);
          if (f.length !== 1 || f[0] !== s.ans) problems.push('L' + (i + 1) + ' clues ' + f.join(','));
          s.clues.forEach((_, j) => { if (fits(L.g, s.clues.filter((__, k) => k !== j)).length === 1) problems.push('L' + (i + 1) + ' clue ' + (j + 1) + ' not needed'); });
        }
      });
    });
    return problems;
  }

  /* ---------- random timed case ---------- */
  const POOL = ['G', 'O', 'C', 'L', 'H', 'F', 'S', 'M', 'K', 'B', 'W', 'A'];

  function makeClues(g, R) {
    const ids = shuffled(g.nodes.map(v => v.id), R);
    for (const v of ids) {
      const clues = [{ k: 'deg', d: degree(g, v) }];
      let cand = fits(g, clues);
      if (cand.length < 2) continue;
      for (const u of shuffled(ids, R)) {
        if (!adjacent(g, v, u)) continue;
        const next = cand.filter(x => adjacent(g, x, u));
        if (next.length < cand.length && next.includes(v)) { clues.push({ k: 'adj', u }); cand = next; break; }
      }
      if (cand.length > 1) {
        for (const w of shuffled(ids, R)) {
          if (w === v || adjacent(g, v, w)) continue;
          const next = cand.filter(x => x !== w && !adjacent(g, x, w));
          if (next.length === 1 && next[0] === v) { clues.push({ k: 'nadj', u: w }); cand = next; break; }
        }
      }
      if (cand.length === 1 && clues.length >= 2) return { clues, ans: v };
    }
    return null;
  }

  function randomLevel() {
    for (let tries = 0; tries < 60; tries++) {
      const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, R = E.rng(seed);
      const base = E.generate(seed, { n: 7 });
      const keys = shuffled(POOL, R).slice(0, 7), map = {};
      base.nodes.forEach((v, i) => { map[v.id] = keys[i]; });
      const g = {
        nodes: base.nodes.map(v => ({ id: map[v.id], x: v.x, y: v.y })),
        edges: base.edges.map(ed => ({ a: map[ed.a], b: map[ed.b] }))
      };
      const counts = {};
      g.nodes.forEach(v => { const d = degree(g, v.id); counts[d] = (counts[d] || 0) + 1; });
      const unique = Object.keys(counts).filter(d => counts[d] === 1).map(Number);
      if (!unique.length) continue;
      const cl = makeClues(g, R);
      if (!cl) continue;
      const countV = shuffled(g.nodes.map(v => v.id), R).find(v => degree(g, v) >= 2);
      return {
        g, steps: [{ t: 'count', v: countV }, { t: 'find', d: unique[Math.floor(R() * unique.length)], lead: 0 },
          { t: 'clues', clues: cl.clues, ans: cl.ans }]
      };
    }
    throw new Error('Could not build a timed case.');
  }

  /* ============================================================
     Drawing — one SVG builder, used by the case screen and Discover
     ============================================================ */
  let portrait = false;
  const P = v => portrait ? { id: v.id, x: v.y, y: v.x } : v;

  /** A teardrop leaving A in direction (ux, uy) — pointed away from the
   *  place's other corridors so it never sits on top of one. */
  function loopPath(A, ux, uy) {
    const px = -uy, py = ux, pt = (a, b) => (A.x + ux * a + px * b).toFixed(1) + ' ' + (A.y + uy * a + py * b).toFixed(1);
    return 'M ' + pt(17, -9) + ' C ' + pt(82, -48) + ', ' + pt(82, 48) + ', ' + pt(17, 9);
  }
  /** Of 8 directions, the one furthest from the place's corridors that keeps
   *  the loop inside the map and off the name label underneath. */
  function loopDir(g, v, pos) {
    const A = pos(v), W = portrait ? 400 : 640, H = portrait ? 640 : 400;
    const away = [];
    g.edges.forEach(ed => {
      if (ed.a === ed.b) return;
      const o = ed.a === v ? ed.b : ed.b === v ? ed.a : null;
      if (o) { const B = pos(o); away.push(Math.atan2(B.y - A.y, B.x - A.x)); }
    });
    away.push(Math.PI / 2);                       // the label sits straight below
    let best = [0, -1], bestScore = -1;
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4, ux = Math.cos(a), uy = Math.sin(a);
      const ax = A.x + ux * 75, ay = A.y + uy * 75;
      if (ax < 12 || ax > W - 12 || ay < 12 || ay > H - 12) continue;
      const score = Math.min(...away.map(b => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); }));
      if (score > bestScore) { bestScore = score; best = [ux, uy]; }
    }
    return best;
  }

  function svgFor(g, o) {
    o = o || {};
    const pos = id => P(g.nodes.find(v => v.id === id));
    const total = {}, idx = [];
    g.edges.forEach((ed, i) => { const k = pairKey(ed); total[k] = (total[k] || 0) + 1; idx[i] = total[k]; });
    let roads = '', towns = '', pills = '';

    g.edges.forEach((ed, i) => {
      const A = pos(ed.a), B = pos(ed.b);
      let d;
      if (ed.a === ed.b) { const u = loopDir(g, ed.a, pos); d = loopPath(A, u[0], u[1]); }
      else if (total[pairKey(ed)] === 1) d = 'M ' + A.x + ' ' + A.y + ' L ' + B.x + ' ' + B.y;
      else {
        const off = (idx[i] - (total[pairKey(ed)] + 1) / 2) * 60;
        const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
        const cx = (A.x + B.x) / 2 - dy / len * off, cy = (A.y + B.y) / 2 + dx / len * off;
        d = 'M ' + A.x + ' ' + A.y + ' Q ' + cx + ' ' + cy + ' ' + B.x + ' ' + B.y;
      }
      const cls = (o.hl && o.hl.has(i) ? ' hl' : '') + (o.found && o.found.has(i) ? ' found' : '');
      roads += '<g class="edge' + cls + '" data-edge="' + i + '" id="c-e' + i + '"><path class="hit" d="' + d + '"/><path class="road" d="' + d + '"/></g>';
    });

    g.nodes.map(P).forEach(v => {
      const cls = (o.dim && o.dim.has(v.id) ? ' dim' : '') + (o.done && o.done.has(v.id) ? ' found' : '') + (o.ask === v.id ? ' ask' : '');
      towns += '<g class="town' + cls + '" data-node="' + v.id + '" id="c-n' + v.id + '" tabindex="0" role="button" aria-label="' + nm(v.id) + '">' +
        (o.ask === v.id ? '<circle class="ring" cx="' + v.x + '" cy="' + v.y + '" r="20"/>' : '') +
        '<circle cx="' + v.x + '" cy="' + v.y + '" r="34" fill="transparent"/>' +
        '<circle class="shadow" cx="' + v.x + '" cy="' + (v.y + 3) + '" r="19"/>' +
        '<circle class="dot" cx="' + v.x + '" cy="' + v.y + '" r="19"/>' +
        '<text class="name" x="' + v.x + '" y="' + (v.y + 39) + '" text-anchor="middle">' + nm(v.id) + '</text></g>';
      if (o.degs) pills += '<g class="deg"><rect x="' + (v.x + 12) + '" y="' + (v.y - 36) + '" width="36" height="20" rx="7"/>' +
        '<text x="' + (v.x + 30) + '" y="' + (v.y - 21.5) + '" text-anchor="middle">d=' + degree(g, v.id) + '</text></g>';
    });
    return roads + towns + pills;
  }

  /* ============================================================
     Case state
     ============================================================ */
  let c = null, timer = null;
  const secs2 = () => Math.round((Date.now() - c.t0) / 1000);
  const step = () => c.steps[c.k];

  function start(i) {
    const L = LEVELS[i];
    const made = L.random ? randomLevel() : { g: L.g, steps: L.steps };
    c = {
      i, L, g: made.g, steps: made.steps, k: 0, t0: Date.now(), hints: 0, learn: 0, wrong: 0,
      phase: 'play', hint: null, learnOn: false, done: new Set(), found: new Set(), dim: new Set(), hl: new Set()
    };
    $('c-aid').innerHTML = ''; $('c-panel').innerHTML = ''; say('');
    show('case'); render();
    clearInterval(timer);
    timer = setInterval(tick, 1000);
  }

  function tick() {
    if (current !== 'case' || !c || c.phase !== 'play') return;
    $('c-clock').textContent = '⏱ ' + secs2() + ' / ' + c.L.target + ' s';
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function render() {
    const i = c.i, L = c.L;
    $('c-map').textContent = T('← Map', '← Peta');
    $('c-where').textContent = T('World 2 · Level ', 'Dunia 2 · Tahap ') + (i + 1) + T(' of ', ' daripada ') + LEVELS.length;
    $('c-steps').innerHTML = LEVELS.map((_, k) => {
      const done = st.done['2-' + (k + 1)];
      return '<div class="step ' + (k === i ? 'now' : done ? 'done' : '') + '" style="cursor:default"><b>' + (done && k !== i ? '✓' : k + 1) + '</b></div>';
    }).join('');
    $('c-title').innerHTML = T('Level ', 'Tahap ') + (i + 1) + ' · <span class="script">' + tt(L.title) + '</span>';
    $('c-story').innerHTML = tt(L.story);
    const term = (en, bm) => '<span class="term">' + T(en, bm) + ' <i>· ' + T(bm, en) + '</i></span>';
    $('c-terms').innerHTML = L.terms === 'basic' ? term('vertex', 'bucu') + term('edge', 'sisi') + term('degree', 'darjah')
      : L.terms === 'types' ? term('loop', 'gelung') + term('multiple edges', 'sisi berbilang') + term('simple graph', 'graf mudah') : '';
    $('c-hint').textContent = T('Hint', 'Petunjuk');
    $('c-learn').textContent = T('Learn', 'Belajar');
    $('svg2').setAttribute('aria-label', T('Map of the school', 'Peta sekolah'));
    draw(); renderAsk(); renderAid(); renderPanel(); tick();
  }

  function draw() {
    portrait = $('svg2').parentElement.clientWidth < 560;
    $('svg2').setAttribute('viewBox', portrait ? '0 0 400 640' : '0 0 640 400');
    const s = c.phase === 'play' ? step() : null;
    $('svg2').innerHTML = svgFor(c.g, {
      hl: c.hl, found: c.found, dim: c.dim, done: c.done, degs: c.learnOn,
      ask: s && s.t === 'count' ? s.v : null
    });
  }

  function clueText(cl) {
    if (cl.k === 'deg') return T('It is a place where exactly <b>' + cl.d + '</b> corridor' + (cl.d === 1 ? '' : 's') + ' meet' + (cl.d === 1 ? 's' : '') + '.',
      'Ia tempat yang mempunyai tepat <b>' + cl.d + '</b> koridor bertemu.');
    if (cl.k === 'adj') return T('It is next to the <b>' + nm(cl.u) + '</b> — one corridor joins them.', 'Ia bersebelahan dengan <b>' + nm(cl.u) + '</b> — satu koridor menghubungkannya.');
    return T('It is <b>not</b> next to the <b>' + nm(cl.u) + '</b>.', 'Ia <b>tidak</b> bersebelahan dengan <b>' + nm(cl.u) + '</b>.');
  }

  function renderAsk() {
    if (c.phase !== 'play') { $('c-ask').innerHTML = ''; $('c-ask').classList.add('hidden'); return; }
    $('c-ask').classList.remove('hidden');
    const s = step(), count = T('Question ', 'Soalan ') + (c.k + 1) + T(' of ', ' daripada ') + c.steps.length;
    let q = '', body = '';
    if (s.t === 'count') {
      q = T('How many corridors meet at the <b>' + nm(s.v) + '</b>?', 'Berapakah bilangan koridor yang bertemu di <b>' + nm(s.v) + '</b>?');
      body = '<div class="pad">' + [0, 1, 2, 3, 4, 5, 6].map(x => '<button data-num="' + x + '">' + x + '</button>').join('') + '</div>';
    } else if (s.t === 'find') {
      const lead = LEADS[s.lead];
      q = s.d === 1
        ? T(lead[0] + ' only <b>1</b> corridor leads — a dead end.', lead[1] + ' yang hanya ada <b>1</b> koridor — jalan mati.')
        : T(lead[0] + ' exactly <b>' + s.d + '</b> corridors meet.', lead[1] + ' yang mempunyai tepat <b>' + s.d + '</b> koridor bertemu.');
      body = '<p class="muted" style="margin:6px 0 0;">' + T('👆 Tap that place on the map.', '👆 Ketik tempat itu pada peta.') + '</p>';
    } else if (s.t === 'loop') {
      q = T('One place has a <b>loop</b> — a corridor that leaves a place and comes straight back to it. Tap the loop or its place.',
        'Satu tempat mempunyai <b>gelung</b> — koridor yang keluar dari satu tempat dan terus kembali ke tempat itu. Ketik gelung itu atau tempatnya.');
    } else if (s.t === 'multi') {
      q = T('Two places are joined by <b>two separate corridors</b>. Tap one of those corridors.',
        'Dua tempat dihubungkan oleh <b>dua koridor berasingan</b>. Ketik salah satu koridor itu.');
    } else {
      q = T('Tap the one place that fits <b>every</b> clue:', 'Ketik satu-satunya tempat yang sepadan dengan <b>setiap</b> petunjuk:');
      body = '<ol class="clues">' + s.clues.map(cl => '<li>' + clueText(cl) + '</li>').join('') + '</ol>';
    }
    $('c-ask').innerHTML = '<div class="kicker" style="margin-bottom:4px;">' + count + '</div><p style="margin:0;color:var(--ink);font-size:16.5px;">' + q + '</p>' + body;
    $('c-ask').querySelectorAll('[data-num]').forEach(b => b.addEventListener('click', () => answerCount(+b.dataset.num)));
  }

  function say(msg, warn) { if (warn && msg) SFX.play('wrong'); $('c-say').textContent = msg || ''; $('c-say').classList.toggle('warn', !!warn); }
  function shake(id) {
    const el = $(id); if (!el) return;
    el.classList.remove('shake'); void el.getBBox(); el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  }

  /* ============================================================
     Answers
     ============================================================ */
  function wrong(tag, msg, shakeId) {
    c.wrong++;
    logAttempt({
      world: 2, level: c.i + 1, correct: false, optimal: false, score_xp: 0, mistake_tag: tag,
      hints_used: c.hints, learn_used: c.learn, time_s: secs2()
    });
    save();
    if (shakeId) shake(shakeId);
    say(msg, true);
  }

  function right(msg) {
    c.k++; c.hint = null; c.hl = new Set(); c.dim = new Set();
    SFX.play('right');
    say(msg);
    if (c.k === c.steps.length) { c.phase = 'check'; c.solveTime = secs2(); clearInterval(timer); $('c-clock').textContent = c.solveTime + ' s'; }
    draw(); renderAsk(); renderAid(); renderPanel();
    if (c.phase === 'check') $('c-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function answerCount(x) {
    if (c.phase !== 'play') return;
    const s = step(), d = degree(c.g, s.v);
    if (x === d) return right(T('Yes — the ' + nm(s.v) + ' has degree ' + d + '.', 'Ya — ' + nm(s.v) + ' berdarjah ' + d + '.'));
    if (hasLoop(c.g, s.v) && x === d - 1) return wrong('loop_counted_once', T('Close. The loop touches the ' + nm(s.v) + ' at both of its ends, so it adds 2, not 1.', 'Hampir. Gelung menyentuh ' + nm(s.v) + ' pada kedua-dua hujungnya, jadi ia menambah 2, bukan 1.'), 'c-n' + s.v);
    if (inMultiPair(c.g, s.v) && x === d - 1) return wrong('multiple_edge_counted_once', T('Close. Two corridors join the same pair of places here — count each one.', 'Hampir. Dua koridor menghubungkan pasangan tempat yang sama di sini — kira setiap satu.'), 'c-n' + s.v);
    wrong('miscounted_degree', T('Not quite. Trace each corridor that touches the ' + nm(s.v) + ', one at a time.', 'Belum tepat. Jejak setiap koridor yang menyentuh ' + nm(s.v) + ', satu demi satu.'), 'c-n' + s.v);
  }

  function tapNode(id) {
    if (c.phase !== 'play') return;
    const s = step();
    if (s.t === 'count') return say(T('Use the number buttons under the map.', 'Guna butang nombor di bawah peta.'));
    if (s.t === 'multi') return say(T('Tap the corridor itself — one of the pair.', 'Ketik koridor itu sendiri — salah satu daripada pasangan itu.'));
    if (s.t === 'loop') {
      if (hasLoop(c.g, id)) { markLoop(id); return right(T('Found it — the loop at the ' + nm(id) + '.', 'Jumpa — gelung di ' + nm(id) + '.')); }
      return wrong('missed_loop', T('No loop at the ' + nm(id) + '. A loop starts and ends at the same place.', 'Tiada gelung di ' + nm(id) + '. Gelung bermula dan berakhir di tempat yang sama.'), 'c-n' + id);
    }
    if (s.t === 'find') {
      const d = degree(c.g, id);
      if (d === s.d) {
        c.done.add(id);
        return right(s.d === 1
          ? T('Correct — only 1 corridor leads to the ' + nm(id) + '.', 'Betul — hanya 1 koridor menuju ke ' + nm(id) + '.')
          : T('Correct — ' + s.d + ' corridors meet at the ' + nm(id) + '.', 'Betul — ' + s.d + ' koridor bertemu di ' + nm(id) + '.'));
      }
      return wrong('wrong_vertex_for_degree', T('The ' + nm(id) + ' has degree ' + d + ' — you need ' + s.d + '.', nm(id) + ' berdarjah ' + d + ' — anda perlukan ' + s.d + '.'), 'c-n' + id);
    }
    // clues
    const j = s.clues.findIndex(cl => !clueHolds(c.g, id, cl));
    if (j < 0) { c.done.add(id); return right(T('Case closed! The trophy is at the ' + nm(id) + '.', 'Kes selesai! Trofi berada di ' + nm(id) + '.')); }
    const cl = s.clues[j];
    const why = cl.k === 'deg' ? T('its degree is ' + degree(c.g, id), 'darjahnya ' + degree(c.g, id))
      : cl.k === 'adj' ? T('no corridor joins it to the ' + nm(cl.u), 'tiada koridor menghubungkannya dengan ' + nm(cl.u))
        : T('it is next to the ' + nm(cl.u), 'ia bersebelahan dengan ' + nm(cl.u));
    wrong('clue_ignored', T('The ' + nm(id) + ' doesn\'t fit clue ' + (j + 1) + ': ' + why + '.', nm(id) + ' tidak sepadan dengan petunjuk ' + (j + 1) + ': ' + why + '.'), 'c-n' + id);
  }

  function markLoop(id) { c.g.edges.forEach((ed, i) => { if (ed.a === id && ed.b === id) c.found.add(i); }); }

  function tapEdge(i) {
    if (c.phase !== 'play') return;
    const s = step(), ed = c.g.edges[i];
    if (s.t === 'loop') {
      if (ed.a === ed.b) { markLoop(ed.a); return right(T('Found it — the loop at the ' + nm(ed.a) + '.', 'Jumpa — gelung di ' + nm(ed.a) + '.')); }
      return wrong('missed_loop', T('That corridor joins two different places. A loop starts and ends at the same place.', 'Koridor itu menghubungkan dua tempat berbeza. Gelung bermula dan berakhir di tempat yang sama.'), 'c-e' + i);
    }
    if (s.t === 'multi') {
      if (isMulti(c.g, i)) {
        const k = pairKey(ed);
        c.g.edges.forEach((x, j) => { if (pairKey(x) === k) c.found.add(j); });
        return right(T('Yes — the ' + nm(ed.a) + ' and the ' + nm(ed.b) + ' are joined by two corridors: multiple edges.', 'Ya — ' + nm(ed.a) + ' dan ' + nm(ed.b) + ' dihubungkan oleh dua koridor: sisi berbilang.'));
      }
      return wrong('missed_multiple_edge', T('That corridor has no twin. Look for two corridors joining the same two places.', 'Koridor itu tiada kembar. Cari dua koridor yang menghubungkan dua tempat yang sama.'), 'c-e' + i);
    }
    say(T('Tap a place (a circle), not a corridor.', 'Ketik tempat (bulatan), bukan koridor.'));
  }

  /* ============================================================
     Hint & Learn
     ============================================================ */
  function hint() {
    if (c.phase !== 'play') return;
    c.hints = 1; c.hint = c.k;
    const s = step();
    c.hl = new Set(); c.dim = new Set();
    if (s.t === 'count') c.g.edges.forEach((ed, i) => { if (ed.a === s.v || ed.b === s.v) c.hl.add(i); });
    if (s.t === 'find') c.g.nodes.forEach(v => { if (Math.abs(degree(c.g, v.id) - s.d) >= 2) c.dim.add(v.id); });
    if (s.t === 'clues') c.g.nodes.forEach(v => { if (!clueHolds(c.g, v.id, s.clues[0])) c.dim.add(v.id); });
    draw(); renderAid();
  }

  function learn() {
    if (c.phase !== 'play') return;
    c.learn = 1; c.learnOn = true;
    draw(); renderAid();
  }

  function touchList(v) {
    const out = [];
    c.g.edges.forEach(ed => {
      if (ed.a === v && ed.b === v) out.push(T('itself twice (the loop)', 'dirinya dua kali (gelung)'));
      else if (ed.a === v) out.push(nm(ed.b));
      else if (ed.b === v) out.push(nm(ed.a));
    });
    return out.join(', ');
  }

  function renderAid() {
    if (c.phase !== 'play') { $('c-aid').innerHTML = ''; return; }
    const s = step();
    let html = '';
    if (c.hint === c.k) {
      const txt = {
        count: T('The corridors touching the ' + nm(s.v) + ' are highlighted. Count each one' + (hasLoop(c.g, s.v) ? ' — a loop counts twice.' : '.'),
          'Koridor yang menyentuh ' + nm(s.v) + ' diserlahkan. Kira setiap satu' + (hasLoop(c.g, s.v) ? ' — gelung dikira dua kali.' : '.')),
        find: T('Places far from ' + s.d + ' corridors are greyed out. Count the corridors at the rest.', 'Tempat yang jauh daripada ' + s.d + ' koridor dikelabukan. Kira koridor di tempat yang tinggal.'),
        loop: T('A loop is drawn as a small closed curve attached to one place.', 'Gelung dilukis sebagai lengkung tertutup kecil yang melekat pada satu tempat.'),
        multi: T('Look for two corridors that curve between the same pair of places.', 'Cari dua koridor yang melengkung antara pasangan tempat yang sama.'),
        clues: T('Places that fail clue 1 are greyed out. Now test the rest against clues 2 and 3.', 'Tempat yang gagal petunjuk 1 dikelabukan. Sekarang uji yang lain dengan petunjuk 2 dan 3.')
      }[s.t];
      html += '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
    }
    if (c.learnOn) {
      let txt;
      if (s.t === 'count') txt = T('The ' + nm(s.v) + ' touches: ' + touchList(s.v) + '. So its degree is ' + degree(c.g, s.v) + '.', nm(s.v) + ' menyentuh: ' + touchList(s.v) + '. Jadi darjahnya ' + degree(c.g, s.v) + '.');
      else if (s.t === 'find') txt = T('Every place now shows its degree (d). Find the one with d=' + s.d + '.', 'Setiap tempat kini menunjukkan darjahnya (d). Cari yang mempunyai d=' + s.d + '.');
      else if (s.t === 'loop') txt = T('A loop joins a place to itself. It adds 2 to that place\'s degree — look for d that seems too big.', 'Gelung menghubungkan tempat dengan dirinya sendiri. Ia menambah 2 pada darjah tempat itu.');
      else if (s.t === 'multi') txt = T('Multiple edges are two or more edges joining the same two vertices. A graph with no loops and no multiple edges is a simple graph.', 'Sisi berbilang ialah dua atau lebih sisi yang menghubungkan dua bucu yang sama. Graf tanpa gelung dan tanpa sisi berbilang ialah graf mudah.');
      else {
        let cand = c.g.nodes.map(v => v.id);
        txt = s.clues.map((cl, j) => {
          cand = cand.filter(v => clueHolds(c.g, v, cl));
          return T('After clue ', 'Selepas petunjuk ') + (j + 1) + ': ' + cand.map(nm).join(', ');
        }).join('<br>');
      }
      html += '<div class="note"><h3>' + T('Learn', 'Belajar') + ' <span class="pill alert">−10 XP</span></h3><p>' + txt + '</p></div>';
    }
    $('c-aid').innerHTML = html;
  }

  /* ============================================================
     Quick check → XP
     ============================================================ */
  function quickCheck() {
    if (c.L.qc) {
      const q = c.L.qc;
      return {
        q: tt(q.q), answer: q.answer, why: () => tt(q.why),
        opts: q.opts.map(o => [o[0], Array.isArray(o[1]) ? tt(o[1]) : o[1]])
      };
    }
    // generated: close one corridor at the answer place
    const v = c.steps[c.steps.length - 1].ans;
    const ed = c.g.edges.find(x => x.a !== x.b && (x.a === v || x.b === v));
    const u = ed.a === v ? ed.b : ed.a, d = degree(c.g, v);
    return {
      q: T('If the corridor between the ' + nm(v) + ' and the ' + nm(u) + ' is closed, the ' + nm(v) + '\'s degree becomes…',
        'Jika koridor antara ' + nm(v) + ' dan ' + nm(u) + ' ditutup, darjah ' + nm(v) + ' menjadi…'),
      opts: [['a', String(d - 1)], ['b', String(d)], ['c', String(d + 1)]], answer: 'a',
      why: () => T('Each corridor adds 1 to each of its two ends. Closing one takes the ' + nm(v) + ' from ' + d + ' to ' + (d - 1) + ', and the ' + nm(u) + ' down by 1 too.',
        'Setiap koridor menambah 1 pada kedua-dua hujungnya. Menutup satu koridor menjadikan ' + nm(v) + ' daripada ' + d + ' kepada ' + (d - 1) + ', dan ' + nm(u) + ' turut berkurang 1.')
    };
  }

  function renderPanel() {
    if (c.phase === 'play') { $('c-panel').innerHTML = ''; return; }
    const head = '<div class="note ok"><h3>' + T('Case solved!', 'Kes selesai!') + '</h3><p>' +
      (c.wrong ? T('You got there with ' + c.wrong + ' wrong answer' + (c.wrong > 1 ? 's' : '') + ' — mistakes cost nothing here.', 'Anda berjaya dengan ' + c.wrong + ' jawapan salah — kesilapan tidak merugikan di sini.')
        : T('Every answer right first time.', 'Semua jawapan betul pada cubaan pertama.')) + '</p></div>';
    if (c.phase === 'check') {
      const qc = quickCheck();
      $('c-panel').innerHTML = head + '<div class="note"><h3>' + T('Quick check', 'Semakan pantas') + ' <span class="pill new">+20 XP</span></h3><p>' + qc.q + '</p>' +
        '<div class="opts">' + qc.opts.map(o => '<button class="opt" data-opt="' + o[0] + '">' + o[1] + '</button>').join('') + '</div><div id="c-qc-out"></div></div>';
      $('c-panel').querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => answerCheck(b.dataset.opt)));
      return;
    }
    $('c-panel').innerHTML = head + xpCardHtml(2, c.i, c.xp);
    wireXp($('c-panel'), 2, c.i);
  }

  function answerCheck(pick) {
    const qc = quickCheck(), ok = pick === qc.answer;
    c.reasoning = ok;
    $('c-panel').querySelectorAll('[data-opt]').forEach(b => {
      b.disabled = true;
      if (b.dataset.opt === qc.answer) b.classList.add('right');
      else if (b.dataset.opt === pick) b.classList.add('wrong');
    });
    $('c-qc-out').innerHTML = '<p style="margin:12px 0;">' + (ok ? T('Right — ', 'Betul — ') : T('Not quite — ', 'Belum tepat — ')) + qc.why() + '</p>' +
      '<button class="btn sm" id="c-score">' + T('See my XP', 'Lihat XP saya') + '</button>';
    $('c-score').addEventListener('click', award);
  }

  function award() {
    const parts = [
      ['correct', T('Case solved', 'Kes selesai'), 60],
      ['reasoning', T('Quick check', 'Semakan pantas'), c.reasoning ? 20 : 0],
      ['nohint', T('No hint or Learn', 'Tanpa petunjuk atau Belajar'), (c.hints || c.learn) ? 0 : 10],
      ['speed', T('Speed · under ', 'Kelajuan · bawah ') + c.L.target + ' s (' + c.solveTime + ' s)', c.solveTime <= c.L.target ? 10 : 0]
    ];
    if (c.learn) parts.push(['learn', T('Used Learn', 'Guna Belajar'), -10]);
    c.xp = finishLevel(2, c.i, parts, c.solveTime, c.hints, c.learn);
    const badges = ['first_connection'];
    if (!c.hints && !c.learn) { st.cleanCases = (st.cleanCases || 0) + 1; if (st.cleanCases >= 5) badges.push('sharp_detective'); }
    giveBadges(badges);
    c.phase = 'xp';
    renderPanel();
  }

  /* ============================================================
     Discover — fill the degree table, then name the rule
     ============================================================ */
  let dz = null;
  function renderDiscover() {
    const g = LEVELS[0].g;
    if (!dz) dz = { deg: {}, edges: null, pick: null };
    const allDeg = g.nodes.every(v => dz.deg[v.id] === degree(g, v.id));
    const edgesOk = dz.edges === g.edges.length;
    const answered = dz.pick !== null || st.discovered[2];
    const pick = dz.pick || (st.discovered[2] ? 'b' : null);

    portrait = false;
    let html = '<div class="badge">' + T('World 2 · Discover', 'Dunia 2 · Temui') + '</div>' +
      '<h1>' + T('What do you <span class="script">notice?</span>', 'Apa yang anda <span class="script">perasan?</span>') + '</h1>' +
      '<p>' + T('This is the map from Level 1. Fill in the degree of each place, then count the corridors.', 'Ini peta daripada Tahap 1. Isikan darjah setiap tempat, kemudian kira koridornya.') + '</p>' +
      '<div class="disc-grid"><div class="board"><svg viewBox="0 0 640 400">' + svgFor(g, {}) + '</svg></div><div>' +
      '<table class="degtab"><tr><th>' + T('Place', 'Tempat') + '</th><th class="num">' + T('Degree', 'Darjah') + '</th></tr>' +
      g.nodes.map(v => {
        const ok = dz.deg[v.id] === degree(g, v.id);
        return '<tr><td>' + nm(v.id) + '</td><td class="num"><input class="cell' + (ok ? ' ok' : '') + '" data-v="' + v.id + '" inputmode="numeric" maxlength="1" value="' + (dz.deg[v.id] != null ? dz.deg[v.id] : '') + '"' + (ok ? ' readonly' : '') + ' aria-label="' + T('Degree of ', 'Darjah ') + nm(v.id) + '"></td></tr>';
      }).join('') +
      '<tr class="sum"><td>' + T('Sum of degrees', 'Hasil tambah darjah') + '</td><td class="num">' + (allDeg ? degSum(g) : '?') + '</td></tr>' +
      '<tr><td>' + T('Number of corridors', 'Bilangan koridor') + '</td><td class="num">' +
      (allDeg ? '<input class="cell' + (edgesOk ? ' ok' : '') + '" data-e="1" inputmode="numeric" maxlength="2" value="' + (dz.edges != null ? dz.edges : '') + '"' + (edgesOk ? ' readonly' : '') + '>' : '?') +
      '</td></tr></table></div></div>';

    if (allDeg && edgesOk) {
      const opts = [
        ['a', T('The sum of degrees equals the number of corridors.', 'Hasil tambah darjah sama dengan bilangan koridor.')],
        ['b', T('The sum of degrees is 2 × the number of corridors.', 'Hasil tambah darjah ialah 2 × bilangan koridor.')],
        ['c', T('The sum of degrees is 2 × the number of places.', 'Hasil tambah darjah ialah 2 × bilangan tempat.')]
      ];
      html += '<div class="sec-title" style="margin-top:24px;">' + T('Which is true?', 'Yang manakah benar?') + '</div>' +
        '<div class="opts">' + opts.map(o => '<button class="opt' + (answered ? (o[0] === 'b' ? ' right' : o[0] === pick ? ' wrong' : '') : '') + '" data-pick="' + o[0] + '"' + (answered ? ' disabled' : '') + '>' + o[1] + '</button>').join('') + '</div>';
    }

    if (answered) {
      const why = pick === 'b' ? T('Exactly. Each corridor has two ends, so it adds 1 to two places — 2 to the total.', 'Tepat sekali. Setiap koridor ada dua hujung, jadi ia menambah 1 pada dua tempat — 2 kepada jumlah.')
        : pick === 'a' ? T('Look again: 12 is not 6. Each corridor is counted at both of its ends.', 'Lihat semula: 12 bukan 6. Setiap koridor dikira pada kedua-dua hujungnya.')
          : T('There are 5 places, and 2 × 5 = 10, not 12. It is the corridors that matter.', 'Ada 5 tempat, dan 2 × 5 = 10, bukan 12. Koridor yang penting.');
      const rows = LEVELS.filter(L => L.g).map((L, k) => '<tr><td>' + T('Level ', 'Tahap ') + (k + 1) + '</td><td class="num">' + degSum(L.g) + '</td><td class="num">' + L.g.edges.length + '</td><td class="num">' + (2 * L.g.edges.length) + '</td></tr>').join('');
      const term = (a, b, d1, d2) => '<div class="tcard"><b>' + T(a, b) + '</b><i>' + T(b, a) + '</i><span>' + T(d1, d2) + '</span></div>';
      html += '<p style="margin-top:16px;"><b class="ink">' + why + '</b></p>';
      if (st.discovered[2]) {
        html += '<p>' + T('It works on every map you solved — even Level 3, where the loop adds 2 to one place:', 'Ia berlaku pada setiap peta yang anda selesaikan — termasuk Tahap 3, di mana gelung menambah 2 pada satu tempat:') + '</p>' +
          '<table><tr><th>' + T('Map', 'Peta') + '</th><th class="num">' + T('Sum of degrees', 'Hasil tambah darjah') + '</th><th class="num">' + T('Corridors', 'Koridor') + '</th><th class="num">2 × ' + T('corridors', 'koridor') + '</th></tr>' + rows + '</table>' +
          '<div class="sec-title" style="margin-top:22px;">' + T('Now it has a name', 'Kini ia ada nama') + '</div><div class="terms">' +
          term('Degree', 'Darjah', 'The number of edges touching a vertex. A loop counts 2.', 'Bilangan sisi yang menyentuh sesuatu bucu. Gelung dikira 2.') +
          term('Sum of degrees = 2 × edges', 'Hasil tambah darjah = 2 × bilangan sisi', 'True for every graph, because each edge has two ends.', 'Benar bagi setiap graf, kerana setiap sisi ada dua hujung.') +
          term('Simple graph', 'Graf mudah', 'A graph with no loops and no multiple edges.', 'Graf tanpa gelung dan tanpa sisi berbilang.') +
          '</div>';
      }
      html += '<div class="row" style="margin-top:24px;"><button class="btn" id="btn-disc-map">' + T('Back to map', 'Kembali ke peta') + '</button>' +
        '<span class="muted">' + (st.discovered[2] ? T('+20 XP for discovering', '+20 XP kerana menemui') : '') + '</span></div>';
    }

    $('screen-discover').innerHTML = html;
    $('screen-discover').querySelectorAll('input[data-v]').forEach(inp => inp.addEventListener('input', () => {
      const v = inp.dataset.v, x = parseInt(inp.value, 10);
      if (isNaN(x)) return;
      dz.deg[v] = x;
      if (x !== degree(g, v)) { inp.classList.add('bad'); SFX.play('wrong'); return; }
      renderDiscover();
      const nextBox = $('screen-discover').querySelector('input:not([readonly])');
      if (nextBox) nextBox.focus();
    }));
    const ei = $('screen-discover').querySelector('input[data-e]');
    if (ei) ei.addEventListener('input', () => {
      const x = parseInt(ei.value, 10);
      if (isNaN(x)) return;
      dz.edges = x;
      if (x === g.edges.length) renderDiscover();
      else if (ei.value.length >= String(g.edges.length).length) { ei.classList.add('bad'); SFX.play('wrong'); }
    });
    $('screen-discover').querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => {
      dz.pick = b.dataset.pick;
      if (dz.pick === 'b' && !st.discovered[2]) { st.discovered[2] = true; save(); }
      renderDiscover();
      if (dz.pick !== 'b') setTimeout(() => { dz.pick = null; renderDiscover(); }, 4200);
    }));
    const back = $('btn-disc-map');
    if (back) back.addEventListener('click', () => { dz = null; renderMap(); show('map'); });
  }

  /* ============================================================
     Wiring (runs once the DOM is there)
     ============================================================ */
  function wire() {
    $('svg2').addEventListener('click', ev => {
      const t = ev.target.closest('[data-edge],[data-node]');
      if (!t) return;
      if (t.dataset.node) tapNode(t.dataset.node); else tapEdge(+t.dataset.edge);
    });
    $('svg2').addEventListener('keydown', ev => {
      const t = ev.target.closest('[data-node]');
      if (t && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); tapNode(t.dataset.node); }
    });
    $('c-hint').addEventListener('click', hint);
    $('c-learn').addEventListener('click', learn);
    $('c-map').addEventListener('click', () => { clearInterval(timer); renderMap(); show('map'); });
    let rt = null;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { if (current === 'case' && c && ($('svg2').parentElement.clientWidth < 560) !== portrait) draw(); }, 150);
    });
  }

  const api = {
    levels: LEVELS, start, render: () => c && render(), renderDiscover, wire,
    // for tests
    _: { degree, adjacent, fits, degSum, checkLevels, randomLevel, makeClues }
  };
  root.W2 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
