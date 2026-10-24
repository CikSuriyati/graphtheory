/**
 * GRAPH QUEST — Lives (hearts)
 * ------------------------------------------------------------------
 * Survive the journey: every stop (level) starts with 5 hearts and each
 * wrong answer costs one. At 0 hearts the player takes a Rest stop: the
 * Learn explanation opens, 3 hearts come back and they carry on with the
 * same question. Nothing is lost except that this stop pays 70% of its XP.
 * Hints, Learn and a valid-but-not-shortest route cost no heart.
 * The Boss Level shares 3 hearts across its missions.
 *
 * Off unless switched on for this device with ?lives=on (and off again with
 * ?lives=off), so classes without lives play exactly as before.
 *
 * Every attempt row gets hearts_left, fell, lives_on and game_version, so
 * pilot data (v1, no lives) and later data stay apart.
 *
 * Loaded before the main script; uses the shell's helpers (T, $, current)
 * only when called. The shell calls LIVES.begin, onAttempt, adjustParts
 * and render.
 */
(function (root) {
  'use strict';

  const VERSION = '2';
  const PER_STOP = 5, BOSS = 3, AFTER_REST = 3, XP_SHARE = 0.7;
  const PLAY_SCREENS = ['level', 'case', 'play'];
  const LEARN_BTN = { 1: 'w1-learn', 2: 'c-learn', 3: 'btn-learn', 4: 'w4-learn', 5: 'w5-learn', 6: 'w6-learn' };
  const ON_KEY = 'gq_lives_on', STATE_KEY = 'gq_lives_state';

  const read = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } };

  /* The switch: a link with ?lives=on / ?lives=off sets it for this device. */
  let on = read(ON_KEY, false);
  try {
    const q = new URLSearchParams(location.search).get('lives');
    if (q === 'on' || q === 'off') { on = q === 'on'; write(ON_KEY, on); }
  } catch (e) { }

  /* key: the stop being played ('2-3', or 'boss' for all Boss missions).
     done: that stop was cleared, so the next attempt starts fresh.
     fell: a rest stop happened on this stop (XP is capped).
     restLearn: Learn was opened by the rest stop, so it costs no XP. */
  let s = Object.assign({ key: '', hearts: PER_STOP, done: true, fell: false, restLearn: false }, read(STATE_KEY, {}));
  const save = () => write(STATE_KEY, s);

  const keyOf = (w, level) => w === 7 ? 'boss' : w + '-' + level;
  const fullFor = key => key === 'boss' ? BOSS : PER_STOP;

  function fresh(key) {
    s = { key, hearts: fullFor(key), done: false, fell: false, restLearn: false };
    save();
  }

  /** A level is opening from the map (or a world's own Next button). */
  function begin(w, level) {
    if (!on) return;
    const key = keyOf(w, level);
    // Boss missions share one pool: only mission 1 (or a cleared pool) refills it.
    if (key === 'boss' && s.key === 'boss' && !s.done && level > 1) { render(); return; }
    fresh(key);
    render();
  }

  /** Called for every attempt row before it is stored. Adds the lives fields. */
  function onAttempt(row) {
    row.game_version = VERSION;
    row.lives_on = on;
    if (!on) { row.hearts_left = ''; row.fell = false; return; }
    const key = keyOf(row.world, row.level);
    if (key !== s.key || (s.done && key !== 'boss')) fresh(key);
    let fell = false;
    if (row.correct === false) {
      s.hearts -= 1;
      if (s.hearts <= 0) { fell = true; s.fell = true; s.hearts = AFTER_REST; }
      lost(fell);
    } else if (row.score_xp > 0 && row.optimal !== false) {
      // a cleared stop (finishLevel logs it); boss pool stays until mission 5
      s.done = key !== 'boss' || row.level >= 5;
      if (key === 'boss') { s.fell = false; s.restLearn = false; }   // the cap applies to one mission only
    }
    row.hearts_left = s.hearts;
    row.fell = fell;
    save();
    render();
    if (fell) setTimeout(restStop, 650);
  }

  /** XP for a stop with a rest stop is 70%; Learn opened by a rest stop is free. */
  function adjustParts(w, i, parts) {
    if (!on || s.key !== keyOf(w, i + 1) || !s.fell) return parts;
    let out = parts;
    if (s.restLearn) out = out.filter(p => p[0] !== 'learn');
    const total = out.reduce((a, p) => a + p[2], 0);
    const cut = Math.round(total * (1 - XP_SHARE));
    if (cut > 0) out = out.concat([['rest', T('Rest stop · 70% of this stop’s XP', 'Hentian rehat · 70% XP hentian ini'), -cut]]);
    return out;
  }

  /* ---------------- display ---------------- */
  let box = null, lastHearts = null, resting = false;
  function ensure() {
    if (box) return box;
    const css = document.createElement('style');
    css.textContent =
      '#lives{position:fixed;top:calc(env(safe-area-inset-top,0px) + 76px);right:max(14px,env(safe-area-inset-right,0px));z-index:40;' +
      'display:flex;align-items:center;gap:6px;background:#fff;border:2px solid var(--ink,#17130c);border-radius:999px;padding:6px 12px;' +
      'box-shadow:0 3px 0 var(--ink,#17130c);font:700 13px "DM Sans",sans-serif;color:var(--ink,#17130c)}' +
      '#lives.hidden{display:none}' +
      '#lives .h{width:20px;height:18px;display:inline-block}' +
      '#lives .h path{fill:#e2483d;stroke:var(--ink,#17130c);stroke-width:1.6}' +
      '#lives .h.off path{fill:#f1ebe2}' +
      '#lives .h.lost{animation:gq-break .6s ease-out}' +
      '#lives.low{border-color:var(--orange,#ee6c34);box-shadow:0 3px 0 var(--orange,#ee6c34)}' +
      '@keyframes gq-break{0%{transform:scale(1.35) rotate(-8deg)}40%{transform:scale(.8) rotate(10deg)}100%{transform:none}}' +
      '#lives.shake{animation:gq-shake .45s}' +
      '@keyframes gq-shake{20%{transform:translateX(-5px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}' +
      '#gq-rest{position:fixed;inset:0;z-index:60;background:rgba(23,19,12,.45);display:flex;align-items:center;justify-content:center;padding:16px}' +
      '#gq-rest .card{max-width:420px;width:100%;background:#fff7e4;border:2px solid var(--ink,#17130c);border-radius:18px;box-shadow:0 5px 0 var(--ink,#17130c);padding:22px 22px 18px;text-align:center}' +
      '#gq-rest .fire{font-size:46px;line-height:1;animation:gq-flicker 1.2s infinite alternate}' +
      '#gq-rest h2{font:900 26px Fraunces,Georgia,serif;margin:8px 0 6px}' +
      '#gq-rest p{margin:0 0 14px;font-size:15.5px;line-height:1.5}' +
      '@keyframes gq-flicker{from{transform:scale(1) rotate(-2deg)}to{transform:scale(1.08) rotate(2deg)}}' +
      '@media (prefers-reduced-motion:reduce){#lives .h.lost,#lives.shake,#gq-rest .fire{animation:none}}';
    document.head.appendChild(css);
    box = document.createElement('div');
    box.id = 'lives'; box.className = 'hidden';
    box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite');
    document.body.appendChild(box);
    return box;
  }

  const HEART = '<path d="M10 16.5C4 12 1.5 9 1.5 5.8 1.5 3.4 3.4 1.6 5.6 1.6c1.8 0 3.3 1 4.4 2.6 1.1-1.6 2.6-2.6 4.4-2.6 2.2 0 4.1 1.8 4.1 4.2 0 3.2-2.5 6.2-8.5 10.7z"/>';

  function render() {
    const b = ensure();
    const scr = typeof current === 'string' ? current : '';
    if (!on || !PLAY_SCREENS.includes(scr)) { b.className = 'hidden'; return; }
    const full = s.key ? fullFor(s.key) : PER_STOP;
    const n = resting ? 0 : s.done ? full : s.hearts;
    let html = '';
    for (let i = 0; i < full; i++) {
      const lostNow = lastHearts !== null && i >= n && i < lastHearts;
      html += '<svg class="h' + (i < n ? '' : ' off') + (lostNow ? ' lost' : '') + '" viewBox="0 0 20 18" aria-hidden="true">' + HEART + '</svg>';
    }
    b.innerHTML = html + '<span class="sr-only" style="position:absolute;left:-9999px">' +
      T(n + ' of ' + full + ' hearts left', n + ' daripada ' + full + ' nyawa tinggal') + '</span>';
    b.className = n <= 2 ? 'low' : '';
    lastHearts = n;
  }

  function lost(fell) {
    const b = ensure();
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    if (fell) resting = true;
  }

  /** Out of hearts: a calm card, then Learn opens and 3 hearts come back. */
  function restStop() {
    if (document.getElementById('gq-rest')) return;
    const w = s.key === 'boss' ? 7 : +s.key.split('-')[0];
    const learnBtn = LEARN_BTN[w] && document.getElementById(LEARN_BTN[w]);
    const canLearn = !!(learnBtn && !learnBtn.disabled);
    const wrap = document.createElement('div');
    wrap.id = 'gq-rest';
    wrap.innerHTML = '<div class="card" role="dialog" aria-modal="true" aria-labelledby="gq-rest-h">' +
      '<div class="fire" aria-hidden="true">🔥</div>' +
      '<h2 id="gq-rest-h">' + T('Rest stop', 'Hentian rehat') + '</h2>' +
      '<p>' + (!canLearn
        ? T('Out of hearts. Take a breath, look at the map again, and carry on with ' + AFTER_REST + ' hearts.' + (w === 7 ? ' This mission now gives 70% of its XP.' : ' This stop now gives 70% of its XP.'),
          'Nyawa habis. Tarik nafas, lihat peta sekali lagi, dan teruskan dengan ' + AFTER_REST + ' nyawa.' + (w === 7 ? ' Misi ini kini memberi 70% XP.' : ' Hentian ini kini memberi 70% XP.'))
        : T('Out of hearts on this stop. Sit by the fire and read the idea. You carry on with the same question and ' + AFTER_REST + ' hearts. This stop now gives 70% of its XP.',
          'Nyawa habis di hentian ini. Duduk di tepi unggun dan baca ideanya. Anda teruskan soalan yang sama dengan ' + AFTER_REST + ' nyawa. Hentian ini kini memberi 70% XP.')) + '</p>' +
      '<button class="btn" id="gq-rest-go">' + (!canLearn ? T('Carry on', 'Teruskan') : T('Read the idea and carry on', 'Baca idea dan teruskan')) + '</button></div>';
    document.body.appendChild(wrap);
    const go = document.getElementById('gq-rest-go');
    go.focus();
    const close = () => {
      wrap.remove();
      if (canLearn && !learnBtn.disabled) { s.restLearn = true; save(); learnBtn.click(); }
      resting = false; lastHearts = null; render();
    };
    go.addEventListener('click', close);
    wrap.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  root.LIVES = { begin, onAttempt, adjustParts, render, isOn: () => on };
})(window);
