/**
 * GRAPH QUEST — pre-test, post-test and survey
 * ------------------------------------------------------------------
 * Two matched forms, A and B: item n on each form tests the same idea
 * with different numbers. Odd register numbers take A before and B
 * after; even numbers take B then A, so neither form's difficulty
 * biases the gain. Items 1, 3, 5, 8, 10 are applied; 2, 4, 6, 7, 9 recall.
 *
 * A test is measurement, not play: no hints, no feedback, no XP, one
 * attempt. The pre-test is offered before the first level (and can be
 * skipped); the post-test opens once a student has cleared 5 levels and
 * submitted results. ?test=pre or ?test=post opens one directly — that
 * link is for a control class that doesn't play.
 *
 * Loaded before the main script; it uses the shell's helpers (T, tt, st,
 * save, show, $, renderMap, sendTests…) only when called. The dashboard
 * loads it too, for SLOTS and SURVEY.
 */
(function (root) {
  'use strict';

  const POST_AFTER_LEVELS = 5;

  /* ---------- diagrams ---------- */
  const g = (nodes, edges) => ({ nodes, edges });
  const v = (id, x, y) => ({ id, x, y });

  const G1A = g([v('P', 60, 100), v('Q', 170, 35), v('R', 170, 165), v('S', 270, 100), v('T', 340, 100)],
    [['P', 'Q'], ['P', 'R'], ['P', 'S'], ['Q', 'R'], ['S', 'T']]);
  const G1B = g([v('A', 50, 100), v('B', 170, 100), v('C', 280, 35), v('D', 280, 165), v('E', 90, 180)],
    [['A', 'B'], ['B', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'D']]);
  const G5A = g([v('Y', 60, 130), v('X', 180, 130), v('Z', 300, 130)], [['X', 'Y'], ['X', 'Z'], ['X', 'X']]);
  const G5B = g([v('N', 60, 110), v('M', 180, 110), v('O', 300, 110), v('P', 180, 190)], [['M', 'N'], ['M', 'O'], ['M', 'P'], ['M', 'M']]);
  const G7A = g([v('A', 50, 50), v('B', 140, 150), v('C', 40, 170), v('D', 250, 50), v('E', 330, 150)],
    [['A', 'B'], ['B', 'C'], ['D', 'E']]);
  const G7B = g([v('A', 50, 100), v('B', 150, 35), v('C', 150, 165), v('D', 250, 100), v('E', 340, 100)],
    [['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'], ['D', 'E']]);
  const G8A = g([v('S', 40, 100), v('A', 180, 35), v('B', 180, 165), v('T', 330, 100)],
    [['S', 'A', 4], ['S', 'B', 7], ['A', 'B', 2], ['A', 'T', 8], ['B', 'T', 3]]);
  const G8B = g([v('S', 40, 100), v('A', 180, 35), v('B', 180, 165), v('T', 330, 100)],
    [['S', 'A', 5], ['S', 'B', 3], ['A', 'B', 1], ['A', 'T', 4], ['B', 'T', 9]]);
  const G10A = g([v('P', 70, 40), v('Q', 290, 40), v('R', 290, 165), v('S', 70, 165)],
    [['P', 'Q', 3], ['Q', 'R', 4], ['R', 'S', 2], ['S', 'P', 5], ['P', 'R', 6]]);
  const G10B = g([v('A', 70, 40), v('B', 290, 40), v('C', 290, 165), v('D', 70, 165)],
    [['A', 'B', 6], ['B', 'C', 2], ['C', 'D', 5], ['D', 'A', 3], ['A', 'C', 7]]);

  /* ---------- the two forms ---------- */
  const num = (q, ans, extra) => Object.assign({ kind: 'num', q, ans: String(ans) }, extra || {});
  const mc = (q, opts, ans, extra) => Object.assign({ kind: 'mc', q, opts, ans }, extra || {});

  const FORMS = {
    A: [
      num(['What is the degree of vertex P?', 'Apakah darjah bucu P?'], 3, { g: G1A }),
      num(['A graph has 7 edges. What is the sum of the degrees of all its vertices?', 'Sebuah graf mempunyai 7 sisi. Apakah hasil tambah darjah semua bucunya?'], 14),
      num(['The vertices of a graph have degrees 3, 3, 2, 2 and 2. How many edges does the graph have?', 'Bucu-bucu sebuah graf mempunyai darjah 3, 3, 2, 2 dan 2. Berapakah bilangan sisi graf itu?'], 6),
      mc(['Which of these is a simple graph?', 'Yang manakah graf mudah?'], [
        ['a', ['A graph with a loop at one vertex', 'Graf dengan gelung pada satu bucu']],
        ['b', ['A graph with two edges joining the same pair of vertices', 'Graf dengan dua sisi menghubungkan pasangan bucu yang sama']],
        ['c', ['A graph with no loops and no multiple edges', 'Graf tanpa gelung dan tanpa sisi berbilang']],
        ['d', ['A graph where every vertex has a loop', 'Graf yang setiap bucunya ada gelung']]], 'c'),
      num(['What is the degree of vertex X?', 'Apakah darjah bucu X?'], 4, { g: G5A }),
      mc(['Which of these is a path in this graph?', 'Yang manakah lorong dalam graf ini?'], [
        ['a', ['P → Q → P → S', 'P → Q → P → S']], ['b', ['P → Q → R', 'P → Q → R']],
        ['c', ['P → T', 'P → T']], ['d', ['Q → S → T', 'Q → S → T']]], 'b', { g: G1A }),
      mc(['Is this graph connected?', 'Adakah graf ini tersambung?'], [
        ['a', ['Yes — every vertex has at least one edge', 'Ya — setiap bucu ada sekurang-kurangnya satu sisi']],
        ['b', ['No — some pairs of vertices have no path between them', 'Tidak — ada pasangan bucu yang tiada lorong antaranya']],
        ['c', ['Yes — it has 3 edges', 'Ya — ia ada 3 sisi']]], 'b', { g: G7A }),
      num(['The numbers are distances in km. What is the shortest distance from S to T?', 'Nombor-nombor itu ialah jarak dalam km. Apakah jarak terpendek dari S ke T?'], 9, { g: G8A, unit: 'km' }),
      num(['A tree has 8 vertices. How many edges does it have?', 'Sebuah pokok mempunyai 8 bucu. Berapakah bilangan sisinya?'], 7),
      num(['The numbers are cable lengths in metres. Every house must be connected using the least total cable. What is that smallest total?', 'Nombor-nombor itu ialah panjang kabel dalam meter. Setiap rumah mesti disambungkan dengan jumlah kabel paling sedikit. Berapakah jumlah itu?'], 9, { g: G10A, unit: 'm' })
    ],
    B: [
      num(['What is the degree of vertex B?', 'Apakah darjah bucu B?'], 4, { g: G1B }),
      num(['A graph has 9 edges. What is the sum of the degrees of all its vertices?', 'Sebuah graf mempunyai 9 sisi. Apakah hasil tambah darjah semua bucunya?'], 18),
      num(['The vertices of a graph have degrees 4, 3, 3, 2 and 2. How many edges does the graph have?', 'Bucu-bucu sebuah graf mempunyai darjah 4, 3, 3, 2 dan 2. Berapakah bilangan sisi graf itu?'], 7),
      mc(['Which of these makes a graph NOT a simple graph?', 'Yang manakah menjadikan sebuah graf BUKAN graf mudah?'], [
        ['a', ['It has a vertex of degree 1', 'Ia ada bucu berdarjah 1']],
        ['b', ['It has two edges joining the same two vertices', 'Ia ada dua sisi yang menghubungkan dua bucu yang sama']],
        ['c', ['It is not connected', 'Ia tidak tersambung']],
        ['d', ['It has 6 vertices', 'Ia ada 6 bucu']]], 'b'),
      num(['What is the degree of vertex M?', 'Apakah darjah bucu M?'], 5, { g: G5B }),
      mc(['Which of these is a path in this graph?', 'Yang manakah lorong dalam graf ini?'], [
        ['a', ['A → C', 'A → C']], ['b', ['A → B → A → E', 'A → B → A → E']],
        ['c', ['A → B → C → D', 'A → B → C → D']], ['d', ['E → D', 'E → D']]], 'c', { g: G1B }),
      mc(['Is this graph connected?', 'Adakah graf ini tersambung?'], [
        ['a', ['Yes — there is a path between every pair of vertices', 'Ya — ada lorong antara setiap pasangan bucu']],
        ['b', ['No — it has a vertex of degree 1', 'Tidak — ia ada bucu berdarjah 1']],
        ['c', ['No — it contains a cycle', 'Tidak — ia mengandungi kitaran']]], 'a', { g: G7B }),
      num(['The numbers are distances in km. What is the shortest distance from S to T?', 'Nombor-nombor itu ialah jarak dalam km. Apakah jarak terpendek dari S ke T?'], 8, { g: G8B, unit: 'km' }),
      num(['A tree has 11 vertices. How many edges does it have?', 'Sebuah pokok mempunyai 11 bucu. Berapakah bilangan sisinya?'], 10),
      num(['The numbers are cable lengths in metres. Every house must be connected using the least total cable. What is that smallest total?', 'Nombor-nombor itu ialah panjang kabel dalam meter. Setiap rumah mesti disambungkan dengan jumlah kabel paling sedikit. Berapakah jumlah itu?'], 10, { g: G10B, unit: 'm' })
    ]
  };

  /** What item n tests — the same on both forms. Used by the dashboard. */
  const SLOTS = [
    ['Degree of a vertex', 'Darjah bucu'], ['Sum of degrees', 'Hasil tambah darjah'], ['Edges from degrees', 'Sisi daripada darjah'],
    ['Simple graph', 'Graf mudah'], ['Degree with a loop', 'Darjah dengan gelung'], ['Path', 'Lorong'],
    ['Connected graph', 'Graf tersambung'], ['Shortest path', 'Laluan terpendek'], ['Edges of a tree', 'Sisi pokok'],
    ['Minimum total weight', 'Jumlah pemberat minimum']
  ];

  const SURVEY = [
    ['Graph Quest was fun to use.', 'Graph Quest seronok digunakan.'],
    ['I understand degree better after playing.', 'Saya lebih faham darjah selepas bermain.'],
    ['I understand shortest paths better after playing.', 'Saya lebih faham laluan terpendek selepas bermain.'],
    ['The feedback helped me see my mistakes.', 'Maklum balas membantu saya melihat kesilapan saya.'],
    ['The hints helped me when I was stuck.', 'Petunjuk membantu saya apabila tersekat.'],
    ['I would like to learn other topics this way.', 'Saya mahu belajar topik lain dengan cara ini.'],
    ['The game was easy to use on my device.', 'Permainan ini mudah digunakan pada peranti saya.'],
    ['I feel confident answering graph questions now.', 'Saya kini yakin menjawab soalan graf.']
  ];
  const LIKERT = [['Strongly disagree', 'Sangat tidak setuju'], ['Disagree', 'Tidak setuju'], ['Not sure', 'Tidak pasti'], ['Agree', 'Setuju'], ['Strongly agree', 'Sangat setuju']];

  /* ============================================================
     State helpers (the shell's st holds everything)
     ============================================================ */
  const tests = () => st.tests || (st.tests = []);
  const cleared = () => Object.keys(st.done).filter(k => st.done[k]).length;
  const lastOf = kind => tests().filter(r => r.test === kind).slice(-1)[0];
  const formFor = kind => ((+st.reg % 2 === 1) === (kind === 'pre')) ? 'A' : 'B';

  const preTaken = () => !!tests().find(r => r.test === 'pre' && !r.skipped);
  const preSkipped = () => !!tests().find(r => r.test === 'pre' && r.skipped);
  const postTaken = () => !!lastOf('post');
  /** Offer the pre-test only before any level has been cleared. */
  const preOpen = () => !preTaken() && cleared() === 0;
  const needPre = () => preOpen() && !preSkipped();
  const postOpen = () => !postTaken() && cleared() >= POST_AFTER_LEVELS && st.sent > 0;

  function record(row) {
    const d = new Date(), p = x => String(x).padStart(2, '0');
    tests().push(Object.assign({
      test_id: 't' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
      timestamp: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()),
      class_code: st.classCode, student_code: studentCode(), form: '', score: 0, max: 0, answers: '', correct_items: '',
      time_s: 0, levels_cleared: cleared(), skipped: false
    }, row));
    save();
    sendTests();
  }

  /* ============================================================
     Drawing a question's diagram
     ============================================================ */
  function diagram(G) {
    const pos = id => G.nodes.find(n => n.id === id);
    let s = '';
    G.edges.forEach(e => {
      const A = pos(e[0]), B = pos(e[1]);
      if (e[0] === e[1]) {
        s += '<path d="M ' + (A.x - 8) + ' ' + (A.y - 15) + ' C ' + (A.x - 40) + ' ' + (A.y - 70) + ', ' + (A.x + 40) + ' ' + (A.y - 70) + ', ' + (A.x + 8) + ' ' + (A.y - 15) + '" fill="none" stroke="#17130c" stroke-width="2.5"/>';
        return;
      }
      s += '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '" stroke="#17130c" stroke-width="2.5"/>';
      if (e[2] != null) {
        const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
        s += '<rect x="' + (mx - 13) + '" y="' + (my - 11) + '" width="26" height="22" rx="7" fill="#fff" stroke="#17130c" stroke-width="1.8"/>' +
          '<text x="' + mx + '" y="' + (my + 4.5) + '" text-anchor="middle" font-size="13" font-weight="700" font-family="DM Sans, sans-serif" fill="#17130c">' + e[2] + '</text>';
      }
    });
    G.nodes.forEach(n => {
      s += '<circle cx="' + n.x + '" cy="' + n.y + '" r="15" fill="#fff" stroke="#17130c" stroke-width="2.5"/>' +
        '<text x="' + n.x + '" y="' + (n.y + 5) + '" text-anchor="middle" font-size="14" font-weight="700" font-family="Fraunces, Georgia, serif" font-style="italic" fill="#17130c">' + n.id + '</text>';
    });
    return '<div class="tdiag"><svg viewBox="0 0 380 205" role="img" aria-label="' + T('Graph for this question', 'Graf untuk soalan ini') + '">' + s + '</svg></div>';
  }

  /* ============================================================
     The runner
     ============================================================ */
  let run = null;

  /** Open a test. then() runs after the student finishes (e.g. start the level they tapped). */
  function start(kind, then) {
    const form = formFor(kind);
    run = { kind, form, items: FORMS[form], i: 0, ans: {}, t0: Date.now(), then: then || null, stage: 'intro' };
    show('test'); render();
  }

  function render() {
    if (!run) return;
    const el = $('screen-test'), k = run.kind, n = run.items.length;
    const title = k === 'pre' ? T('Before you <span class="script">start</span>', 'Sebelum anda <span class="script">mula</span>') : T('After you <span class="script">play</span>', 'Selepas anda <span class="script">bermain</span>');

    if (run.stage === 'intro') {
      el.innerHTML = '<div class="card"><div class="badge">' + (k === 'pre' ? T('Pre-test', 'Ujian pra') : T('Post-test', 'Ujian pasca')) + '</div>' +
        '<h1>' + title + '</h1>' +
        '<p style="font-size:16.5px;">' + (k === 'pre'
          ? T('10 quick questions about graphs, before you play. It is not marked for your grade — it shows what you know now, so we can see what the game teaches.', '10 soalan ringkas tentang graf, sebelum anda bermain. Ia tidak dikira untuk gred anda — ia menunjukkan apa yang anda tahu sekarang, supaya kita dapat lihat apa yang diajar oleh permainan ini.')
          : T('10 questions like the ones before you started. Answer on your own — no hints this time.', '10 soalan seperti sebelum anda mula. Jawab sendiri — tiada petunjuk kali ini.')) + '</p>' +
        (k === 'post' ? '<div class="post-warn"><b>⚠️ ' + T('Only start when you have finished playing.', 'Mula hanya apabila anda sudah selesai bermain.') + '</b> ' +
          T('You get one try, and your teacher uses it to see how much you learned from the whole game. Want to play more first? Press <i>Not yet</i> — the post-test will wait for you on the map.', 'Anda ada satu cubaan sahaja, dan guru anda menggunakannya untuk melihat berapa banyak yang anda pelajari daripada keseluruhan permainan. Mahu bermain lagi dahulu? Tekan <i>Belum lagi</i> — ujian pasca akan menunggu anda di peta.') + '</div>' : '') +
        '<div class="chips"><span class="chip">' + T('10 questions', '10 soalan') + '</span><span class="chip">' + T('about 5 minutes', 'kira-kira 5 minit') + '</span><span class="chip">' + T('one try only', 'satu cubaan sahaja') + '</span></div>' +
        '<div class="row" style="margin-top:22px;"><button class="btn" id="t-go">' + (k === 'post' ? T('I’m finished — start', 'Saya sudah selesai — mula') : T('Start', 'Mula')) + '</button>' +
        (k === 'pre' ? '<button class="btn ghost" id="t-skip">' + T('Skip', 'Langkau') + '</button>' : '<button class="btn ghost" id="t-later">' + T('Not yet — keep playing', 'Belum lagi — terus bermain') + '</button>') + '</div>' +
        (k === 'pre' ? '<p class="muted" style="margin-top:14px;">' + T('Skip only if your teacher hasn’t asked you to do it. Once you clear a level, the pre-test closes.', 'Langkau hanya jika guru anda tidak meminta anda menjawabnya. Setelah anda menyelesaikan satu tahap, ujian pra ditutup.') + '</p>' : '') +
        '</div>';
      el.insertAdjacentHTML('afterbegin', '<button class="btn ghost sm test-map" id="t-map">' + T('← Map', '← Peta') + '</button>');
      $('t-map').addEventListener('click', () => { run = null; renderMap(); show('map'); });
      $('t-go').addEventListener('click', () => { run.stage = 'q'; run.t0 = Date.now(); render(); });
      if ($('t-skip')) $('t-skip').addEventListener('click', () => { record({ test: 'pre', form: run.form, skipped: true }); finish(); });
      if ($('t-later')) $('t-later').addEventListener('click', () => { run = null; renderMap(); show('map'); });
      return;
    }

    if (run.stage === 'q') {
      const it = run.items[run.i], a = run.ans[run.i];
      let input;
      if (it.kind === 'num') {
        input = '<div class="row" style="margin-top:14px;"><input type="text" class="tnum" id="t-num" inputmode="numeric" maxlength="3" value="' + (a != null ? a : '') + '" aria-label="' + T('Your answer', 'Jawapan anda') + '">' +
          (it.unit ? '<span style="font-weight:700;">' + it.unit + '</span>' : '') + '</div>';
      } else {
        input = '<div class="opts">' + it.opts.map(o => '<button class="opt' + (a === o[0] ? ' chosen' : '') + '" data-o="' + o[0] + '">' + tt(o[1]) + '</button>').join('') + '</div>';
      }
      el.innerHTML = '<div class="tprog"><div class="row spread"><b>' + (k === 'pre' ? T('Pre-test', 'Ujian pra') : T('Post-test', 'Ujian pasca')) + '</b><span>' + (run.i + 1) + ' / ' + n + '</span></div>' +
        '<div class="progress"><i style="width:' + ((run.i) / n * 100) + '%"></i></div></div>' +
        '<div class="card"><div class="row" style="gap:12px;align-items:flex-start;"><div class="qn">' + (run.i + 1) + '</div><p style="font-size:17px;color:var(--ink);font-weight:500;margin:2px 0 0;flex:1;">' + tt(it.q) + '</p></div>' +
        (it.g ? diagram(it.g) : '') + input + '</div>' +
        '<div class="row spread" style="margin-top:18px;"><button class="btn ghost" id="t-back"' + (run.i === 0 ? ' style="visibility:hidden"' : '') + '>' + T('Back', 'Kembali') + '</button>' +
        '<button class="btn" id="t-next"' + (a == null || a === '' ? ' disabled' : '') + '>' + (run.i === n - 1 ? T('Submit test', 'Hantar ujian') : T('Next', 'Seterusnya')) + '</button></div>';
      const num = $('t-num');
      if (num) {
        num.addEventListener('input', () => {
          num.value = num.value.replace(/[^0-9]/g, '');
          run.ans[run.i] = num.value;
          $('t-next').disabled = !num.value;
        });
        num.addEventListener('keydown', e => { if (e.key === 'Enter' && num.value) $('t-next').click(); });
        num.focus();
      }
      el.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { run.ans[run.i] = b.dataset.o; render(); }));
      $('t-back').addEventListener('click', () => { run.i--; render(); window.scrollTo({top:0, behavior:'instant'}); });
      $('t-next').addEventListener('click', () => {
        if (run.i < n - 1) { run.i++; render(); window.scrollTo({top:0, behavior:'instant'}); return; }
        if (!confirm(T('Submit your answers? You can’t change them after this.', 'Hantar jawapan anda? Anda tidak boleh mengubahnya selepas ini.'))) return;
        submit();
      });
      return;
    }

    if (run.stage === 'survey') {
      el.innerHTML = '<div class="card"><div class="badge">' + T('Last step', 'Langkah terakhir') + '</div><h1>' + T('What did you <span class="script">think?</span>', 'Apa <span class="script">pendapat</span> anda?') + '</h1>' +
        '<p>' + T('Tell us honestly — there are no right answers.', 'Beritahu kami dengan jujur — tiada jawapan betul atau salah.') + '</p>' +
        '<div class="lk-key"><span>1 = ' + tt(LIKERT[0]) + '</span><span>5 = ' + tt(LIKERT[4]) + '</span></div>' +
        SURVEY.map((s, j) => '<div class="lk"><p>' + (j + 1) + '. ' + tt(s) + '</p><div class="scale" role="radiogroup">' +
          [1, 2, 3, 4, 5].map(x => '<button data-s="' + j + '" data-v="' + x + '" aria-label="' + tt(LIKERT[x - 1]) + '"' + (run.survey[j] === x ? ' class="on"' : '') + '>' + x + '</button>').join('') + '</div></div>').join('') +
        '<label class="fld" for="t-comment" style="margin-top:18px;">' + T('What did you like most, or what should we improve?', 'Apa yang paling anda suka, atau apa yang perlu diperbaiki?') + '</label>' +
        '<textarea id="t-comment" maxlength="500" rows="3">' + (run.comment || '') + '</textarea>' +
        '<div class="row" style="margin-top:18px;"><button class="btn" id="t-send"' + (Object.keys(run.survey).length < SURVEY.length ? ' disabled' : '') + '>' + T('Send', 'Hantar') + '</button>' +
        '<button class="btn ghost" id="t-noskip">' + T('Skip', 'Langkau') + '</button></div></div>';
      el.querySelectorAll('[data-s]').forEach(b => b.addEventListener('click', () => { run.comment = $('t-comment').value; run.survey[+b.dataset.s] = +b.dataset.v; render(); }));
      $('t-send').addEventListener('click', () => {
        const comment = $('t-comment').value.trim().slice(0, 500);
        record({ test: 'survey', answers: JSON.stringify({ likert: SURVEY.map((_, j) => run.survey[j]), comment }), max: 5 });
        run.stage = 'done'; render();
      });
      $('t-noskip').addEventListener('click', () => { run.stage = 'done'; render(); });
      return;
    }

    // done
    const pre = tests().filter(r => r.test === 'pre' && !r.skipped)[0], post = lastOf('post');
    el.innerHTML = '<div class="card"><div class="badge">' + T('Submitted ✓', 'Dihantar ✓') + '</div>' +
      (run.kind === 'pre'
        ? '<h1>' + T('Thank you! Now go and <span class="script">play</span>', 'Terima kasih! Sekarang jom <span class="script">bermain</span>') + '</h1><p>' +
          T('Your answers are saved. After you’ve played, a post-test will show how much you learned.', 'Jawapan anda telah disimpan. Selepas bermain, ujian pasca akan menunjukkan berapa banyak yang anda pelajari.') + '</p>'
        : '<h1>' + T('Look how far you <span class="script">came</span>', 'Lihat kemajuan <span class="script">anda</span>') + '</h1>' +
          '<div class="player" style="margin-top:14px;">' + (pre ? '<div class="kpi"><b>' + pre.score + ' / ' + pre.max + '</b><span>' + T('before', 'sebelum') + '</span></div>' : '') +
          '<div class="kpi"><b>' + post.score + ' / ' + post.max + '</b><span>' + T('after', 'selepas') + '</span></div></div>' +
          '<p>' + T('Thank you for taking part.', 'Terima kasih kerana mengambil bahagian.') + '</p>') +
      '<button class="btn" id="t-done">' + (run.then ? T('Start playing', 'Mula bermain') : T('Back to map', 'Kembali ke peta')) + '</button></div>';
    $('t-done').addEventListener('click', finish);
  }

  function submit() {
    const it = run.items, marks = it.map((x, j) => String(run.ans[j] == null ? '' : run.ans[j]).trim() === x.ans ? '1' : '0');
    const score = marks.filter(m => m === '1').length;
    record({
      test: run.kind, form: run.form, score, max: it.length,
      answers: JSON.stringify(it.map((_, j) => run.ans[j] == null ? '' : String(run.ans[j]))),
      correct_items: marks.join(''), time_s: Math.round((Date.now() - run.t0) / 1000)
    });
    const played = Object.keys(st.best).length > 0;
    run.stage = run.kind === 'post' && played ? 'survey' : 'done';
    run.survey = {};
    render();
  }

  function finish() {
    const then = run && run.then;
    run = null;
    if (then) then(); else { renderMap(); show('map'); }
  }

  /* ============================================================
     The card under the worlds on the map
     ============================================================ */
  function card() {
    const pre = tests().filter(r => r.test === 'pre' && !r.skipped)[0], post = lastOf('post');
    const c = cleared();
    const preRow = pre ? '<span class="pill done">' + T('Submitted ✓', 'Dihantar ✓') + '</span>'
      : preOpen() ? '<button class="btn sm" data-test="pre">' + T('Start', 'Mula') + '</button>'
        : '<span class="pill lock">' + T('Closed — you’ve started playing', 'Ditutup — anda sudah mula bermain') + '</span>';
    let postRow;
    if (post) postRow = '<span class="pill done">' + T('Submitted ✓', 'Dihantar ✓') + '</span>';
    else if (postOpen()) postRow = '<button class="btn sm pulse" data-test="post">' + T('Start', 'Mula') + '</button>';
    else if (c < POST_AFTER_LEVELS) postRow = '<span class="pill lock">' + T('Clear ' + POST_AFTER_LEVELS + ' levels to unlock · ' + c + ' / ' + POST_AFTER_LEVELS, 'Selesaikan ' + POST_AFTER_LEVELS + ' tahap untuk buka · ' + c + ' / ' + POST_AFTER_LEVELS) + '</span>';
    else postRow = '<span class="pill lock">' + T('Submit your results first (My progress)', 'Hantar keputusan anda dahulu (Kemajuan saya)') + '</span>';
    return '<div class="world testcard"><div class="n" style="background:var(--green)">✎</div>' +
      '<h3>' + T('Before &amp; after test', 'Ujian sebelum &amp; selepas') + '</h3>' +
      '<div class="topic">' + T('10 questions before you play, 10 after — to see what you learned.', '10 soalan sebelum bermain, 10 selepas — untuk melihat apa yang anda pelajari.') + '</div>' +
      '<div class="trow"><span>' + T('Pre-test', 'Ujian pra') + '</span>' + preRow + '</div>' +
      '<div class="trow"><span>' + T('Post-test', 'Ujian pasca') + '</span>' + postRow + '</div></div>';
  }

  /** A banner for the top of the map — only when a test is waiting. */
  function banner() {
    if (preOpen()) {
      return '<div class="test-banner"><div><div class="kicker">' + T('BEFORE YOU START', 'SEBELUM ANDA MULA') + '</div><h2>' + T('Take the pre-test', 'Jawab ujian pra') + '</h2><p>' +
        T('10 quick questions, about 5 minutes. It shows what you know now — it isn’t marked for your grade.', '10 soalan ringkas, kira-kira 5 minit. Ia menunjukkan apa yang anda tahu sekarang — tidak dikira untuk gred anda.') +
        '</p></div><button class="btn" data-test="pre">' + T('Start the pre-test →', 'Mula ujian pra →') + '</button></div>';
    }
    if (postOpen()) {
      return '<div class="test-banner post"><div><div class="kicker">' + T('YOUR POST-TEST IS READY', 'UJIAN PASCA ANDA SEDIA') + '</div><h2>' + T('Finished playing? See how much you learned', 'Sudah selesai bermain? Lihat berapa banyak yang anda pelajari') + '</h2><p>' +
        T('Take it when you have <b>finished playing</b> — you only get one try. Still want to play more worlds? Go ahead; it will stay here.', 'Jawab apabila anda sudah <b>selesai bermain</b> — anda hanya ada satu cubaan. Masih mahu main dunia lain? Teruskan; ia akan kekal di sini.') +
        '</p></div><button class="btn" data-test="post">' + T('Start the post-test →', 'Mula ujian pasca →') + '</button></div>';
    }
    return '';
  }

  /** Called when a level is tapped: the pre-test comes first, once. */
  function gate(startLevel) {
    if (!needPre()) return false;
    start('pre', startLevel);
    return true;
  }

  /** ?test=pre / ?test=post — open that test straight away (control class). */
  function fromUrl() {
    const k = new URLSearchParams(location.search).get('test');
    if (k === 'pre' && !preTaken()) { start('pre'); return true; }
    if (k === 'post' && !postTaken()) { start('post'); return true; }
    return false;
  }

  const api = { start, render, card, banner, gate, fromUrl, needPre, postOpen, FORMS, SLOTS, SURVEY, POST_AFTER_LEVELS };
  root.GQT = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
