/**
 * GRAPH QUEST — World 5 (bonus), Euler Escape
 * ------------------------------------------------------------------
 * "You are trapped in the city. Cross every bridge exactly once to escape."
 * Before each city the student predicts: can it be done? The prediction
 * earns the reasoning XP (and the Euler Explorer badge after 5 right).
 *   L1  an easy escape (start anywhere)
 *   L2  must start at a given place
 *   L3  an impossible city — prove it by tapping the places with an odd
 *       number of bridges
 *   L4  return home: an Euler circuit
 *   L5  a generated city, possible or not
 * Discover: 0 or 2 odd places → escape possible; more → impossible.
 */
(function (root) {
  'use strict';

  const PLACES = {
    A: ['Market', 'Pasar'], B: ['Mosque', 'Masjid'], C: ['Museum', 'Muzium'], D: ['Station', 'Stesen'], E: ['Jetty', 'Jeti'],
    F: ['Island', 'Pulau'], G: ['Park', 'Taman'], H: ['Tower', 'Menara'], J: ['Library', 'Perpustakaan'], K: ['Palace', 'Istana'],
    M: ['Clock tower', 'Menara jam'], P: ['Pier', 'Pangkalan']
  };
  const nm = id => tt(PLACES[id]);
  const n = (id, x, y) => ({ id, x, y });
  const e = (a, b) => ({ a, b });

  const LEVELS = [
    {
      title: ['Easy escape', 'Lolos mudah'], target: 60,
      story: ['You are trapped in the city. To escape, cross <b class="ink">every bridge exactly once</b>. Start anywhere: tap a place, then tap bridges.',
        'Anda terperangkap di bandar. Untuk lolos, lintasi <b class="ink">setiap jambatan tepat sekali</b>. Mula di mana-mana: ketik satu tempat, kemudian ketik jambatan.'],
      g: { nodes: [n('A', 200, 330), n('B', 440, 330), n('C', 200, 160), n('D', 440, 160), n('E', 320, 50)],
        edges: [e('A', 'B'), e('B', 'D'), e('D', 'C'), e('C', 'A'), e('C', 'E'), e('E', 'D'), e('A', 'D')] }
    },
    {
      title: ['Start at the Tower', 'Mula di Menara'], target: 75, start: 'H',
      story: ['This time the escape must begin at the <b class="ink">Tower</b>.', 'Kali ini lolos mesti bermula di <b class="ink">Menara</b>.'],
      g: { nodes: [n('E', 80, 200), n('A', 220, 80), n('B', 220, 320), n('H', 380, 80), n('D', 380, 320), n('K', 540, 200)],
        edges: [e('E', 'A'), e('E', 'B'), e('A', 'H'), e('B', 'D'), e('H', 'D'), e('H', 'K'), e('D', 'K')] }
    },
    {
      title: ['The impossible city', 'Bandar mustahil'], target: 90, impossible: true,
      story: ['Some say no one has ever escaped this city. Try — and if it truly can’t be done, press <b class="ink">It can’t be done</b> and prove it.',
        'Kata orang tiada siapa pernah lolos dari bandar ini. Cuba — dan jika memang mustahil, tekan <b class="ink">Mustahil</b> dan buktikan.'],
      g: { nodes: [n('A', 90, 200), n('B', 250, 70), n('C', 250, 330), n('D', 420, 200), n('E', 580, 200)],
        edges: [e('A', 'B'), e('A', 'C'), e('B', 'C'), e('B', 'D'), e('C', 'D'), e('D', 'E')] }
    },
    {
      title: ['Return home', 'Pulang ke rumah'], target: 90, start: 'G', circuit: true,
      story: ['Start at the <b class="ink">Park</b>, cross every bridge exactly once, and end back at the Park.',
        'Mula di <b class="ink">Taman</b>, lintasi setiap jambatan tepat sekali, dan kembali ke Taman.'],
      g: { nodes: [n('A', 120, 90), n('E', 320, 40), n('C', 520, 90), n('G', 320, 200), n('B', 120, 310), n('F', 320, 360), n('D', 520, 310)],
        edges: [e('A', 'E'), e('E', 'C'), e('C', 'G'), e('G', 'A'), e('B', 'G'), e('G', 'D'), e('D', 'F'), e('F', 'B')] }
    },
    {
      title: ['Random city', 'Bandar rawak'], target: 120, random: true,
      story: ['A new city every time. Predict first, then escape — or prove it can’t be done.', 'Bandar baharu setiap kali. Ramal dahulu, kemudian lolos — atau buktikan ia mustahil.']
    }
  ];

  const deg = (g, v) => g.edges.reduce((d, x) => d + (x.a === v) + (x.b === v), 0);
  const odds = g => g.nodes.map(v => v.id).filter(v => deg(g, v) % 2 === 1);
  const possible = g => odds(g).length === 0 || odds(g).length === 2;   // every map here is connected

  /** An Euler trail from start (Hierholzer). Returns edge ids in order, or null. */
  function eulerTrail(g, start) {
    const used = new Set(), stack = [{ v: start, via: null }], out = [];
    while (stack.length) {
      const top = stack[stack.length - 1];
      const i = g.edges.findIndex((x, k) => !used.has(k) && (x.a === top.v || x.b === top.v));
      if (i < 0) { stack.pop(); if (top.via != null) out.push(top.via); continue; }
      used.add(i);
      stack.push({ v: g.edges[i].a === top.v ? g.edges[i].b : g.edges[i].a, via: i });
    }
    if (out.length !== g.edges.length) return null;
    out.reverse();
    // walk it: each edge must start where the last one ended
    let at = start;
    for (const i of out) { const x = g.edges[i]; if (x.a === at) at = x.b; else if (x.b === at) at = x.a; else return null; }
    return out;
  }

  function checkLevels() {
    const out = [];
    LEVELS.forEach((L, i) => {
      if (!L.g) return;
      if (!PLAY.connectedAll(L.g, new Set(L.g.edges.map((_, k) => k)))) out.push('L' + (i + 1) + ' not connected');
      if (!!L.impossible === possible(L.g)) out.push('L' + (i + 1) + ' possibility wrong (' + odds(L.g).length + ' odd)');
      if (L.start && !eulerTrail(L.g, L.start)) out.push('L' + (i + 1) + ' no trail from start');
      if (L.circuit && odds(L.g).length) out.push('L4 not a circuit');
    });
    return out;
  }

  const POOL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M', 'P'];
  function randomCity() {
    const wantImpossible = Math.random() < 0.4;
    for (let t = 0; t < 200; t++) {
      const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, R = E.rng(seed);
      const base = E.generate(seed, { n: 6 });
      const keys = shuffled(POOL, R).slice(0, 6), map = {};
      base.nodes.forEach((v, i) => { map[v.id] = keys[i]; });
      const g = { nodes: base.nodes.map(v => ({ id: map[v.id], x: v.x, y: v.y })), edges: base.edges.map(x => ({ a: map[x.a], b: map[x.b] })) };
      const o = odds(g).length;
      if (wantImpossible ? o === 4 : (o === 0 || o === 2)) return g;
    }
    return LEVELS[0].g;
  }

  /* ============================================================
     Play
     ============================================================ */
  let c = null;

  function start(i) {
    const L = LEVELS[i], g = L.random ? randomCity() : L.g;
    c = { i, L, g, can: possible(g), phase: 'predict', predicted: null, nodes: [], edges: [], hints: 0, learn: 0, wrong: 0,
      logged: new Set(), proof: new Set(), proving: false, aid: null };
    if (L.start) c.nodes = [L.start];
    PLAY.open({ world: 5, i, levels: LEVELS, title: L.title, story: L.story, target: L.target, onTap, render,
      terms: i === 0 ? [['bridge = edge', 'jambatan = sisi']] : null });
    render();
  }

  function logWrong(tag, key) {
    if (key && c.logged.has(key)) return;
    if (key) c.logged.add(key);
    c.wrong++;
    logAttempt({ world: 5, level: c.i + 1, correct: false, optimal: false, score_xp: 0, mistake_tag: tag, hints_used: c.hints, learn_used: c.learn, time_s: PLAY.secs() });
    save();
  }

  const end = () => c.nodes[c.nodes.length - 1];
  const oddSet = () => new Set(odds(c.g));

  function render() {
    const used = new Set(c.edges), order = {};
    c.edges.forEach((x, k) => { order[x] = k + 1; });
    const showDeg = c.learn || c.proving, odd = oddSet(), learnTrail = c.learnTrail || [];
    PLAY.draw(c.g, {
      name: nm,
      edgeCls: i => (used.has(i) ? 'used' : '') + (c.hl && c.hl.has(i) ? ' hl' : ''),
      label: i => used.has(i) ? String(order[i]) : (learnTrail.length ? String(learnTrail.indexOf(i) + 1) : null),
      nodeCls: id => (c.nodes[0] === id ? 'start' : '') + (c.proof.has(id) ? ' found' : '') + (showDeg && odd.has(id) && c.learn ? ' flag' : '') + (c.hintSet && c.hintSet.has(id) ? ' hintn' : ''),
      tag: id => showDeg && c.learn ? String(deg(c.g, id)) : (c.nodes[0] === id ? '▶' : ''),
      ring: c.phase === 'play' && c.nodes.length ? end() : null, lorry: c.nodes.length ? end() : null, marker: '🏃'
    });
    $('p-trail').textContent = c.nodes.map(nm).join(' → ');
    $('p-total').innerHTML = c.edges.length + ' / ' + c.g.edges.length + '<small> ' + T('bridges', 'jambatan') + '</small>';
    renderAsk();
    const play = c.phase === 'play';
    PLAY.controls(c.phase === 'predict' ? [] : [
      { id: 'w5-undo', label: T('Undo', 'Buat asal'), on: undo, disabled: !play || !c.edges.length },
      { id: 'w5-reset', label: T('Start again', 'Mula semula'), on: reset, disabled: !play || !c.edges.length },
      { id: 'w5-hint', label: T('Hint', 'Petunjuk'), on: hint, disabled: !play },
      { id: 'w5-learn', label: T('Learn', 'Belajar'), on: learn, disabled: !play },
      null,
      { id: 'w5-cant', label: T('It can’t be done', 'Mustahil'), on: cant, disabled: !play || c.proving, primary: true }
    ]);
    renderAid();
    if (c.phase === 'check' || c.phase === 'xp') renderPanel();
  }

  function renderAsk() {
    if (c.phase === 'predict') {
      const q = c.L.circuit ? T('Can you cross every bridge exactly once and end back where you started?', 'Bolehkah anda melintasi setiap jambatan tepat sekali dan kembali ke tempat mula?')
        : c.L.start ? T('Starting at the ' + nm(c.L.start) + ', can you cross every bridge exactly once?', 'Bermula di ' + nm(c.L.start) + ', bolehkah anda melintasi setiap jambatan tepat sekali?')
          : T('Can this city be escaped — every bridge crossed exactly once?', 'Bolehkah anda lolos dari bandar ini — setiap jambatan dilintasi tepat sekali?');
      $('p-ask').innerHTML = '<div class="note ask"><h3>' + T('Predict first', 'Ramal dahulu') + ' <span class="pill new">+20 XP</span></h3><p>' + q + '</p>' +
        '<div class="row"><button class="btn" data-pred="yes">' + T('Yes, it can', 'Ya, boleh') + '</button><button class="btn ghost" data-pred="no">' + T('No, it can’t', 'Tidak boleh') + '</button></div></div>';
      $('p-ask').querySelectorAll('[data-pred]').forEach(b => b.addEventListener('click', () => predict(b.dataset.pred === 'yes')));
      return;
    }
    if (c.proving) {
      $('p-ask').innerHTML = '<div class="note ask"><h3>' + T('Prove it', 'Buktikan') + '</h3><p style="margin:0;">' +
        T('Tap every place where an <b>odd</b> number of bridges meet. Each is a place you would get stuck at — or have to start from.', 'Ketik setiap tempat yang mempunyai bilangan jambatan <b>ganjil</b>. Setiap satu ialah tempat anda akan tersekat — atau terpaksa bermula.') +
        ' (' + c.proof.size + ' / ' + odds(c.g).length + ')</p></div>';
      return;
    }
    $('p-ask').innerHTML = c.predicted == null ? '' : '<p class="muted" style="margin:8px 2px 0;">' + T('Your prediction: ', 'Ramalan anda: ') + '<b class="ink">' + (c.predicted ? T('it can be done', 'boleh') : T('it can’t be done', 'mustahil')) + '</b></p>';
  }

  function predict(yes) {
    c.predicted = yes; c.predRight = yes === c.can;
    if (c.predRight) st.eulerPredict = (st.eulerPredict || 0) + 1;
    else logWrong('wrong_prediction');
    save();
    c.phase = 'play';
    PLAY.say(c.L.start ? T('You start at the ' + nm(c.L.start) + '. Tap a bridge.', 'Anda bermula di ' + nm(c.L.start) + '. Ketik jambatan.') : T('Tap the place you want to start from.', 'Ketik tempat anda mahu bermula.'));
    render();
  }

  /* ---------- crossing bridges ---------- */
  function onTap(t) {
    if (c.phase !== 'play') return;
    if (c.proving) return proofTap(t);
    if (!c.nodes.length) {
      if (!t.node) return PLAY.say(T('First tap a place to start from.', 'Ketik tempat untuk bermula dahulu.'), true);
      c.nodes = [t.node]; PLAY.say(''); return render();
    }
    const at = end();
    let i = t.edge;
    if (t.node != null) {
      if (t.node === at) return;
      i = c.g.edges.findIndex((x, k) => !c.edges.includes(k) && ((x.a === at && x.b === t.node) || (x.b === at && x.a === t.node)));
      if (i < 0) {
        const usedOne = c.g.edges.findIndex(x => (x.a === at && x.b === t.node) || (x.b === at && x.a === t.node));
        if (usedOne >= 0) { PLAY.shake('p-e' + usedOne); return PLAY.say(T('You’ve already crossed that bridge — each bridge only once.', 'Anda sudah melintasi jambatan itu — setiap jambatan sekali sahaja.'), true); }
        PLAY.shake('p-n' + t.node); return PLAY.say(T('No bridge joins ' + nm(at) + ' and ' + nm(t.node) + '.', 'Tiada jambatan antara ' + nm(at) + ' dan ' + nm(t.node) + '.'), true);
      }
    }
    const x = c.g.edges[i];
    if (c.edges.length && c.edges[c.edges.length - 1] === i) return undo();
    if (c.edges.includes(i)) { PLAY.shake('p-e' + i); return PLAY.say(T('You’ve already crossed that bridge — each bridge only once.', 'Anda sudah melintasi jambatan itu — setiap jambatan sekali sahaja.'), true); }
    if (x.a !== at && x.b !== at) { PLAY.shake('p-e' + i); return PLAY.say(T('That bridge doesn’t start at the ' + nm(at) + ', where you are.', 'Jambatan itu tidak bermula di ' + nm(at) + ', tempat anda berada.'), true); }
    c.edges.push(i); c.nodes.push(x.a === at ? x.b : x.a);
    PLAY.say('');
    render();
    after();
  }

  function after() {
    const at = end();
    if (c.edges.length === c.g.edges.length) {
      if (c.L.circuit && at !== c.nodes[0]) return PLAY.say(T('Every bridge crossed — but you ended at the ' + nm(at) + ', not home.', 'Semua jambatan dilintasi — tetapi anda berakhir di ' + nm(at) + ', bukan di rumah.'), true);
      return solved(T('Escaped! Every bridge crossed exactly once.', 'Lolos! Setiap jambatan dilintasi tepat sekali.'));
    }
    const moves = c.g.edges.some((x, k) => !c.edges.includes(k) && (x.a === at || x.b === at));
    if (!moves) {
      logWrong('stuck_trail', 'stuck');
      PLAY.shake('p-n' + at);
      PLAY.say(T('Stuck at the ' + nm(at) + ' with ' + (c.g.edges.length - c.edges.length) + ' bridges left. Undo, or start again somewhere else.',
        'Tersekat di ' + nm(at) + ' dengan ' + (c.g.edges.length - c.edges.length) + ' jambatan lagi. Buat asal, atau mula semula di tempat lain.'), true);
    }
  }

  function undo() {
    if (c.edges.length) { c.edges.pop(); c.nodes.pop(); }
    else if (!c.L.start) c.nodes = [];
    PLAY.say(''); render();
  }
  function reset() { c.edges = []; c.nodes = c.L.start ? [c.L.start] : []; PLAY.say(''); render(); }

  function cant() {
    if (c.can) {
      logWrong('said_impossible_but_possible');
      return PLAY.say(T('It can be done here — keep trying. Where you start matters.', 'Ia boleh dilakukan di sini — teruskan mencuba. Tempat mula penting.'), true);
    }
    c.proving = true; c.edges = []; c.nodes = [];
    PLAY.say(T('Right, it can’t be done. Now prove it.', 'Betul, ia mustahil. Sekarang buktikan.'));
    render();
  }

  function proofTap(t) {
    if (!t.node) return;
    const odd = oddSet(), d = deg(c.g, t.node);
    if (!odd.has(t.node)) {
      PLAY.shake('p-n' + t.node); logWrong('wrong_odd_tap', 'odd' + t.node);
      return PLAY.say(T('The ' + nm(t.node) + ' has ' + d + ' bridges — an even number.', nm(t.node) + ' ada ' + d + ' jambatan — nombor genap.'), true);
    }
    c.proof.add(t.node); render();
    if (c.proof.size === odd.size) solved(T(odd.size + ' places have an odd number of bridges. You arrive and leave in pairs, so only the start and the end can be odd — more than two means no escape.',
      odd.size + ' tempat mempunyai bilangan jambatan ganjil. Anda tiba dan pergi secara berpasangan, jadi hanya tempat mula dan tamat boleh ganjil — lebih daripada dua bermakna tiada jalan lolos.'));
    else PLAY.say(T('Yes — ' + d + ' bridges. Keep going.', 'Ya — ' + d + ' jambatan. Teruskan.'));
  }

  function solved(msg) {
    PLAY.say(msg);
    c.phase = 'check'; c.time = PLAY.stopClock(); c.aid = null; c.msg = msg;
    render();
  }

  /* ---------- hint & learn ---------- */
  function hint() {
    c.hints = 1; c.aid = 'hint';
    const o = odds(c.g);
    c.hintSet = new Set(o.length === 2 && !c.L.start ? o : []);
    render();
  }
  function learn() {
    c.learn = 1; c.aid = 'learn';
    const o = odds(c.g), s = c.L.start || (o.length ? o[0] : c.g.nodes[0].id);
    c.learnTrail = c.can ? (eulerTrail(c.g, s) || []) : [];
    render();
  }

  function renderAid() {
    if (c.phase !== 'play' || !c.aid) { $('p-aid').innerHTML = ''; return; }
    const o = odds(c.g);
    let txt;
    if (c.aid === 'hint') {
      txt = !c.can ? T('Count the bridges at each place. What happens every time you walk through a place in the middle of your route?', 'Kira jambatan di setiap tempat. Apa berlaku setiap kali anda melalui satu tempat di tengah laluan?')
        : o.length === 2 && !c.L.start ? T('Start at one of the two places with a dashed ring.', 'Mula di salah satu daripada dua tempat berbulatan bertitik.')
          : T('Don’t cross a bridge that would cut you off from bridges you haven’t crossed yet.', 'Jangan lintasi jambatan yang akan memisahkan anda daripada jambatan yang belum dilintasi.');
      $('p-aid').innerHTML = '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
      return;
    }
    txt = T('Each place now shows how many bridges meet there. <b class="ink">' + o.length + '</b> of them are odd (yellow). ', 'Setiap tempat kini menunjukkan bilangan jambatannya. <b class="ink">' + o.length + '</b> daripadanya ganjil (kuning). ') +
      (c.can ? T('The numbers on the bridges show one order that works.', 'Nombor pada jambatan menunjukkan satu susunan yang berjaya.') : T('With more than two odd places, there is no way to cross every bridge once.', 'Dengan lebih daripada dua tempat ganjil, tiada cara untuk melintasi setiap jambatan sekali.'));
    $('p-aid').innerHTML = '<div class="note"><h3>' + T('Learn', 'Belajar') + ' <span class="pill alert">−10 XP</span></h3><p>' + txt + '</p></div>';
  }

  /* ---------- XP (the prediction is the reasoning part) ---------- */
  function renderPanel() {
    const head = '<div class="note ok"><h3>' + (c.can ? T('Escaped!', 'Lolos!') : T('Proved!', 'Terbukti!')) + '</h3><p>' + c.msg + '</p></div>';
    if (c.phase === 'check') {
      const parts = PLAY.parts(c.can ? T('Escaped', 'Lolos') : T('Proved impossible', 'Dibuktikan mustahil'), c.predRight, c.hints, c.learn, c.time, c.L.target);
      parts[1][1] = T('Right prediction', 'Ramalan betul');
      c.xp = finishLevel(5, c.i, parts, c.time, c.hints, c.learn);
      giveBadges((st.eulerPredict || 0) >= 5 ? ['first_connection', 'euler_explorer'] : ['first_connection']);
      c.phase = 'xp';
    }
    PLAY.xp(head, 5, c.i, c.xp);
  }

  function renderDiscover() {
    PLAY.discover({
      w: 5,
      opts: [
        ['a', T('Count the places with an odd number of bridges: 0 or 2 means you can escape; more than 2 means you can’t.', 'Kira tempat dengan bilangan jambatan ganjil: 0 atau 2 bermakna boleh lolos; lebih daripada 2 bermakna tidak boleh.')],
        ['b', T('You can escape if every place has at least two bridges.', 'Anda boleh lolos jika setiap tempat ada sekurang-kurangnya dua jambatan.')],
        ['c', T('You can escape if the total number of bridges is even.', 'Anda boleh lolos jika jumlah jambatan genap.')]
      ],
      answer: 'a',
      why: p => p === 'a' ? T('Exactly. In the middle of a route you arrive and leave — two bridges each time. Only the start and the end can be odd.', 'Tepat sekali. Di tengah laluan anda tiba dan pergi — dua jambatan setiap kali. Hanya tempat mula dan tamat boleh ganjil.')
        : p === 'b' ? T('The impossible city had at least two bridges at almost every place and still couldn’t be escaped.', 'Bandar mustahil ada sekurang-kurangnya dua jambatan hampir di setiap tempat dan tetap tidak boleh dilolosi.')
          : T('The impossible city had 6 bridges — an even number — and still couldn’t be escaped.', 'Bandar mustahil ada 6 jambatan — nombor genap — dan tetap tidak boleh dilolosi.'),
      terms: [
        ['Euler trail', 'Surih Euler', 'A trail that uses every edge of a graph exactly once.', 'Surih yang menggunakan setiap sisi graf tepat sekali.'],
        ['Euler circuit', 'Litar Euler', 'An Euler trail that ends where it started. Possible when every vertex has even degree.', 'Surih Euler yang berakhir di tempat ia bermula. Boleh apabila setiap bucu berdarjah genap.'],
        ['Odd vertex', 'Bucu ganjil', 'A vertex with odd degree. An Euler trail exists only with 0 or 2 of them (in a connected graph).', 'Bucu berdarjah ganjil. Surih Euler wujud hanya jika ada 0 atau 2 daripadanya (dalam graf tersambung).']
      ]
    });
  }

  const api = { levels: LEVELS, start, render: () => c && render(), renderDiscover, _: { checkLevels, randomCity, eulerTrail, odds } };
  root.W5 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
