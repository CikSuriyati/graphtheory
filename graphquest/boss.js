/**
 * GRAPH QUEST — Boss Level
 * ------------------------------------------------------------------
 * One new town, four missions, no hint about which idea applies. Before
 * each mission the student answers "Which tool will you use?" by picking a
 * world. A right first choice earns the reasoning XP even if the solution
 * needs a retry, and is saved as boss_tool_choice — the study's cleanest
 * measure of problem-solving.
 *   1 water supply to every place, cheapest   → Build the Network (World 4)
 *   2 ambulance to the clinic, fastest          → Shortest Path Race (World 3)
 *   3 the busiest junction                      → Graph Detective (World 2)
 *   4 the bridge is down: can the fire engine get through? → Graph Maze (World 1)
 * Unlocks once Worlds 1–4 are cleared. Stored as world 7, levels 1–4.
 */
(function (root) {
  'use strict';

  const PLACES = {
    W: ['Water tank', 'Tangki air'], S: ['School', 'Sekolah'], M: ['Market', 'Pasar'], C: ['Crossroads', 'Simpang empat'],
    Q: ['Mosque', 'Masjid'], K: ['Clinic', 'Klinik'], F: ['Fire station', 'Balai bomba'], N: ['Taman Baru', 'Taman Baru']
  };
  const nm = id => tt(PLACES[id]);
  const n = (id, x, y) => ({ id, x, y });
  const r = (a, b, w, m) => ({ a, b, w, m });

  // w = pipe cost (RM k), m = driving minutes. Edge 7 (C–N) is the bridge.
  const TOWN = {
    nodes: [n('W', 70, 200), n('S', 200, 80), n('M', 200, 320), n('C', 340, 200), n('Q', 340, 350), n('K', 480, 70), n('F', 480, 330), n('N', 600, 200)],
    edges: [r('W', 'S', 4, 6), r('W', 'M', 6, 5), r('S', 'C', 5, 4), r('M', 'C', 3, 9), r('S', 'K', 9, 2), r('C', 'K', 7, 5),
      r('C', 'F', 8, 4), r('C', 'N', 10, 3), r('M', 'Q', 2, 6), r('Q', 'F', 6, 5), r('K', 'N', 11, 6)]
  };
  const BRIDGE = 7;

  const TOOLS = [
    { k: 'maze', w: 1, icon: '🧭', name: ['Graph Maze', 'Labirin Graf'], what: ['paths, connected or not', 'lorong, tersambung atau tidak'] },
    { k: 'degree', w: 2, icon: '🔍', name: ['Graph Detective', 'Detektif Graf'], what: ['degree of a vertex', 'darjah bucu'] },
    { k: 'shortest', w: 3, icon: '🚚', name: ['Shortest Path Race', 'Perlumbaan Laluan Terpendek'], what: ['the shortest route', 'laluan terpendek'] },
    { k: 'network', w: 4, icon: '📡', name: ['Build the Network', 'Bina Rangkaian'], what: ['cheapest way to connect all', 'cara paling murah menyambung semua'] }
  ];

  const MISSIONS = [
    { title: ['Water for everyone', 'Air untuk semua'], tool: 'network', target: 120,
      story: ['The new <b class="ink">water tank</b> must supply every place in town. Pipes cost money — the labels are in RM k. Connect every place for the lowest total cost.',
        '<b class="ink">Tangki air</b> baharu mesti membekalkan setiap tempat di pekan. Paip memerlukan kos — label dalam RM k. Sambung setiap tempat dengan jumlah kos paling rendah.'],
      why: ['joining every place for the least total cost is a tree with minimum total weight.', 'menyambung setiap tempat dengan jumlah kos paling rendah ialah pokok dengan jumlah pemberat minimum.'] },
    { title: ['Ambulance!', 'Ambulans!'], tool: 'shortest', target: 90,
      story: ['An accident at the <b class="ink">Market</b>. The ambulance must reach the <b class="ink">Clinic</b> as fast as possible. The labels are minutes.',
        'Kemalangan di <b class="ink">Pasar</b>. Ambulans mesti sampai ke <b class="ink">Klinik</b> secepat mungkin. Label ialah minit.'],
      why: ['the fastest route between two places is a shortest path in a weighted graph.', 'laluan paling pantas antara dua tempat ialah laluan terpendek dalam graf berpemberat.'] },
    { title: ['Traffic lights', 'Lampu isyarat'], tool: 'degree', target: 60,
      story: ['The council will put traffic lights at the <b class="ink">busiest junction</b> — the place where the most roads meet. Tap it.',
        'Majlis akan memasang lampu isyarat di <b class="ink">simpang paling sibuk</b> — tempat paling banyak jalan bertemu. Ketik tempat itu.'],
      why: ['the number of roads meeting at a place is its degree. The busiest junction has the highest degree.', 'bilangan jalan yang bertemu di sesuatu tempat ialah darjahnya. Simpang paling sibuk mempunyai darjah tertinggi.'] },
    { title: ['The bridge is down', 'Jambatan runtuh'], tool: 'maze', target: 90,
      story: ['The bridge between the <b class="ink">Crossroads</b> and <b class="ink">Taman Baru</b> has collapsed. Can the fire engine still get from the <b class="ink">Fire station</b> to Taman Baru? Find a way — or say there is none.',
        'Jambatan antara <b class="ink">Simpang empat</b> dan <b class="ink">Taman Baru</b> telah runtuh. Bolehkah jentera bomba masih pergi dari <b class="ink">Balai bomba</b> ke Taman Baru? Cari jalan — atau nyatakan tiada.'],
      why: ['whether any route exists at all is a question about paths and whether the graph is connected.', 'sama ada wujud sebarang laluan ialah soalan tentang lorong dan sama ada graf tersambung.'] }
  ];

  const deg = v => TOWN.edges.reduce((d, e) => d + (e.a === v) + (e.b === v), 0);

  function checkTown() {
    const out = [];
    if (!PLAY.mstUnique(TOWN)) out.push('water: cheapest network not unique');
    const sol = E.solve(TOWN, 'M', 'K', 'm');
    if (!sol.unique) out.push('ambulance: fastest route not unique');
    const degs = TOWN.nodes.map(v => deg(v.id)), top = Math.max(...degs);
    if (degs.filter(d => d === top).length !== 1) out.push('busiest: tie');
    const closed = new Set([BRIDGE]), rest = new Set(TOWN.edges.map((_, i) => i).filter(i => !closed.has(i)));
    if (!PLAY.reach(TOWN, 'F', rest).has('N')) out.push('bridge: no way through');
    return out;
  }

  const unlocked = () => [1, 2, 3, 4].every(w => [1, 2, 3, 4, 5].every(l => st.done[w + '-' + l]));
  const coreCleared = () => [1, 2, 3, 4].reduce((a, w) => a + [1, 2, 3, 4, 5].filter(l => st.done[w + '-' + l]).length, 0);

  /* ============================================================
     Play
     ============================================================ */
  let c = null;

  function start(k) {
    const M = MISSIONS[k];
    c = { k, M, phase: 'tool', choice: null, hints: 0, wrong: 0, laid: new Set(), pick: null, hl: null, hintNode: null,
      route: null, found: null };
    if (M.tool === 'shortest') c.route = new PLAY.Route(TOWN, 'M', {});
    if (M.tool === 'maze') c.route = new PLAY.Route(TOWN, 'F', { closed: new Set([BRIDGE]) });
    PLAY.open({
      world: 7, i: k, levels: MISSIONS, title: M.title, story: M.story, target: M.target, onTap, render,
      where: ['Boss Level · Mission ' + (k + 1) + ' of 4', 'Tahap Bos · Misi ' + (k + 1) + ' daripada 4']
    });
    render();
  }

  function logWrong(tag) {
    c.wrong++;
    logAttempt({ world: 7, level: c.k + 1, correct: false, optimal: false, score_xp: 0, mistake_tag: tag, hints_used: c.hints, learn_used: 0, time_s: PLAY.secs(), boss_tool_choice: c.choice || '' });
    save();
  }

  function render() {
    const M = c.M, t = M.tool;
    const onSet = c.route ? new Set(c.route.edges) : c.laid;
    const hl = c.hl || new Set();
    PLAY.draw(TOWN, {
      name: nm,
      edgeCls: i => (t === 'maze' && i === BRIDGE ? 'closed' : '') + (onSet.has(i) ? ' on' : t === 'network' && c.phase !== 'tool' ? ' off' : '') + (hl.has(i) ? ' hl' : '') +
        (t === 'network' && c.phase === 'solve' && PLAY.loopEdges(TOWN, c.laid).includes(i) ? ' bad' : ''),
      label: i => c.phase === 'tool' ? null : t === 'network' ? 'RM' + TOWN.edges[i].w + 'k' : t === 'shortest' ? TOWN.edges[i].m + ' min' : (t === 'maze' && i === BRIDGE ? T('✗ bridge', '✗ jambatan') : null),
      nodeCls: id => (c.found === id ? 'found' : '') + (c.hintNode === id ? ' hintn' : '') + (c.route && c.route.nodes.includes(id) && id !== c.route.nodes[0] ? ' visited' : '') +
        (c.route && id === c.route.nodes[0] ? ' start' : '') + ((t === 'shortest' && id === 'K') || (t === 'maze' && id === 'N') ? ' end' : '') + (t === 'network' && id === 'W' ? ' start' : '') + (c.pick === id ? ' picked' : ''),
      tag: id => (t === 'network' && id === 'W') ? '💧' : c.route && id === c.route.nodes[0] ? '▶' : '',
      lorry: c.route && c.phase === 'solve' ? c.route.end() : null, marker: t === 'shortest' ? '🚑' : '🚒'
    });
    $('p-trail').textContent = c.route ? c.route.nodes.map(nm).join(' → ') : '';
    $('p-total').innerHTML = t === 'network' ? 'RM' + PLAY.cost(TOWN, c.laid) + 'k<small> · ' + c.laid.size + T(' pipes', ' paip') + '</small>'
      : t === 'shortest' ? c.route.total('m') + '<small> min</small>' : '';
    renderAsk();
    renderControls();
  }

  function renderAsk() {
    if (c.phase !== 'tool') { if (c.phase === 'solve' && c.toolMsg) $('p-ask').innerHTML = c.toolMsg; else if (c.phase === 'solve') $('p-ask').innerHTML = ''; return; }
    $('p-ask').innerHTML = '<div class="note ask"><h3>' + T('Which tool will you use?', 'Alat mana yang akan anda gunakan?') + ' <span class="pill new">+20 XP</span></h3>' +
      '<p style="margin:0 0 8px;">' + T('Pick the world whose idea solves this mission. You only get one pick.', 'Pilih dunia yang ideanya menyelesaikan misi ini. Anda hanya ada satu pilihan.') + '</p>' +
      '<div class="tools">' + TOOLS.map(x => '<button class="tool" data-tool="' + x.k + '"><span class="ti">' + x.icon + '</span><b>' + tt(x.name) + '</b><span>' + tt(x.what) + '</span></button>').join('') + '</div></div>';
    $('p-ask').querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => choose(b.dataset.tool)));
  }

  function choose(k) {
    c.choice = k;
    const right = k === c.M.tool, best = TOOLS.find(x => x.k === c.M.tool);
    c.toolRight = right;
    c.toolMsg = '<div class="note ' + (right ? 'ok' : 'warn') + '"><p style="margin:0;color:var(--ink);">' +
      (right ? T('✓ Right tool — ', '✓ Alat yang betul — ') : T('The best tool here is <b>' + tt(best.name) + '</b>: ', 'Alat terbaik di sini ialah <b>' + tt(best.name) + '</b>: ')) + tt(c.M.why) + '</p></div>';
    c.phase = 'solve';
    PLAY.say(c.M.tool === 'degree' ? T('Tap the busiest junction.', 'Ketik simpang paling sibuk.') : c.M.tool === 'network' ? T('Tap pipes to lay them.', 'Ketik paip untuk memasangnya.') : T('Tap roads to build the route.', 'Ketik jalan untuk membina laluan.'));
    render();
  }

  function renderControls() {
    const t = c.M.tool, solve = c.phase === 'solve';
    if (c.phase === 'tool' || c.phase === 'done') { $('p-controls').innerHTML = ''; return; }
    const list = [];
    if (c.route) list.push({ id: 'b-undo', label: T('Undo', 'Buat asal'), on: () => { c.route.undo(); PLAY.say(''); render(); }, disabled: !solve || !c.route.edges.length });
    if (t === 'network') list.push({ id: 'b-clear', label: T('Clear all', 'Kosongkan'), on: () => { c.laid.clear(); render(); }, disabled: !solve || !c.laid.size });
    list.push({ id: 'b-hint', label: T('Hint', 'Petunjuk'), on: hint, disabled: !solve });
    list.push(null);
    if (t === 'maze') list.push({ id: 'b-noway', label: T('No way through', 'Tiada jalan'), on: noWay, disabled: !solve, primary: true });
    if (t === 'network') list.push({ id: 'b-go', label: T('Open the valves', 'Buka injap'), on: submitNet, disabled: !solve || !PLAY.connectedAll(TOWN, c.laid), primary: true });
    PLAY.controls(list);
  }

  /* ---------- taps ---------- */
  function onTap(t) {
    if (c.phase !== 'solve') return;
    const tool = c.M.tool;
    if (tool === 'degree') {
      if (!t.node) return;
      const top = Math.max(...TOWN.nodes.map(v => deg(v.id)));
      if (deg(t.node) === top) { c.found = t.node; return done(T('Yes — ' + top + ' roads meet at the ' + nm(t.node) + '.', 'Ya — ' + top + ' jalan bertemu di ' + nm(t.node) + '.')); }
      PLAY.shake('p-n' + t.node); logWrong('wrong_vertex_for_degree');
      return PLAY.say(T('The ' + nm(t.node) + ' has ' + deg(t.node) + ' roads. Is there a busier one?', nm(t.node) + ' ada ' + deg(t.node) + ' jalan. Ada yang lebih sibuk?'), true);
    }
    if (tool === 'network') {
      if (t.edge != null) return togglePipe(t.edge);
      if (!c.pick) { c.pick = t.node; return render(); }
      const i = TOWN.edges.findIndex(x => (x.a === c.pick && x.b === t.node) || (x.b === c.pick && x.a === t.node));
      c.pick = null;
      if (i < 0) { render(); return PLAY.say(T('No pipe route there.', 'Tiada laluan paip di situ.'), true); }
      return togglePipe(i);
    }
    // route missions
    const res = t.node ? c.route.tapNode(t.node) : c.route.tapEdge(t.edge);
    if (res.why === 'closed') { PLAY.shake('p-e' + BRIDGE); return PLAY.say(T('The bridge is down.', 'Jambatan runtuh.'), true); }
    if (res.why === 'repeat') { PLAY.shake('p-n' + res.to); return PLAY.say(T('No need to pass the same place twice.', 'Tidak perlu melalui tempat yang sama dua kali.'), true); }
    if (res.why === 'not_here' || res.why === 'no_edge') return PLAY.say(T('That road doesn’t start where you are.', 'Jalan itu tidak bermula dari tempat anda.'), true);
    PLAY.say('');
    render();
    const goal = tool === 'shortest' ? 'K' : 'N';
    if (c.route.end() === goal) arrive();
  }

  function togglePipe(i) { if (c.laid.has(i)) c.laid.delete(i); else c.laid.add(i); c.hl = null; render(); }

  function arrive() {
    if (c.M.tool === 'maze') return done(T('Yes — the fire engine gets through by another road.', 'Ya — jentera bomba boleh melalui jalan lain.'));
    const res = E.checkRoute(TOWN, 'M', 'K', 'm', null, c.route.edges);
    if (res.optimal) return done(T('Fastest possible — ' + res.cost + ' minutes.', 'Paling pantas — ' + res.cost + ' minit.'));
    logWrong('not_fastest');
    PLAY.say(T('The ambulance got there in ' + res.cost + ' min — but ' + res.sol.best.cost + ' min is possible. Undo and try another way.', 'Ambulans sampai dalam ' + res.cost + ' minit — tetapi ' + res.sol.best.cost + ' minit boleh dicapai. Buat asal dan cuba jalan lain.'), true);
  }

  function noWay() {
    logWrong('said_no_way_but_connected');
    PLAY.say(T('Look again — there is another way round to Taman Baru.', 'Lihat semula — ada jalan lain ke Taman Baru.'), true);
  }

  function submitNet() {
    const cyc = PLAY.loopEdges(TOWN, c.laid), cost = PLAY.cost(TOWN, c.laid), best = PLAY.kruskal(TOWN).total;
    if (cyc.length) { logWrong('cycle_created'); return PLAY.say(T('The red pipes form a cycle — one of them isn’t needed.', 'Paip merah membentuk kitaran — salah satunya tidak diperlukan.'), true); }
    if (cost > best) { logWrong('not_minimum'); return PLAY.say(T('Everyone has water for RM' + cost + 'k — but RM' + best + 'k is possible.', 'Semua dapat air dengan RM' + cost + 'k — tetapi RM' + best + 'k boleh dicapai.'), true); }
    done(T('Every place has water for RM' + cost + 'k — the cheapest possible.', 'Setiap tempat dapat air dengan RM' + cost + 'k — paling murah.'));
  }

  function hint() {
    c.hints = 1; c.hl = null; c.hintNode = null;
    const t = c.M.tool;
    let txt;
    if (t === 'network') {
      const k = PLAY.kruskal(TOWN), next = [...k.tree].sort((x, y) => TOWN.edges[x].w - TOWN.edges[y].w).find(i => !c.laid.has(i));
      if (next != null) c.hl = new Set([next]);
      txt = T('Lay the highlighted pipe: the cheapest one left that doesn’t close a cycle.', 'Pasang paip yang diserlahkan: yang paling murah dan tidak menutup kitaran.');
    } else if (t === 'shortest') {
      c.hintNode = 'S';
      txt = T('Add up the minutes along each route. The fastest one passes the dashed ring.', 'Jumlahkan minit setiap laluan. Yang paling pantas melalui bulatan bertitik.');
    } else if (t === 'degree') {
      txt = T('Count the roads touching each place. Only one place has more than three.', 'Kira jalan yang menyentuh setiap tempat. Hanya satu tempat ada lebih daripada tiga.');
    } else {
      c.hintNode = 'K';
      txt = T('The direct bridge is gone, but Taman Baru has another road. The dashed ring is on the way.', 'Jambatan sudah tiada, tetapi Taman Baru ada jalan lain. Bulatan bertitik berada dalam perjalanan.');
    }
    $('p-aid').innerHTML = '<div class="note warn"><h3>' + T('Hint', 'Petunjuk') + ' <span class="pill part">' + T('no-hint bonus lost', 'bonus tanpa petunjuk hilang') + '</span></h3><p>' + txt + '</p></div>';
    render();
  }

  function done(msg) {
    c.phase = 'done';
    const time = PLAY.stopClock();
    PLAY.say(msg);
    $('p-aid').innerHTML = '';
    const parts = [
      ['reasoning', T('Right tool, first pick', 'Alat betul, pilihan pertama'), c.toolRight ? 20 : 0],
      ['correct', T('Mission solved', 'Misi selesai'), 60],
      ['nohint', T('No hint', 'Tanpa petunjuk'), c.hints ? 0 : 10],
      ['speed', T('Speed · under ', 'Kelajuan · bawah ') + c.M.target + ' s (' + time + ' s)', time <= c.M.target ? 10 : 0]
    ];
    const x = finishLevel(7, c.k, parts, time, c.hints, 0, { boss_tool_choice: c.choice });
    const all = MISSIONS.every((_, j) => st.done['7-' + (j + 1)]);
    giveBadges(all ? ['first_connection', 'graph_legend'] : ['first_connection']);
    render();
    PLAY.xp('<div class="note ok"><h3>' + T('Mission ', 'Misi ') + (c.k + 1) + T(' complete!', ' selesai!') + '</h3><p>' + msg + '</p></div>' +
      (all && c.k === MISSIONS.length - 1 ? '<div class="note" style="background:var(--yellow);"><h3>🏆 ' + T('Boss Level cleared — you are a Graph Legend!', 'Tahap Bos selesai — anda Lagenda Graf!') + '</h3><p style="margin:0;">' +
        T('You chose the right idea for each problem, not just used it when told.', 'Anda memilih idea yang betul untuk setiap masalah, bukan sekadar menggunakannya apabila disuruh.') + '</p></div>' : ''), 7, c.k, x);
  }

  /* ---------- the card on the map ---------- */
  function card() {
    if (!unlocked()) {
      return '<div class="world locked bosscard"><div class="n">★</div><h3>' + T('Boss Level', 'Tahap Bos') + '</h3>' +
        '<div class="topic">' + T('Four missions in one town — choose the right tool for each.', 'Empat misi dalam satu pekan — pilih alat yang betul untuk setiap satu.') + '</div>' +
        '<span class="corner pill lock">' + T('Clear Worlds 1–4 · ', 'Selesaikan Dunia 1–4 · ') + coreCleared() + ' / 20</span></div>';
    }
    const next = MISSIONS.findIndex((_, j) => !st.done['7-' + (j + 1)]);
    const steps = MISSIONS.map((M, j) => {
      const d = st.done['7-' + (j + 1)], open = j === 0 || st.done['7-' + j];
      return '<button class="step ' + (d ? 'done' : j === next ? 'now' : '') + '" data-boss="' + j + '"' + (open ? '' : ' disabled') + '><b>' + (d ? '✓' : j + 1) + '</b>' + (st.best['7-' + (j + 1)] || '·') + '</button>';
    }).join('');
    const all = next < 0;
    return '<div class="world open bosscard"><div class="n" style="background:var(--yellow)">★</div><h3>' + T('Boss Level', 'Tahap Bos') + '</h3>' +
      '<div class="topic">' + T('Four missions in one town — choose the right tool for each.', 'Empat misi dalam satu pekan — pilih alat yang betul untuk setiap satu.') + '</div>' +
      '<span class="corner pill ' + (all ? 'done' : 'part') + '">' + (all ? T('Cleared', 'Selesai') : MISSIONS.filter((_, j) => st.done['7-' + (j + 1)]).length + ' / 4') + '</span>' +
      '<div class="steps">' + steps + '</div></div>';
  }

  const api = { levels: MISSIONS, start, render: () => c && render(), card, unlocked, TOOLS, _: { checkTown } };
  root.BOSS = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
