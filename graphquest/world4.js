/**
 * GRAPH QUEST — World 4, Build the Network (trees and minimum total weight)
 * ------------------------------------------------------------------
 * A telco engineer lays fibre cable between kampung. Every cable costs RM.
 *   L1  connect everything
 *   L2  connect with no cycle
 *   L3  stay within a budget
 *   L4  the lowest possible cost (the tree with minimum total weight)
 *   L5  a generated map, same goal
 * Discover: n places joined with no cycle always take n − 1 cables → tree.
 *
 * "Cycle" (kitaran) here, not "loop": World 2 uses loop (gelung) for an
 * edge from a vertex to itself. Every fixed map has one cheapest network;
 * checkLevels() confirms it.
 */
(function (root) {
  'use strict';

  const PLACES = {
    Z: ['Exchange', 'Pusat Telco'], A: ['Kg. Batu', 'Kg. Batu'], B: ['Kg. Paya', 'Kg. Paya'], C: ['Kg. Durian', 'Kg. Durian'],
    D: ['Kg. Sungai', 'Kg. Sungai'], E: ['Kg. Bukit', 'Kg. Bukit'], F: ['Kg. Tengah', 'Kg. Tengah'], G: ['Kg. Pulau', 'Kg. Pulau'],
    H: ['Kg. Hilir', 'Kg. Hilir'], J: ['Kg. Baru', 'Kg. Baru'], K: ['Kg. Lalang', 'Kg. Lalang'], M: ['Kg. Melati', 'Kg. Melati']
  };
  const nm = id => tt(PLACES[id]);
  const n = (id, x, y) => ({ id, x, y });
  const e = (a, b, w) => ({ a, b, w });
  const rm = w => 'RM' + w + 'k';

  const LEVELS = [
    {
      title: ['Connect every kampung', 'Sambung setiap kampung'], target: 60, goal: 'connect',
      story: ['You are a telco engineer bringing fibre internet to four kampung. Tap a cable route — or tap two places — to lay a cable. Every place must be connected to the <b class="ink">Exchange</b>.',
        'Anda jurutera telco yang membawa internet gentian optik ke empat kampung. Ketik laluan kabel — atau ketik dua tempat — untuk memasang kabel. Setiap tempat mesti bersambung dengan <b class="ink">Pusat Telco</b>.'],
      g: { nodes: [n('Z', 90, 200), n('A', 250, 80), n('B', 250, 320), n('C', 430, 90), n('D', 430, 310)],
        edges: [e('Z', 'A', 4), e('Z', 'B', 6), e('A', 'B', 3), e('A', 'C', 5), e('B', 'D', 2), e('C', 'D', 7), e('A', 'D', 8)] }
    },
    {
      title: ['No wasted cable', 'Tiada kabel membazir'], target: 75, goal: 'tree',
      story: ['A cable that closes a <b class="ink">cycle</b> — a closed ring of cables — is never needed: everyone is already connected without it. Connect every place with no cycles.',
        'Kabel yang menutup satu <b class="ink">kitaran</b> — gelang kabel yang tertutup — tidak pernah diperlukan: semua sudah bersambung tanpanya. Sambung setiap tempat tanpa kitaran.'],
      terms: [['cycle', 'kitaran']],
      g: { nodes: [n('Z', 80, 210), n('A', 220, 80), n('B', 220, 330), n('C', 380, 200), n('D', 530, 80), n('E', 540, 320)],
        edges: [e('Z', 'A', 5), e('Z', 'B', 4), e('A', 'B', 6), e('A', 'C', 3), e('B', 'C', 7), e('A', 'D', 9), e('C', 'D', 2), e('C', 'E', 8), e('D', 'E', 10), e('B', 'E', 11)] },
      qc: {
        q: ['Six places are all connected, with no cycles. How many cables does that take?', 'Enam tempat semuanya bersambung, tanpa kitaran. Berapa banyak kabel diperlukan?'],
        opts: [['a', '5'], ['b', '6'], ['c', '7']], answer: 'a',
        why: ['each cable brings exactly one new place into the network. Start from one place, add five more — five cables.', 'setiap kabel membawa tepat satu tempat baharu ke dalam rangkaian. Mula dengan satu tempat, tambah lima lagi — lima kabel.']
      }
    },
    {
      title: ['On a budget', 'Dalam bajet'], target: 90, goal: 'budget', over: 3,
      story: ['The district council gives you a budget. Connect every place, no cycles, and stay within it.',
        'Majlis daerah memberi anda bajet. Sambung setiap tempat, tanpa kitaran, dan jangan melebihi bajet.'],
      g: { nodes: [n('Z', 70, 200), n('A', 200, 80), n('B', 200, 320), n('C', 340, 200), n('D', 470, 70), n('E', 480, 330), n('F', 600, 200)],
        edges: [e('Z', 'A', 6), e('Z', 'B', 3), e('A', 'B', 8), e('A', 'C', 5), e('B', 'C', 4), e('A', 'D', 11), e('C', 'D', 7), e('C', 'E', 9), e('B', 'E', 12), e('D', 'F', 10), e('E', 'F', 2), e('D', 'E', 13)] },
      qc: {
        q: ['Your network connects everyone with no cycles. Adding one more cable would…', 'Rangkaian anda menyambung semua tanpa kitaran. Menambah satu lagi kabel akan…'],
        opts: [['a', ['create a cycle', 'mewujudkan kitaran']], ['b', ['connect a place that was cut off', 'menyambung tempat yang terputus']], ['c', ['change nothing', 'tidak mengubah apa-apa']]], answer: 'a',
        why: ['its two ends are already joined through the network, so the new cable closes a ring. That is exactly what makes a tree: connected, and one cable fewer would split it; one more makes a cycle.', 'kedua-dua hujungnya sudah bersambung melalui rangkaian, jadi kabel baharu menutup satu gelang. Itulah pokok: tersambung, kurang satu kabel akan memutuskannya; lebih satu mewujudkan kitaran.']
      }
    },
    {
      title: ['Cheapest possible', 'Paling murah'], target: 120, goal: 'min',
      story: ['The contract goes to the cheapest network. Connect every kampung for the lowest possible total cost.',
        'Kontrak diberi kepada rangkaian paling murah. Sambung setiap kampung dengan jumlah kos paling rendah.'],
      g: { nodes: [n('Z', 80, 330), n('A', 90, 110), n('B', 250, 200), n('C', 260, 50), n('D', 420, 110), n('E', 420, 330), n('F', 580, 210)],
        edges: [e('Z', 'A', 9), e('Z', 'B', 4), e('Z', 'E', 12), e('A', 'B', 6), e('A', 'C', 7), e('B', 'C', 10), e('B', 'D', 3), e('B', 'E', 5), e('C', 'D', 8), e('D', 'E', 11), e('D', 'F', 2), e('E', 'F', 13)] },
      qc: {
        q: ['Engineers usually lay the cheapest cable first. Why does that work?', 'Jurutera biasanya memasang kabel paling murah dahulu. Kenapa cara ini berkesan?'],
        opts: [['a', ['Cheap cables keep the total low — as long as each one doesn’t close a cycle', 'Kabel murah mengekalkan jumlah rendah — asalkan setiap satu tidak menutup kitaran']], ['b', ['The cheapest cable always reaches the Exchange', 'Kabel paling murah sentiasa sampai ke Pusat Telco']], ['c', ['Cheap cables connect the most places', 'Kabel murah menyambung paling banyak tempat']]], answer: 'a',
        why: ['take cables from cheapest up, skipping any that would close a cycle, and you always end with the cheapest network. That method is called Kruskal’s algorithm.', 'ambil kabel dari yang paling murah, langkau yang akan menutup kitaran, dan anda sentiasa mendapat rangkaian paling murah. Kaedah ini dipanggil algoritma Kruskal.']
      }
    },
    {
      title: ['Random challenge', 'Cabaran rawak'], target: 120, goal: 'min', random: true,
      story: ['A new district every time. Cheapest network wins.', 'Daerah baharu setiap kali. Rangkaian paling murah menang.']
    }
  ];

  const POOL = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'M'];

  function checkLevels() {
    const out = [];
    LEVELS.forEach((L, i) => {
      if (!L.g) return;
      if (!PLAY.connectedAll(L.g, new Set(L.g.edges.map((_, j) => j)))) out.push('L' + (i + 1) + ' not connected');
      if (L.goal !== 'connect' && !PLAY.mstUnique(L.g)) out.push('L' + (i + 1) + ' cheapest network not unique');
    });
    return out;
  }

  function randomMap() {
    for (let t = 0; t < 80; t++) {
      const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0, R = E.rng(seed);
      const base = E.generate(seed, { n: 7 });
      const keys = ['Z'].concat(shuffled(POOL, R).slice(0, 6)), map = {};
      base.nodes.forEach((v, i) => { map[v.id] = keys[i]; });
      const g = { nodes: base.nodes.map(v => ({ id: map[v.id], x: v.x, y: v.y })), edges: base.edges.map(x => ({ a: map[x.a], b: map[x.b], w: x.w })) };
      if (PLAY.mstUnique(g) && g.edges.length > g.nodes.length) return g;
    }
    throw new Error('Could not build a district.');
  }

  /* ============================================================
     Play
     ============================================================ */
  let c = null;

  function start(i) {
    const L = LEVELS[i], g = L.random ? randomMap() : L.g;
    const k = PLAY.kruskal(g);
    c = { i, L, g, laid: new Set(), pick: null, mst: k, budget: L.over ? k.total + L.over : null, hints: 0, learn: 0, wrong: 0, phase: 'play', aid: null };
    PLAY.open({ world: 4, i, levels: LEVELS, title: L.title, story: L.story, terms: L.terms, target: L.target, onTap, render });
    render();
  }

  function logWrong(tag, score) {
    c.wrong++;
    logAttempt({ world: 4, level: c.i + 1, correct: score > 0, optimal: false, score_xp: score || 0, mistake_tag: tag, hints_used: c.hints, learn_used: c.learn, time_s: PLAY.secs() });
    if (score) st.best['4-' + (c.i + 1)] = Math.max(st.best['4-' + (c.i + 1)] || 0, score);
    save();
  }

  function state() {
    const conn = PLAY.connectedAll(c.g, c.laid), cyc = PLAY.loopEdges(c.g, c.laid), cost = PLAY.cost(c.g, c.laid);
    const cut = c.g.nodes.length - PLAY.reach(c.g, 'Z', c.laid).size;
    return { conn, cyc, cost, cut };
  }

  function render() {
    const s = state(), cyc = new Set(s.cyc), hl = c.hl || new Set(), ovl = c.overlay || new Set();
    PLAY.draw(c.g, {
      name: nm,
      edgeCls: i => (c.laid.has(i) ? 'on' : 'off') + (cyc.has(i) && c.L.goal !== 'connect' ? ' bad' : '') + (hl.has(i) ? ' hl' : '') + (ovl.has(i) ? ' ovl' : ''),
      label: i => rm(c.g.edges[i].w),
      nodeCls: id => (id === 'Z' ? 'start' : '') + (c.pick === id ? ' picked' : '') + (id !== 'Z' && PLAY.reach(c.g, 'Z', c.laid).has(id) ? ' visited' : '') + (c.hintNode === id ? ' hintn' : ''),
      tag: id => id === 'Z' ? '📡' : ''
    });
    const chip = (ok, en, bm) => '<span class="pill ' + (ok ? 'done' : 'lock') + '" style="margin:2px 6px 2px 0;">' + T(en, bm) + '</span>';
    $('p-trail').innerHTML =
      (s.conn ? chip(true, 'All connected ✓', 'Semua bersambung ✓') : chip(false, s.cut + ' cut off', s.cut + ' terputus')) +
      (c.L.goal === 'connect' ? '' : s.cyc.length ? '<span class="pill alert" style="margin:2px 6px 2px 0;">' + T('Cycle ✗', 'Kitaran ✗') + '</span>' : chip(true, 'No cycles ✓', 'Tiada kitaran ✓')) +
      (c.budget ? '<span class="pill ' + (s.cost <= c.budget ? 'part' : 'alert') + '">' + T('Budget ', 'Bajet ') + rm(c.budget) + '</span>' : '');
    $('p-total').innerHTML = rm(s.cost) + '<small> · ' + c.laid.size + ' ' + T(c.laid.size === 1 ? 'cable' : 'cables', 'kabel') + '</small>';
    const play = c.phase === 'play';
    PLAY.controls([
      { id: 'w4-clear', label: T('Clear all', 'Kosongkan'), on: () => { c.laid.clear(); c.pick = null; PLAY.say(''); render(); }, disabled: !play || !c.laid.size },
      { id: 'w4-hint', label: T('Hint', 'Petunjuk'), on: hint, disabled: !play },
      { id: 'w4-learn', label: T('Learn', 'Belajar'), on: learn, disabled: !play || c.L.goal === 'connect' },
      null,
      { id: 'w4-go', label: T('Switch on the network', 'Hidupkan rangkaian'), on: submit, disabled: !play || !s.conn, primary: true }
    ]);
    if (play && s.conn) $('w4-go').classList.add('pulse');
    renderAid();
    if (c.phase !== 'play') renderPanel();
  }

  function onTap(t) {
    if (c.phase !== 'play') return;
    if (t.edge != null) { toggle(t.edge); return; }
    if (!c.pick) { c.pick = t.node; PLAY.say(T('Now tap the place to connect it to.', 'Sekarang ketik tempat untuk disambungkan.')); return render(); }
    if (c.pick === t.node) { c.pick = null; PLAY.say(''); return render(); }
    const i = c.g.edges.findIndex(x => (x.a === c.pick && x.b === t.node) || (x.b === c.pick && x.a === t.node));
    const from = c.pick; c.pick = null;
    if (i < 0) { PLAY.shake('p-n' + t.node); render(); return PLAY.say(T('There’s no cable route between ' + nm(from) + ' and ' + nm(t.node) + '.', 'Tiada laluan kabel antara ' + nm(from) + ' dan ' + nm(t.node) + '.'), true); }
    toggle(i);
  }

  function toggle(i) {
    if (c.laid.has(i)) c.laid.delete(i); else c.laid.add(i);
    c.hl = null; c.hintNode = null;
    const s = state();
    PLAY.say(s.cyc.length && c.L.goal !== 'connect' ? T('That cable closes a cycle (red). One cable in the ring isn’t needed.', 'Kabel itu menutup kitaran (merah). Satu kabel dalam gelang itu tidak diperlukan.') : '', !!(s.cyc.length && c.L.goal !== 'connect'));
    render();
  }

  function submit() {
    if (c.phase !== 'play') return;
    const s = state(), g = c.L.goal;
    if (!s.conn) return;
    if (g !== 'connect' && s.cyc.length) {
      logWrong('cycle_created');
      return PLAY.say(T('Everyone is connected, but there is a cycle — you paid for a cable nobody needs. Remove one red cable.', 'Semua bersambung, tetapi ada kitaran — anda membayar kabel yang tidak diperlukan. Buang satu kabel merah.'), true);
    }
    if (g === 'budget' && s.cost > c.budget) {
      logWrong('over_budget');
      return PLAY.say(T('That costs ' + rm(s.cost) + ' — over the ' + rm(c.budget) + ' budget. Swap an expensive cable for a cheaper one.', 'Kosnya ' + rm(s.cost) + ' — melebihi bajet ' + rm(c.budget) + '. Tukar kabel mahal kepada yang lebih murah.'), true);
    }
    if (g === 'min' && s.cost > c.mst.total) {
      logWrong('not_minimum', 30);
      $('p-panel').innerHTML = '<div class="note warn"><h3>' + T('It works — but it isn’t the cheapest', 'Ia berfungsi — tetapi bukan yang paling murah') + '</h3><p>' +
        T('Your network: <b class="ink">' + rm(s.cost) + '</b> — cheapest possible: <b class="ink">' + rm(c.mst.total) + '</b>. Try taking the cheapest cables first, skipping any that close a cycle.',
          'Rangkaian anda: <b class="ink">' + rm(s.cost) + '</b> — paling murah: <b class="ink">' + rm(c.mst.total) + '</b>. Cuba ambil kabel paling murah dahulu, langkau yang menutup kitaran.') +
        '</p><span class="muted">' + T('+30 XP banked. Your best score counts.', '+30 XP disimpan. Markah terbaik anda yang dikira.') + '</span></div>';
      return;
    }
    $('p-panel').innerHTML = '';
    if (s.cost === c.mst.total && g !== 'connect') { st.minNets = (st.minNets || 0) + 1; }
    c.phase = 'check'; c.time = PLAY.stopClock(); c.aid = null;
    PLAY.say(T('The network is live!', 'Rangkaian sudah hidup!'));
    render();
  }

  /* ---------- hint & learn ---------- */
  function hint() {
    c.hints = 1; c.aid = 'hint';
    const s = state();
    c.hl = new Set(); c.hintNode = null;
    if (c.L.goal !== 'connect' && s.cyc.length) s.cyc.forEach(i => c.hl.add(i));
    else if (c.L.goal === 'connect' || c.L.goal === 'tree') {
      const reached = PLAY.reach(c.g, 'Z', c.laid);
      c.hintNode = c.g.nodes.map(v => v.id).find(id => !reached.has(id)) || null;
    } else {
      const next = [...c.mst.tree].sort((x, y) => c.g.edges[x].w - c.g.edges[y].w).find(i => !c.laid.has(i));
      if (next != null) c.hl.add(next);
    }
    render();
  }
  function learn() { c.learn = 1; c.aid = 'learn'; c.overlay = new Set(c.mst.tree); render(); }

  function renderAid() {
    if (c.phase !== 'play' || !c.aid) { $('p-aid').innerHTML = ''; return; }
    const s = state();
    if (c.aid === 'hint') {
      const txt = c.L.goal !== 'connect' && s.cyc.length ? T('The highlighted cables form a cycle. Remove one of them and everyone stays connected.', 'Kabel yang diserlahkan membentuk kitaran. Buang salah satu dan semua tetap bersambung.')
        : c.hintNode ? T('The dashed ring marks a place still cut off. Lay a cable to it.', 'Bulatan bertitik menandakan tempat yang masih terputus. Pasang kabel ke situ.')
          : c.hl && c.hl.size ? T('Lay the highlighted cable: the cheapest one you haven’t used that doesn’t close a cycle.', 'Pasang kabel yang diserlahkan: yang paling murah belum digunakan dan tidak menutup kitaran.')
            : T('Every place is connected. Check the total against the goal.', 'Setiap tempat sudah bersambung. Semak jumlah dengan matlamat.');
      $('p-aid').innerHTML = '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
      return;
    }
    const rows = c.mst.steps.map(({ i, take }) => {
      const x = c.g.edges[i];
      return '<tr class="' + (take ? 'best' : '') + '"><td>' + nm(x.a) + ' – ' + nm(x.b) + '</td><td class="num">' + rm(x.w) + '</td><td>' + (take ? T('✓ take it', '✓ ambil') : T('✗ skip — closes a cycle', '✗ langkau — menutup kitaran')) + '</td></tr>';
    }).join('');
    $('p-aid').innerHTML = '<div class="note"><h3>' + T('Learn: cheapest first', 'Belajar: paling murah dahulu') + ' <span class="pill alert">−10 XP</span></h3><p>' +
      T('Go through the cables from cheapest to dearest. Take each one unless it closes a cycle. You end with ' + (c.g.nodes.length - 1) + ' cables costing <b class="ink">' + rm(c.mst.total) + '</b> — dotted in blue on the map.',
        'Semak kabel dari paling murah ke paling mahal. Ambil setiap satu kecuali ia menutup kitaran. Anda akan mendapat ' + (c.g.nodes.length - 1) + ' kabel berharga <b class="ink">' + rm(c.mst.total) + '</b> — bertitik biru pada peta.') +
      '</p><table><tr><th>' + T('Cable', 'Kabel') + '</th><th class="num">' + T('Cost', 'Kos') + '</th><th></th></tr>' + rows + '</table></div>';
  }

  /* ---------- quick check → XP ---------- */
  function quickCheck() {
    if (c.L.qc) { const q = c.L.qc; return { q: tt(q.q), answer: q.answer, why: tt(q.why), opts: q.opts.map(o => [o[0], Array.isArray(o[1]) ? tt(o[1]) : o[1]]) }; }
    const nn = c.g.nodes.length, used = c.laid.size;
    if (c.i === 0) {
      const spare = used > nn - 1;
      return {
        q: T('Your network uses ' + used + ' cables for ' + nn + ' places. Could you remove one cable and still keep everyone connected?', 'Rangkaian anda guna ' + used + ' kabel untuk ' + nn + ' tempat. Bolehkah anda buang satu kabel dan semua masih bersambung?'),
        opts: [['y', T('Yes', 'Ya')], ['n', T('No', 'Tidak')]], answer: spare ? 'y' : 'n',
        why: spare ? T(nn + ' places need only ' + (nn - 1) + ' cables. With ' + used + ', at least one cable sits on a cycle and can go.', nn + ' tempat hanya perlukan ' + (nn - 1) + ' kabel. Dengan ' + used + ', sekurang-kurangnya satu kabel berada dalam kitaran dan boleh dibuang.')
          : T('you used exactly ' + (nn - 1) + ' cables for ' + nn + ' places. Remove any one and some place is cut off.', 'anda guna tepat ' + (nn - 1) + ' kabel untuk ' + nn + ' tempat. Buang mana-mana satu dan ada tempat yang terputus.')
      };
    }
    return {
      q: T('This district has ' + nn + ' places. How many cables does the cheapest network use?', 'Daerah ini ada ' + nn + ' tempat. Berapa kabel digunakan oleh rangkaian paling murah?'),
      opts: [['a', String(nn - 1)], ['b', String(nn)], ['c', String(nn + 1)]], answer: 'a',
      why: T('the cheapest network has no cycles, so it joins ' + nn + ' places with ' + (nn - 1) + ' cables.', 'rangkaian paling murah tiada kitaran, jadi ia menyambung ' + nn + ' tempat dengan ' + (nn - 1) + ' kabel.')
    };
  }

  function renderPanel() {
    const s = state();
    const head = '<div class="note ok"><h3>' + T('Network live! ', 'Rangkaian hidup! ') + rm(s.cost) + '</h3><p>' +
      (c.L.goal === 'min' ? T('The cheapest possible — the engine checked every cable.', 'Paling murah — enjin telah menyemak setiap kabel.')
        : T('Every place is connected with ' + c.laid.size + ' cables.', 'Setiap tempat bersambung dengan ' + c.laid.size + ' kabel.')) + '</p></div>';
    if (c.phase === 'check') {
      return PLAY.quick(head, quickCheck(), ok => {
        c.xp = finishLevel(4, c.i, PLAY.parts(T('Network built', 'Rangkaian dibina'), ok, c.hints, c.learn, c.time, c.L.target), c.time, c.hints, c.learn);
        giveBadges((st.minNets || 0) >= 3 ? ['first_connection', 'budget_engineer'] : ['first_connection']);
        c.phase = 'xp'; renderPanel();
      });
    }
    if (c.phase === 'xp') PLAY.xp(head, 4, c.i, c.xp);
  }

  /* ---------- Discover ---------- */
  function renderDiscover() {
    PLAY.discover({
      w: 4,
      opts: [
        ['a', T('A network with no cycles always uses one cable fewer than the number of places.', 'Rangkaian tanpa kitaran sentiasa guna satu kabel kurang daripada bilangan tempat.')],
        ['b', T('A network with no cycles uses as many cables as there are places.', 'Rangkaian tanpa kitaran guna kabel sebanyak bilangan tempat.')],
        ['c', T('A network with no cycles always includes the cheapest cable of each place.', 'Rangkaian tanpa kitaran sentiasa mengandungi kabel paling murah bagi setiap tempat.')]
      ],
      answer: 'a',
      why: p => p === 'a' ? T('Exactly: 5 places took 4 cables, 6 took 5, 7 took 6. Each cable adds one new place.', 'Tepat: 5 tempat guna 4 kabel, 6 guna 5, 7 guna 6. Setiap kabel menambah satu tempat baharu.')
        : p === 'b' ? T('Count again on Level 2: 6 places, 5 cables. One more cable would close a cycle.', 'Kira semula pada Tahap 2: 6 tempat, 5 kabel. Satu lagi kabel akan menutup kitaran.')
          : T('In Level 1 many networks worked without some of the cheapest cables. Only the cheapest network overall follows a cost rule.', 'Dalam Tahap 1 banyak rangkaian berfungsi tanpa kabel paling murah. Hanya rangkaian paling murah keseluruhan mengikut peraturan kos.'),
      terms: [
        ['Subgraph', 'Subgraf', 'Part of a graph: some of its vertices and edges. Your network is a subgraph of the map.', 'Sebahagian graf: sebahagian bucu dan sisinya. Rangkaian anda ialah subgraf peta.'],
        ['Tree', 'Pokok', 'A connected graph with no cycles. With n vertices it has exactly n − 1 edges.', 'Graf tersambung tanpa kitaran. Dengan n bucu ia ada tepat n − 1 sisi.'],
        ['Tree with minimum total weight', 'Pokok dengan jumlah pemberat minimum', 'The tree joining every vertex whose edge weights add up to the least.', 'Pokok yang menyambung setiap bucu dengan jumlah pemberat sisi paling kecil.']
      ]
    });
  }

  const api = { levels: LEVELS, start, render: () => c && render(), renderDiscover, _: { checkLevels, randomMap } };
  root.W4 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
