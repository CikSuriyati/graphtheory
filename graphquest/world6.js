/**
 * GRAPH QUEST — World 6 (bonus), Colour Master
 * ------------------------------------------------------------------
 * The school exam timetable: subjects that share students clash (an edge)
 * and can't sit in the same slot (colour). Every slot has a colour, a
 * number AND a shape, so colour-blind students can play fully.
 *   L1  any valid timetable (up to 4 slots)
 *   L2  within 3 slots
 *   L3  the fewest slots
 *   L4  a bigger timetable, fewest slots
 *   L5  a generated timetable
 * Discover: subjects that all clash with each other each need their own
 * slot, so the fewest slots is at least the size of the largest such group.
 */
(function (root) {
  'use strict';

  const SUBJECTS = {
    M: ['Maths', 'Matematik'], S: ['Science', 'Sains'], H: ['History', 'Sejarah'], E: ['English', 'B. Inggeris'], B: ['Malay', 'B. Melayu'],
    P: ['Physics', 'Fizik'], C: ['Chemistry', 'Kimia'], I: ['Biology', 'Biologi'], A: ['Add Maths', 'Mat. Tambahan'], G: ['Geography', 'Geografi'],
    R: ['Art', 'Seni'], Q: ['Islamic St.', 'P. Islam'], O: ['Moral', 'P. Moral']
  };
  const nm = id => tt(SUBJECTS[id]);
  const n = (id, x, y) => ({ id, x, y });
  const e = (a, b) => ({ a, b });
  const SHAPE = ['', '●', '▲', '■', '◆'];

  const LEVELS = [
    {
      title: ['A valid timetable', 'Jadual yang sah'], target: 60, maxSlots: 4, goal: 'valid',
      story: ['Plan the SPM trial exams. A line joins two subjects that <b class="ink">share students</b> — they can’t sit in the same slot. Pick a slot below, then tap subjects to put them in it.',
        'Rancang peperiksaan percubaan SPM. Garisan menghubungkan dua subjek yang <b class="ink">berkongsi murid</b> — ia tidak boleh diadakan dalam slot yang sama. Pilih slot di bawah, kemudian ketik subjek untuk meletakkannya.'],
      g: { nodes: [n('M', 120, 110), n('S', 320, 60), n('H', 520, 110), n('E', 320, 220), n('B', 320, 350)],
        edges: [e('M', 'S'), e('S', 'H'), e('H', 'E'), e('E', 'M'), e('B', 'M'), e('B', 'H')] },
      qc: { q: ['Maths and Science share students. Can their exams be in the same slot?', 'Matematik dan Sains berkongsi murid. Bolehkah peperiksaannya dalam slot yang sama?'],
        opts: [['a', ['No — a student can’t sit two papers at once', 'Tidak — murid tidak boleh menduduki dua kertas serentak']], ['b', ['Yes, in different rooms', 'Ya, dalam bilik berbeza']], ['c', ['Only if there are 2 slots', 'Hanya jika ada 2 slot']]], answer: 'a',
        why: ['a line (an edge) means a clash. Joined subjects must get different slots — different colours.', 'garisan (sisi) bermaksud pertembungan. Subjek yang dihubungkan mesti mendapat slot berbeza — warna berbeza.'] }
    },
    {
      title: ['Three slots only', 'Tiga slot sahaja'], target: 75, maxSlots: 3, goal: 'max',
      story: ['The hall is free for only <b class="ink">3 slots</b>. Fit every paper in.', 'Dewan hanya kosong untuk <b class="ink">3 slot</b>. Muatkan setiap kertas.'],
      g: { nodes: [n('P', 320, 60), n('C', 200, 230), n('I', 440, 230), n('A', 100, 90), n('M', 90, 330), n('E', 560, 360)],
        edges: [e('P', 'C'), e('C', 'I'), e('I', 'P'), e('A', 'P'), e('A', 'M'), e('M', 'C'), e('E', 'I')] },
      qc: { q: ['Physics, Chemistry and Biology all clash with each other. At least how many slots do they need?', 'Fizik, Kimia dan Biologi semuanya bertembung antara satu sama lain. Sekurang-kurangnya berapa slot diperlukan?'],
        opts: [['a', '3'], ['b', '2'], ['c', '1']], answer: 'a',
        why: ['each of the three clashes with the other two, so no two of them can share a slot.', 'setiap satu bertembung dengan dua yang lain, jadi tiada dua daripadanya boleh berkongsi slot.'] }
    },
    {
      title: ['Fewest slots', 'Slot paling sedikit'], target: 90, goal: 'fewest',
      story: ['Every extra slot is an extra exam day. Use the <b class="ink">fewest slots</b> possible.', 'Setiap slot tambahan ialah hari peperiksaan tambahan. Guna <b class="ink">slot paling sedikit</b>.'],
      g: { nodes: [n('M', 80, 200), n('A', 220, 70), n('P', 220, 330), n('C', 380, 200), n('I', 520, 70), n('E', 520, 330), n('B', 610, 200)],
        edges: [e('M', 'A'), e('M', 'P'), e('A', 'P'), e('A', 'C'), e('P', 'C'), e('C', 'I'), e('C', 'E'), e('I', 'B'), e('E', 'B')] },
      qc: { q: ['Why can’t this timetable fit into 2 slots?', 'Kenapa jadual ini tidak muat dalam 2 slot?'],
        opts: [['a', ['Some three subjects all clash with each other — each needs its own slot', 'Ada tiga subjek yang semuanya bertembung — setiap satu perlukan slot sendiri']], ['b', ['It has more than 6 subjects', 'Ia ada lebih daripada 6 subjek']], ['c', ['Chemistry clashes with the most subjects', 'Kimia bertembung dengan paling banyak subjek']]], answer: 'a',
        why: ['Maths, Add Maths and Physics form a triangle of clashes. A triangle can never be done in 2 slots.', 'Matematik, Mat. Tambahan dan Fizik membentuk segi tiga pertembungan. Segi tiga tidak boleh dimuatkan dalam 2 slot.'] }
    },
    {
      title: ['The science stream', 'Aliran sains'], target: 120, goal: 'fewest',
      story: ['A bigger timetable for the science stream. Fewest slots again.', 'Jadual lebih besar untuk aliran sains. Slot paling sedikit sekali lagi.'],
      g: { nodes: [n('P', 320, 50), n('C', 170, 250), n('I', 470, 250), n('A', 320, 180), n('M', 60, 110), n('E', 580, 110), n('B', 320, 360), n('G', 60, 350), n('R', 580, 350)],
        edges: [e('P', 'C'), e('P', 'I'), e('C', 'I'), e('A', 'P'), e('A', 'C'), e('A', 'I'), e('M', 'P'), e('M', 'C'), e('E', 'P'), e('E', 'I'), e('B', 'C'), e('B', 'I'), e('G', 'C'), e('G', 'M'), e('R', 'I'), e('R', 'B')] }
    },
    {
      title: ['Random timetable', 'Jadual rawak'], target: 120, goal: 'fewest', random: true,
      story: ['A new set of clashes every time. Fewest slots wins.', 'Set pertembungan baharu setiap kali. Slot paling sedikit menang.']
    }
  ];

  /* ---------- graph maths ---------- */
  const adj = (g, a, b) => g.edges.some(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
  function colourWith(g, k) {
    const ids = g.nodes.map(v => v.id).sort((a, b) => deg(g, b) - deg(g, a)), col = {};
    const ok = (v, c) => ids.every(u => col[u] !== c || !adj(g, u, v));
    return (function go(i) {
      if (i === ids.length) return Object.assign({}, col);
      for (let c = 1; c <= k; c++) if (ok(ids[i], c)) { col[ids[i]] = c; const r = go(i + 1); if (r) return r; delete col[ids[i]]; }
      return null;
    })(0);
  }
  const deg = (g, v) => g.edges.reduce((d, x) => d + (x.a === v) + (x.b === v), 0);
  function chromatic(g) { for (let k = 1; k <= 6; k++) { const c = colourWith(g, k); if (c) return { k, colouring: c }; } return null; }
  function maxClique(g) {
    const ids = g.nodes.map(v => v.id); let best = [];
    for (let m = 1; m < (1 << ids.length); m++) {
      const set = ids.filter((_, i) => m & (1 << i));
      if (set.length <= best.length) continue;
      if (set.every((a, i) => set.slice(i + 1).every(b => adj(g, a, b)))) best = set;
    }
    return best;
  }

  function checkLevels() {
    return LEVELS.filter(L => L.g).map((L, i) => 'L' + (i + 1) + ' χ=' + chromatic(L.g).k + ' clique=' + maxClique(L.g).length + (L.maxSlots && chromatic(L.g).k > L.maxSlots ? ' TOO MANY' : '')).join(' · ');
  }

  const POOL = ['M', 'S', 'H', 'E', 'B', 'P', 'C', 'I', 'A', 'G', 'R', 'Q', 'O'];
  function randomTimetable() {
    for (let t = 0; t < 100; t++) {
      const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, R = E.rng(seed);
      const base = E.generate(seed, { n: 7 });
      const keys = shuffled(POOL, R).slice(0, 7), map = {};
      base.nodes.forEach((v, i) => { map[v.id] = keys[i]; });
      const g = { nodes: base.nodes.map(v => ({ id: map[v.id], x: v.x, y: v.y })), edges: base.edges.map(x => ({ a: map[x.a], b: map[x.b] })) };
      if (chromatic(g).k >= 3) return g;
    }
    return LEVELS[2].g;
  }

  /* ============================================================
     Play
     ============================================================ */
  let c = null;

  function start(i) {
    const L = LEVELS[i], g = L.random ? randomTimetable() : L.g, chi = chromatic(g);
    c = { i, L, g, chi, col: {}, slot: 1, phase: 'play', hints: 0, learn: 0, wrong: 0, aid: null, maxSlots: L.maxSlots || 4 };
    PLAY.open({ world: 6, i, levels: LEVELS, title: L.title, story: L.story, target: L.target, onTap, render,
      terms: i === 0 ? [['clash = edge', 'pertembungan = sisi'], ['slot = colour', 'slot = warna']] : null });
    render();
  }

  function logWrong(tag, score) {
    c.wrong++;
    logAttempt({ world: 6, level: c.i + 1, correct: !!score, optimal: false, score_xp: score || 0, mistake_tag: tag, hints_used: c.hints, learn_used: c.learn, time_s: PLAY.secs() });
    if (score) st.best['6-' + (c.i + 1)] = Math.max(st.best['6-' + (c.i + 1)] || 0, score);
    save();
  }

  const clashes = () => c.g.edges.map((x, i) => i).filter(i => { const x = c.g.edges[i]; return c.col[x.a] && c.col[x.a] === c.col[x.b]; });
  const used = () => new Set(Object.values(c.col)).size;
  const allDone = () => c.g.nodes.every(v => c.col[v.id]);

  function render() {
    const bad = new Set(clashes()), hl = c.hl || new Set();
    PLAY.draw(c.g, {
      name: nm,
      edgeCls: i => (bad.has(i) ? 'clash' : '') + (hl.has(i) ? ' hl' : ''),
      nodeCls: id => (c.col[id] ? 's' + c.col[id] : '') + (c.hintSet && c.hintSet.has(id) ? ' hintn' : ''),
      tag: id => c.col[id] ? c.col[id] + SHAPE[c.col[id]] : ''
    });
    $('p-trail').innerHTML = '<div class="palette">' + [1, 2, 3, 4].slice(0, c.maxSlots).map(k =>
      '<button class="slot s' + k + (c.slot === k ? ' on' : '') + '" data-slot="' + k + '" aria-label="' + T('Slot ', 'Slot ') + k + '"><b>' + k + SHAPE[k] + '</b><span>' + T('Slot ', 'Slot ') + k + '</span></button>').join('') + '</div>';
    $('p-trail').querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => { c.slot = +b.dataset.slot; render(); }));
    $('p-total').innerHTML = used() + '<small> ' + T(used() === 1 ? 'slot used' : 'slots used', 'slot digunakan') + '</small>';
    const play = c.phase === 'play';
    PLAY.controls([
      { id: 'w6-clear', label: T('Clear all', 'Kosongkan'), on: () => { c.col = {}; PLAY.say(''); render(); }, disabled: !play || !Object.keys(c.col).length },
      { id: 'w6-hint', label: T('Hint', 'Petunjuk'), on: hint, disabled: !play },
      { id: 'w6-learn', label: T('Learn', 'Belajar'), on: learn, disabled: !play },
      null,
      { id: 'w6-go', label: T('Publish the timetable', 'Terbitkan jadual'), on: submit, disabled: !play || !allDone(), primary: true }
    ]);
    if (play && allDone()) $('w6-go').classList.add('pulse');
    renderAid();
    if (c.phase !== 'play') renderPanel();
  }

  function onTap(t) {
    if (c.phase !== 'play' || !t.node) return;
    if (c.col[t.node] === c.slot) delete c.col[t.node]; else c.col[t.node] = c.slot;
    c.hl = null; c.hintSet = null;
    const bad = clashes();
    if (bad.length) {
      const x = c.g.edges[bad[0]];
      PLAY.say(T(nm(x.a) + ' and ' + nm(x.b) + ' share students — they can’t both be in slot ' + c.col[x.a] + '.', nm(x.a) + ' dan ' + nm(x.b) + ' berkongsi murid — tidak boleh kedua-duanya dalam slot ' + c.col[x.a] + '.'), true);
    } else PLAY.say('');
    render();
  }

  function submit() {
    if (c.phase !== 'play' || !allDone()) return;
    if (clashes().length) { logWrong('clash'); return PLAY.say(T('Some papers still clash (red lines). Move one of each pair to another slot.', 'Masih ada kertas yang bertembung (garisan merah). Alihkan satu daripada setiap pasangan ke slot lain.'), true); }
    const u = used(), L = c.L;
    if (L.goal === 'max' && u > L.maxSlots) { logWrong('too_many_slots'); return PLAY.say(T('That uses ' + u + ' slots — only ' + L.maxSlots + ' are free.', 'Itu guna ' + u + ' slot — hanya ' + L.maxSlots + ' yang kosong.'), true); }
    if (L.goal === 'fewest' && u > c.chi.k) {
      logWrong('not_fewest', 30);
      $('p-panel').innerHTML = '<div class="note warn"><h3>' + T('Valid — but not the fewest slots', 'Sah — tetapi bukan slot paling sedikit') + '</h3><p>' +
        T('You used <b class="ink">' + u + '</b> slots. It can be done in <b class="ink">' + c.chi.k + '</b>. Start with the subject that clashes most.', 'Anda guna <b class="ink">' + u + '</b> slot. Ia boleh dibuat dalam <b class="ink">' + c.chi.k + '</b>. Mula dengan subjek yang paling banyak bertembung.') +
        '</p><span class="muted">' + T('+30 XP banked.', '+30 XP disimpan.') + '</span></div>';
      return;
    }
    $('p-panel').innerHTML = '';
    if (u === c.chi.k && L.goal !== 'valid') st.fewestSlots = (st.fewestSlots || 0) + 1;
    c.phase = 'check'; c.time = PLAY.stopClock(); c.aid = null;
    PLAY.say(T('Timetable published — no clashes.', 'Jadual diterbitkan — tiada pertembungan.'));
    render();
  }

  /* ---------- hint & learn ---------- */
  function hint() {
    c.hints = 1; c.aid = 'hint';
    const bad = clashes();
    if (bad.length) { c.hl = new Set(bad); c.hintSet = null; }
    else { c.hintSet = new Set(maxClique(c.g)); c.hl = null; }
    render();
  }
  function learn() { c.learn = 1; c.aid = 'learn'; render(); }

  function renderAid() {
    if (c.phase !== 'play' || !c.aid) { $('p-aid').innerHTML = ''; return; }
    const q = maxClique(c.g);
    if (c.aid === 'hint') {
      const txt = c.hl ? T('The highlighted lines join two subjects in the same slot. Move one of them.', 'Garisan yang diserlahkan menghubungkan dua subjek dalam slot yang sama. Alihkan salah satunya.')
        : T('The ringed subjects (' + q.map(nm).join(', ') + ') all clash with each other, so they need ' + q.length + ' different slots. Place them first.', 'Subjek berbulatan (' + q.map(nm).join(', ') + ') semuanya bertembung, jadi perlukan ' + q.length + ' slot berbeza. Letakkan dahulu.');
      $('p-aid').innerHTML = '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
      return;
    }
    const rows = c.g.nodes.map(v => v.id).sort((a, b) => deg(c.g, b) - deg(c.g, a))
      .map(id => '<tr><td>' + nm(id) + '</td><td class="num">' + deg(c.g, id) + '</td><td><b>' + c.chi.colouring[id] + SHAPE[c.chi.colouring[id]] + '</b></td></tr>').join('');
    $('p-aid').innerHTML = '<div class="note"><h3>' + T('Learn: busiest first', 'Belajar: paling sibuk dahulu') + ' <span class="pill alert">−10 XP</span></h3><p>' +
      T('Place the subject with the most clashes first, then the next, each in the lowest slot that doesn’t clash. The largest group that all clash — ' + q.map(nm).join(', ') + ' — shows you need at least ' + q.length + ' slots. This timetable fits in <b class="ink">' + c.chi.k + '</b>:',
        'Letakkan subjek yang paling banyak bertembung dahulu, kemudian seterusnya, setiap satu dalam slot terendah yang tidak bertembung. Kumpulan terbesar yang semuanya bertembung — ' + q.map(nm).join(', ') + ' — menunjukkan anda perlukan sekurang-kurangnya ' + q.length + ' slot. Jadual ini muat dalam <b class="ink">' + c.chi.k + '</b>:') +
      '</p><table><tr><th>' + T('Subject', 'Subjek') + '</th><th class="num">' + T('Clashes', 'Pertembungan') + '</th><th>' + T('Slot', 'Slot') + '</th></tr>' + rows + '</table></div>';
  }

  /* ---------- quick check → XP ---------- */
  function quickCheck() {
    if (c.L.qc) { const q = c.L.qc; return { q: tt(q.q), answer: q.answer, why: tt(q.why), opts: q.opts.map(o => [o[0], Array.isArray(o[1]) ? tt(o[1]) : o[1]]) }; }
    if (c.i === 3) {
      return { q: T('Physics, Chemistry, Biology and Add Maths all clash with each other. So the fewest slots is at least…', 'Fizik, Kimia, Biologi dan Mat. Tambahan semuanya bertembung antara satu sama lain. Jadi slot paling sedikit sekurang-kurangnya…'),
        opts: [['a', '4'], ['b', '3'], ['c', '5']], answer: 'a',
        why: T('four subjects that all clash need four different slots.', 'empat subjek yang semuanya bertembung perlukan empat slot berbeza.') };
    }
    const k = c.chi.k;
    return { q: T('A new subject is added that clashes with every other subject. The fewest slots becomes…', 'Subjek baharu ditambah yang bertembung dengan semua subjek lain. Slot paling sedikit menjadi…'),
      opts: [['a', String(k + 1)], ['b', String(k)], ['c', String(k + 2)]], answer: 'a',
      why: T('it can’t share a slot with anyone, so it needs a slot of its own: ' + k + ' + 1.', 'ia tidak boleh berkongsi slot dengan sesiapa, jadi perlukan slot sendiri: ' + k + ' + 1.') };
  }

  function renderPanel() {
    const head = '<div class="note ok"><h3>' + T('Timetable published!', 'Jadual diterbitkan!') + '</h3><p>' + T(used() + ' slots, no clashes.', used() + ' slot, tiada pertembungan.') + '</p></div>';
    if (c.phase === 'check') {
      return PLAY.quick(head, quickCheck(), ok => {
        c.xp = finishLevel(6, c.i, PLAY.parts(T('Valid timetable', 'Jadual sah'), ok, c.hints, c.learn, c.time, c.L.target), c.time, c.hints, c.learn);
        giveBadges((st.fewestSlots || 0) >= 3 ? ['first_connection', 'exam_planner'] : ['first_connection']);
        c.phase = 'xp'; renderPanel();
      });
    }
    if (c.phase === 'xp') PLAY.xp(head, 6, c.i, c.xp);
  }

  function renderDiscover() {
    PLAY.discover({
      w: 6,
      opts: [
        ['a', T('Subjects that all clash with each other each need their own slot — so the fewest slots is at least the size of the biggest such group.', 'Subjek yang semuanya bertembung antara satu sama lain perlukan slot sendiri — jadi slot paling sedikit sekurang-kurangnya saiz kumpulan terbesar sedemikian.')],
        ['b', T('The fewest slots equals the number of clashes.', 'Slot paling sedikit sama dengan bilangan pertembungan.')],
        ['c', T('Every timetable fits in 2 slots if you are clever enough.', 'Setiap jadual muat dalam 2 slot jika anda cukup bijak.')]
      ],
      answer: 'a',
      why: p => p === 'a' ? T('Exactly — a triangle forced 3 slots, and the science stream’s four-way clash forced 4.', 'Tepat — segi tiga memaksa 3 slot, dan pertembungan empat hala aliran sains memaksa 4.')
        : p === 'b' ? T('Level 3 had 9 clashes and fitted in 3 slots.', 'Tahap 3 ada 9 pertembungan dan muat dalam 3 slot.')
          : T('Three subjects that all clash can never share 2 slots — someone always doubles up.', 'Tiga subjek yang semuanya bertembung tidak boleh berkongsi 2 slot — pasti ada yang bertindih.'),
      terms: [
        ['Graph colouring', 'Pewarnaan graf', 'Giving each vertex a colour so that joined vertices never share one.', 'Memberi setiap bucu satu warna supaya bucu yang dihubungkan tidak berkongsi warna.'],
        ['Chromatic number', 'Nombor kromatik', 'The fewest colours a graph can be coloured with.', 'Bilangan warna paling sedikit untuk mewarnakan graf.']
      ]
    });
  }

  const api = { levels: LEVELS, start, render: () => c && render(), renderDiscover, _: { checkLevels, chromatic, maxClique, randomTimetable } };
  root.W6 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
