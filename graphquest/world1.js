/**
 * GRAPH QUEST — World 1, Graph Maze (paths and connectivity)
 * ------------------------------------------------------------------
 * A scout (pengakap) finds the way through the trails of Taman Negara.
 *   L1  any route (a walk — places may repeat)
 *   L2  a path: never the same place twice; dead ends
 *   L3  a path through two checkpoints
 *   L4  one-way trails (a directed graph)
 *   L5  "Is there any way out?" — three maps, one of them disconnected
 * Discover: there is no way out exactly when no path joins Start and Exit.
 *
 * Every fixed map is checked by checkLevels(): a route exists where one
 * should, and none exists on the disconnected map.
 */
(function (root) {
  'use strict';

  const PLACES = {
    G: ['Gate', 'Pintu masuk'], X: ['Exit', 'Pintu keluar'], C: ['Canopy Walk', 'Titian Kanopi'], R: ['River', 'Sungai'],
    K: ['Camp', 'Kem'], V: ['Cave', 'Gua'], W: ['Waterfall', 'Air Terjun'], P: ['Pond', 'Kolam'], L: ['Lookout', 'Puncak'],
    H: ['Hide', 'Pondok Tinjau'], B: ['Bridge', 'Jambatan'], T: ['Tree House', 'Rumah Pokok']
  };
  const nm = id => tt(PLACES[id]);
  const n = (id, x, y) => ({ id, x, y });
  const e = (a, b) => ({ a, b });
  const d = (a, b) => ({ a, b, dir: true });

  const LEVELS = [
    {
      title: ['Find a way out', 'Cari jalan keluar'], target: 45, allowRepeat: true,
      story: ['You are a scout in Taman Negara. Tap trails to walk from the <b class="ink">Gate</b> to the <b class="ink">Exit</b>. Any way will do — you may even pass the same place twice.',
        'Anda seorang pengakap di Taman Negara. Ketik denai untuk berjalan dari <b class="ink">Pintu masuk</b> ke <b class="ink">Pintu keluar</b>. Apa-apa jalan pun boleh — anda juga boleh melalui tempat yang sama dua kali.'],
      terms: [['route', 'laluan']],
      g: { nodes: [n('G', 70, 200), n('C', 200, 90), n('R', 200, 310), n('K', 360, 200), n('V', 480, 90), n('X', 580, 260)],
        edges: [e('G', 'C'), e('G', 'R'), e('C', 'K'), e('R', 'K'), e('C', 'V'), e('K', 'V'), e('K', 'X'), e('V', 'X')] },
      qc: {
        q: ['A route passes the same place twice. If you cut out the part between the two visits, what happens?', 'Satu laluan melalui tempat yang sama dua kali. Jika anda buang bahagian antara dua lawatan itu, apa berlaku?'],
        opts: [['a', ['It still reaches the Exit — and it is shorter', 'Ia masih sampai ke Pintu keluar — dan lebih pendek']], ['b', ['It no longer reaches the Exit', 'Ia tidak lagi sampai ke Pintu keluar']], ['c', ['It becomes longer', 'Ia menjadi lebih panjang']]], answer: 'a',
        why: ['the part between two visits is a detour that ends where it began. Take it out and the route still gets you out — every walk hides a path.', 'bahagian antara dua lawatan ialah lencongan yang berakhir di tempat ia bermula. Buang ia, dan laluan masih membawa anda keluar — setiap jalan menyembunyikan satu lorong.']
      }
    },
    {
      title: ['Never twice', 'Jangan dua kali'], target: 60,
      story: ['Now a real <b class="ink">path</b>: never pass the same place twice. Watch out for dead ends.',
        'Kini satu <b class="ink">lorong</b> sebenar: jangan lalu tempat yang sama dua kali. Hati-hati dengan jalan mati.'],
      terms: [['path', 'lorong']],
      g: { nodes: [n('G', 60, 200), n('C', 180, 80), n('R', 180, 320), n('W', 320, 60), n('K', 320, 200), n('P', 440, 340), n('L', 470, 110), n('X', 590, 220)],
        edges: [e('G', 'C'), e('G', 'R'), e('C', 'W'), e('C', 'K'), e('R', 'K'), e('R', 'P'), e('K', 'L'), e('L', 'X')] },
      qc: {
        q: ['This forest has 8 places. At most how many trails can a path use?', 'Hutan ini ada 8 tempat. Paling banyak berapa denai yang boleh digunakan oleh satu lorong?'],
        opts: [['a', '7'], ['b', '8'], ['c', '16']], answer: 'a',
        why: ['a path visits each place at most once, so it passes at most 8 places — and 8 places are joined by 7 trails.', 'lorong melawat setiap tempat paling banyak sekali, jadi ia melalui paling banyak 8 tempat — dan 8 tempat dihubungkan oleh 7 denai.']
      }
    },
    {
      title: ['Checkpoints', 'Pusat pemeriksaan'], target: 90, checkpoints: ['W', 'B'],
      story: ['The rangers want a report from the <b class="ink">Waterfall</b> and the <b class="ink">Bridge</b> (the flags). Find a path through both — still never the same place twice.',
        'Renjer mahukan laporan dari <b class="ink">Air Terjun</b> dan <b class="ink">Jambatan</b> (bendera). Cari lorong yang melalui kedua-duanya — tetap tidak melalui tempat yang sama dua kali.'],
      g: { nodes: [n('G', 60, 210), n('C', 170, 80), n('R', 170, 330), n('K', 300, 200), n('W', 310, 60), n('B', 320, 340), n('L', 450, 120), n('H', 450, 300), n('X', 590, 210)],
        edges: [e('G', 'C'), e('G', 'R'), e('C', 'K'), e('R', 'K'), e('C', 'W'), e('W', 'L'), e('K', 'L'), e('K', 'H'), e('R', 'B'), e('B', 'H'), e('L', 'X'), e('H', 'X'), e('L', 'H')] },
      qc: {
        q: ['A route goes Gate → Camp → Canopy Walk → Camp → Exit. Is it a path?', 'Satu laluan: Pintu masuk → Kem → Titian Kanopi → Kem → Pintu keluar. Adakah ia lorong?'],
        opts: [['a', ['No — it passes the Camp twice', 'Tidak — ia melalui Kem dua kali']], ['b', ['Yes — it reaches the Exit', 'Ya — ia sampai ke Pintu keluar']], ['c', ['Yes — it has no dead ends', 'Ya — ia tiada jalan mati']]], answer: 'a',
        why: ['a path never repeats a place. Reaching the Exit makes it a walk, but repeating the Camp stops it being a path.', 'lorong tidak pernah mengulangi tempat. Sampai ke Pintu keluar menjadikannya satu jalan, tetapi mengulangi Kem menjadikannya bukan lorong.']
      }
    },
    {
      title: ['One-way trails', 'Denai sehala'], target: 90,
      story: ['After the storm, some trails are one-way: follow the <b class="ink">arrows</b>. A graph whose edges have a direction is a <b class="ink">directed graph</b>.',
        'Selepas ribut, sesetengah denai menjadi sehala: ikut <b class="ink">anak panah</b>. Graf yang sisinya mempunyai arah ialah <b class="ink">graf terarah</b>.'],
      terms: [['directed graph', 'graf terarah']],
      g: { nodes: [n('G', 70, 200), n('C', 210, 80), n('R', 210, 320), n('K', 350, 200), n('T', 360, 60), n('V', 480, 320), n('X', 590, 200)],
        edges: [d('G', 'C'), d('R', 'G'), d('C', 'K'), d('C', 'T'), d('T', 'K'), d('K', 'V'), d('V', 'X'), d('X', 'K'), d('V', 'R')] },
      qc: {
        q: ['A one-way trail runs from P to Q. Can you walk it from Q to P?', 'Satu denai sehala dari P ke Q. Bolehkah anda berjalan dari Q ke P?'],
        opts: [['a', ['No — in a directed graph each edge has a direction', 'Tidak — dalam graf terarah setiap sisi ada arah']], ['b', ['Yes — trails work both ways', 'Ya — denai boleh dilalui dua arah']], ['c', ['Only if Q has one trail', 'Hanya jika Q ada satu denai']]], answer: 'a',
        why: ['an arrow allows travel one way only. That is why the shortest-looking way out was blocked.', 'anak panah membenarkan perjalanan satu arah sahaja. Itulah sebabnya jalan keluar yang nampak paling dekat telah tersekat.']
      }
    },
    {
      title: ['Any way out?', 'Ada jalan keluar?'], target: 120, maps: true,
      story: ['Three forests after a flood. On each one: find a way out — or, if there truly is none, press <b class="ink">No way out</b>.',
        'Tiga hutan selepas banjir. Bagi setiap satu: cari jalan keluar — atau, jika memang tiada, tekan <b class="ink">Tiada jalan keluar</b>.'],
      maps: [
        { nodes: [n('G', 80, 200), n('C', 240, 90), n('R', 240, 310), n('K', 420, 200), n('X', 570, 200)],
          edges: [e('G', 'C'), e('G', 'R'), e('C', 'K'), e('R', 'K'), e('K', 'X')] },
        { nodes: [n('G', 80, 120), n('C', 210, 60), n('R', 210, 220), n('K', 430, 200), n('L', 560, 90), n('X', 560, 310)],
          edges: [e('G', 'C'), e('C', 'R'), e('G', 'R'), e('K', 'L'), e('L', 'X'), e('K', 'X')] },
        { nodes: [n('G', 90, 310), n('C', 90, 140), n('L', 250, 60), n('T', 420, 60), n('V', 560, 180), n('K', 420, 320), n('X', 250, 330)],
          edges: [e('G', 'C'), e('C', 'L'), e('L', 'T'), e('T', 'V'), e('V', 'K'), e('K', 'X')] }
      ],
      qc: {
        q: ['What makes a graph <b>connected</b>?', 'Apakah yang menjadikan graf <b>tersambung</b>?'],
        opts: [['a', ['A path joins every pair of places', 'Ada lorong antara setiap pasangan tempat']], ['b', ['Every place has at least one trail', 'Setiap tempat ada sekurang-kurangnya satu denai']], ['c', ['It has no dead ends', 'Ia tiada jalan mati']]], answer: 'a',
        why: ['in the second forest every place had trails, yet the two halves were never joined. Connected means you can get from any place to any other.', 'dalam hutan kedua setiap tempat ada denai, tetapi dua bahagian itu tidak pernah bersambung. Tersambung bermaksud anda boleh pergi dari mana-mana tempat ke tempat lain.']
      }
    }
  ];

  /* ---------- checks run by the test script ---------- */
  function simplePathThrough(g, s, t, must) {
    let found = false;
    const seen = new Set([s]);
    (function dfs(u) {
      if (found) return;
      if (u === t) { if (must.every(m => seen.has(m))) found = true; return; }
      g.edges.forEach(ed => {
        if (!PLAY.canGo(ed, u)) return;
        const v = PLAY.other(ed, u);
        if (seen.has(v)) return;
        seen.add(v); dfs(v); seen.delete(v);
      });
    })(s);
    return found;
  }
  function checkLevels() {
    const out = [];
    LEVELS.forEach((L, i) => {
      if (L.g && !simplePathThrough(L.g, 'G', 'X', L.checkpoints || [])) out.push('L' + (i + 1) + ' no route');
      if (L.maps) {
        const ways = L.maps.map(m => PLAY.reach(m, 'G').has('X'));
        if (ways.join() !== 'true,false,true') out.push('L5 maps ' + ways.join());
      }
    });
    // L4: the undirected shortcuts must really be blocked
    const g4 = LEVELS[3].g;
    if (PLAY.canGo(g4.edges.find(x => x.a === 'X' && x.b === 'K'), 'K')) out.push('L4 K→X open');
    return out;
  }

  /* ============================================================
     Play
     ============================================================ */
  let c = null;

  function start(i) {
    const L = LEVELS[i];
    c = { i, L, map: 0, g: L.g || L.maps[0], hints: 0, learn: 0, wrong: 0, logged: new Set(), phase: 'play', aid: null, found: null };
    c.route = new PLAY.Route(c.g, 'G', { allowRepeat: !!L.allowRepeat });
    PLAY.open({ world: 1, i, levels: LEVELS, title: L.title, story: L.story, terms: L.terms, target: L.target, onTap, render });
    render();
  }

  function logWrong(tag, key) {
    if (key && c.logged.has(key)) return;
    if (key) c.logged.add(key);
    c.wrong++;
    logAttempt({ world: 1, level: c.i + 1, correct: false, optimal: false, score_xp: 0, mistake_tag: tag, hints_used: c.hints, learn_used: c.learn, time_s: PLAY.secs() });
    save();
  }

  function render() {
    const r = c.route, onSet = new Set(r.edges), vis = new Set(r.nodes), cps = c.L.checkpoints || [];
    const overlay = c.overlay || new Set();
    PLAY.draw(c.g, {
      name: nm,
      edgeCls: i => (onSet.has(i) ? 'on' : '') + (overlay.has(i) ? ' ovl' : ''),
      nodeCls: id => (id === 'G' ? 'start' : id === 'X' ? 'end' : '') + (vis.has(id) && id !== 'G' ? ' visited' : '') + (cps.includes(id) ? ' flag' : '') +
        (c.found ? (c.found.has(id) ? ' found' : ' dim') : '') + (c.hintNode === id ? ' hintn' : ''),
      tag: id => id === 'G' ? '▶' : id === 'X' ? '⛳' : cps.includes(id) ? '⚑' : '',
      ring: c.phase === 'play' ? r.end() : null, lorry: r.end(), marker: '🧭'
    });
    $('p-trail').textContent = r.nodes.map(nm).join(' → ');
    $('p-total').innerHTML = r.edges.length + '<small> ' + T(r.edges.length === 1 ? 'trail' : 'trails', 'denai') + '</small>';
    const play = c.phase === 'play';
    PLAY.controls([
      { id: 'w1-undo', label: T('Undo', 'Buat asal'), on: () => { r.undo(); c.found = null; PLAY.say(''); render(); }, disabled: !play || !r.edges.length },
      { id: 'w1-reset', label: T('Start again', 'Mula semula'), on: () => { r.reset(); c.found = null; PLAY.say(''); render(); }, disabled: !play || !r.edges.length },
      { id: 'w1-hint', label: T('Hint', 'Petunjuk'), on: hint, disabled: !play },
      { id: 'w1-learn', label: T('Learn', 'Belajar'), on: learn, disabled: !play },
      null,
      c.L.maps ? { id: 'w1-noway', label: T('No way out', 'Tiada jalan keluar'), on: noWay, disabled: !play, primary: true } : null
    ].filter((b, k, a) => b !== null || k < a.length - 1));
    if (c.L.maps) $('p-banner').innerHTML = '<div class="banner" style="background:var(--blue-soft);">' + T('Forest ', 'Hutan ') + (c.map + 1) + T(' of 3', ' daripada 3') + '</div>';
    renderAid();
    if (c.phase !== 'play') renderPanel();
  }

  /* ---------- taps ---------- */
  function onTap(t) {
    if (c.phase !== 'play') return;
    const r = c.route, res = t.node ? r.tapNode(t.node) : r.tapEdge(t.edge);
    const end = r.end();
    if (res.ok) {
      PLAY.say('');
      if (end === 'X') return render(), arrive();
      const open = c.g.edges.some(ed => PLAY.canGo(ed, end) && (c.L.allowRepeat || !r.nodes.includes(PLAY.other(ed, end))));
      render();
      if (!open) { PLAY.shake('p-n' + end); PLAY.say(T('Dead end — every trail from here goes back. Undo a trail.', 'Jalan mati — setiap denai dari sini berpatah balik. Buat asal satu denai.'), true); }
      return;
    }
    if (res.why === 'undo') { PLAY.say(''); return render(); }
    if (res.why === 'repeat') {
      PLAY.shake('p-n' + res.to);
      logWrong('repeated_vertex', 'repeat');
      return PLAY.say(T('A path never passes the same place twice — the ' + nm(res.to) + ' is already on your route.', 'Lorong tidak pernah melalui tempat yang sama dua kali — ' + nm(res.to) + ' sudah ada dalam laluan anda.'), true);
    }
    if (res.why === 'direction') {
      const i = t.edge != null ? t.edge : c.g.edges.findIndex(ed => PLAY.touches(ed, end) && PLAY.touches(ed, t.node));
      PLAY.shake('p-e' + i);
      logWrong('against_direction', 'dir' + i);
      return PLAY.say(T('That trail is one-way — follow the arrow.', 'Denai itu sehala — ikut anak panah.'), true);
    }
    if (res.why === 'not_here') { if (t.edge != null) PLAY.shake('p-e' + t.edge); return PLAY.say(T('That trail doesn’t start where you are (' + nm(end) + ').', 'Denai itu tidak bermula dari tempat anda (' + nm(end) + ').'), true); }
    if (res.why === 'no_edge') { PLAY.shake('p-n' + t.node); return PLAY.say(T('No trail joins ' + nm(end) + ' and ' + nm(t.node) + ' directly.', 'Tiada denai yang terus menghubungkan ' + nm(end) + ' dan ' + nm(t.node) + '.'), true); }
  }

  function arrive() {
    const cps = c.L.checkpoints || [], missing = cps.filter(x => !c.route.nodes.includes(x));
    if (missing.length) {
      logWrong('missed_checkpoint');
      return PLAY.say(T('You reached the Exit, but missed the ' + missing.map(nm).join(' and the ') + '. Undo and find a path through every flag.',
        'Anda sampai ke Pintu keluar, tetapi terlepas ' + missing.map(nm).join(' dan ') + '. Buat asal dan cari lorong yang melalui setiap bendera.'), true);
    }
    if (c.L.maps) return nextMap(T('Out! There was a way.', 'Keluar! Memang ada jalan.'));
    PLAY.say(T('You’re out!', 'Anda sudah keluar!'));
    solved();
  }

  function noWay() {
    if (c.phase !== 'play') return;
    const reachable = PLAY.reach(c.g, 'G');
    if (reachable.has('X')) {
      logWrong('said_no_way_but_connected');
      return PLAY.say(T('Look again — there is a way from the Gate to the Exit on this map.', 'Lihat semula — ada jalan dari Pintu masuk ke Pintu keluar pada peta ini.'), true);
    }
    c.found = reachable; render();
    nextMap(T('Right — from the Gate you can only reach the highlighted places. The Exit is in a separate piece.', 'Betul — dari Pintu masuk anda hanya boleh sampai ke tempat yang diserlahkan. Pintu keluar berada di bahagian lain.'));
  }

  function nextMap(msg) {
    if (c.map < 2) {
      PLAY.say(msg);
      $('p-panel').innerHTML = '<div class="note ok"><p style="margin:0 0 10px;color:var(--ink);">' + msg + '</p><button class="btn sm" id="w1-next">' + T('Next forest →', 'Hutan seterusnya →') + '</button></div>';
      c.phase = 'between';
      $('w1-next').addEventListener('click', () => {
        c.map++; c.g = c.L.maps[c.map]; c.route = new PLAY.Route(c.g, 'G', {}); c.found = null; c.overlay = null; c.hintNode = null; c.aid = null;
        c.phase = 'play'; $('p-panel').innerHTML = ''; PLAY.say(''); render();
      });
      return;
    }
    PLAY.say(msg);
    solved();
  }

  function solved() {
    c.phase = 'check'; c.time = PLAY.stopClock(); c.aid = null;
    render();
  }

  /* ---------- hint & learn ---------- */
  function solution() {
    // a simple path from the Gate to the Exit through any checkpoints (fixed maps are small)
    const cps = c.L.checkpoints || [];
    let best = null;
    const seen = new Set(['G']), nodes = ['G'], edges = [];
    (function dfs(u) {
      if (best) return;
      if (u === 'X') { if (cps.every(m => seen.has(m))) best = { nodes: nodes.slice(), edges: edges.slice() }; return; }
      c.g.edges.forEach((ed, i) => {
        if (best || !PLAY.canGo(ed, u)) return;
        const v = PLAY.other(ed, u);
        if (seen.has(v)) return;
        seen.add(v); nodes.push(v); edges.push(i); dfs(v); seen.delete(v); nodes.pop(); edges.pop();
      });
    })('G');
    return best;
  }

  function hint() {
    c.hints = 1; c.aid = 'hint';
    const sol = solution();
    if (sol) { const mid = sol.nodes.slice(1, -1); c.hintNode = mid[Math.floor(mid.length / 2)] || null; }
    render();
  }
  function learn() {
    c.learn = 1; c.aid = 'learn';
    const sol = solution();
    if (sol) c.overlay = new Set(sol.edges); else c.found = PLAY.reach(c.g, 'G');
    render();
  }

  function renderAid() {
    let html = '';
    if (c.phase === 'play' && c.aid === 'hint') {
      const sol = solution();
      const txt = !sol ? T('Start at the Gate and follow every trail you can. Which places can you reach? Is the Exit one of them?', 'Mula di Pintu masuk dan ikut setiap denai yang boleh. Tempat mana yang boleh dicapai? Adakah Pintu keluar salah satunya?')
        : c.L.checkpoints ? T('Order matters: try reaching the Bridge before the Waterfall. The dashed ring marks a place on a good path.', 'Susunan penting: cuba sampai ke Jambatan sebelum Air Terjun. Bulatan bertitik menandakan tempat pada lorong yang baik.')
          : c.route.g.edges.some(ed => ed.dir) ? T('Follow the arrows forward from the Gate. The dashed ring marks a place on the way out.', 'Ikut anak panah ke hadapan dari Pintu masuk. Bulatan bertitik menandakan tempat dalam perjalanan keluar.')
            : T('The dashed ring marks a place on a way out.', 'Bulatan bertitik menandakan tempat dalam jalan keluar.');
      html = '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
    }
    if (c.phase === 'play' && c.aid === 'learn') {
      const sol = solution();
      html = '<div class="note"><h3>' + T('Learn', 'Belajar') + ' <span class="pill alert">−10 XP</span></h3><p>' + (sol
        ? T('The dotted blue trail is one path out: ' + sol.nodes.map(nm).join(' → ') + '. It never repeats a place' + (c.L.checkpoints ? ' and passes every flag' : '') + '.',
          'Denai biru bertitik ialah satu lorong keluar: ' + sol.nodes.map(nm).join(' → ') + '. Ia tidak mengulangi tempat' + (c.L.checkpoints ? ' dan melalui setiap bendera' : '') + '.')
        : T('The highlighted places are everything you can reach from the Gate. The Exit isn’t among them, so no path joins them — this forest is not connected.', 'Tempat yang diserlahkan ialah semua yang boleh dicapai dari Pintu masuk. Pintu keluar bukan salah satunya, jadi tiada lorong yang menghubungkannya — hutan ini tidak tersambung.')) + '</p></div>';
    }
    $('p-aid').innerHTML = html;
  }

  /* ---------- quick check → XP ---------- */
  function renderPanel() {
    const head = '<div class="note ok"><h3>' + T('Level cleared!', 'Tahap selesai!') + '</h3><p>' +
      (c.wrong ? T(c.wrong + ' slip' + (c.wrong > 1 ? 's' : '') + ' on the way — mistakes cost nothing here.', c.wrong + ' kesilapan dalam perjalanan — kesilapan tidak merugikan di sini.') : T('Clean run — no slips.', 'Larian bersih — tiada kesilapan.')) + '</p></div>';
    if (c.phase === 'check') {
      const q = c.L.qc;
      return PLAY.quick(head, { q: tt(q.q), answer: q.answer, why: tt(q.why), opts: q.opts.map(o => [o[0], Array.isArray(o[1]) ? tt(o[1]) : o[1]]) }, ok => {
        c.xp = finishLevel(1, c.i, PLAY.parts(T('Found the way', 'Jumpa jalan'), ok, c.hints, c.learn, c.time, c.L.target), c.time, c.hints, c.learn);
        giveBadges(['first_connection']);
        c.phase = 'xp'; renderPanel();
      });
    }
    if (c.phase === 'xp') PLAY.xp(head, 1, c.i, c.xp);
  }

  /* ---------- Discover ---------- */
  function renderDiscover() {
    PLAY.discover({
      w: 1,
      opts: [
        ['a', T('There is no way out when the Gate and the Exit are in separate pieces — no path joins them.', 'Tiada jalan keluar apabila Pintu masuk dan Pintu keluar berada di bahagian berasingan — tiada lorong yang menghubungkannya.')],
        ['b', T('There is no way out when the forest has a place with only one trail.', 'Tiada jalan keluar apabila hutan ada tempat dengan satu denai sahaja.')],
        ['c', T('There is no way out when a route has to pass a place twice.', 'Tiada jalan keluar apabila laluan terpaksa melalui tempat dua kali.')]
      ],
      answer: 'a',
      why: p => p === 'a' ? T('Exactly. Whether a way exists depends only on whether the two places are joined at all.', 'Tepat sekali. Sama ada jalan wujud hanya bergantung pada sama ada dua tempat itu bersambung.')
        : p === 'b' ? T('Remember Level 2: the Waterfall and the Pond had only one trail each, and there was still a way out.', 'Ingat Tahap 2: Air Terjun dan Kolam hanya ada satu denai, dan masih ada jalan keluar.')
          : T('Remember Level 1: a route that repeats a place can always be shortened into one that doesn’t.', 'Ingat Tahap 1: laluan yang mengulangi tempat sentiasa boleh dipendekkan kepada yang tidak mengulang.'),
      terms: [
        ['Walk', 'Jalan', 'A route along edges. Vertices and edges may repeat.', 'Laluan sepanjang sisi. Bucu dan sisi boleh berulang.'],
        ['Path', 'Lorong', 'A walk that never repeats a vertex.', 'Jalan yang tidak pernah mengulangi bucu.'],
        ['Connected graph', 'Graf tersambung', 'A graph where a path joins every pair of vertices.', 'Graf yang mempunyai lorong antara setiap pasangan bucu.'],
        ['Directed graph', 'Graf terarah', 'A graph whose edges each have a direction.', 'Graf yang setiap sisinya mempunyai arah.']
      ]
    });
  }

  const api = { levels: LEVELS, start, render: () => c && render(), renderDiscover, _: { checkLevels } };
  root.W1 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
