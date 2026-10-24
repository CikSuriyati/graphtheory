/**
 * GRAPH QUEST collector — Google Apps Script backend
 * ------------------------------------------------------------------
 * Students press "Submit results" on the My Progress page. The game
 * sends every attempt not yet sent, and this script appends ONE ROW
 * PER ATTEMPT to the "Attempts" tab. That flat sheet is what the
 * teacher dashboard reads, and it opens directly in Excel or SPSS.
 *
 * Behaviour:
 *   - Every row carries an attempt_id made on the student's device.
 *     A row whose attempt_id is already in the sheet is skipped, so a
 *     student pressing Submit twice (or a flaky connection retrying)
 *     never creates duplicates.
 *   - Rows are validated field by field; a bad row rejects the whole
 *     batch with a message, rather than half-writing it.
 *   - Lives (hearts, v2 of the game): each row also carries hearts_left,
 *     fell, lives_on and game_version, written after the group column.
 *     Rows from older phones simply leave them empty.
 *   - The Classes tab switches lives on or off per class; the game asks
 *     with ?action=config&class=… when a student joins or opens it.
 *   - student_code is class code + the student's name or register number
 *     (e.g. 4S1-17 or 4S1-AINA SOFEA). group is the student's kumpulan
 *     (e.g. 1 or MELUR); it decides the team on the class board.
 *
 * SETUP
 *   1. Open a Google Sheet > Extensions > Apps Script
 *   2. Replace Code.gs with this file, Save
 *   3. Run  setupSheet  once (authorise when prompted)
 *   4. Run  testCollector  once — it should log "All tests passed"
 *   5. Deploy > New deployment > Web app
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   6. Copy the /exec URL into ENDPOINT in graphquest/index.html
 *
 * IMPORTANT: after ANY edit to this file you must
 *   Deploy > Manage deployments > (pencil) > Version: New version > Deploy
 * or the live URL keeps serving the old code.
 */

var SHEET_NAME = 'Attempts';

/* The teacher dashboard reads the sheet with ?action=rows&key=… — only with
   this key. Change it to your own long random phrase before deploying, and
   never commit your real key. Students never need it. */
var TEACHER_KEY = 'CHANGE_ME';

var FIELDS = [
  'attempt_id', 'timestamp', 'class_code', 'student_code', 'world', 'level',
  'correct', 'optimal', 'score_xp', 'hints_used', 'learn_used', 'time_s',
  'mistake_tag', 'boss_tool_choice'
];
var RECEIVED_COL = FIELDS.length + 1;          // server time, added by this script
/* The group column comes after 'received', so sheets made before it existed
   keep every old column where it was. Old rows simply have no group. */
var GROUP_COL = RECEIVED_COL + 1;
/* Lives columns (game v2) come after 'group' for the same reason. */
var LIVES_FIELDS = ['hearts_left', 'fell', 'lives_on', 'game_version'];
var LAST_COL = GROUP_COL + LIVES_FIELDS.length;

/* Pre-test, post-test and survey rows go to their own tab. */
var TESTS_SHEET = 'Tests';
var TEST_FIELDS = [
  'test_id', 'timestamp', 'class_code', 'student_code', 'test', 'form', 'score', 'max',
  'answers', 'correct_items', 'time_s', 'levels_cleared', 'skipped'
];
var TEST_RECEIVED_COL = TEST_FIELDS.length + 1;
var TEST_GROUP_COL = TEST_RECEIVED_COL + 1;

/* Class leaderboard teams. A student's team is the group (kumpulan) they
   typed when joining; a student who left it empty plays alone and appears
   only in the players list. To set or override a team, add rows to the
   Teams tab: student_code (e.g. 4S1-17) | team (any name). */
var TEAMS_SHEET = 'Teams';

/* Lives per class. Classes tab: class_code | lives (on / off). A class that
   is not listed plays without lives, unless a test link (?lives=on) is used
   on that device. A class listed here always wins over a test link. */
var CLASSES_SHEET = 'Classes';

var MAX_ROWS_PER_POST = 500;


/* ==================================================================
   ENTRY POINTS
   ================================================================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'board') return json(board(String(p['class'] || '').toUpperCase()));
  if (p.action === 'config') return json(config(String(p['class'] || '').toUpperCase()));
  if (p.action !== 'rows') return json({ ok: true, message: 'GRAPH QUEST collector is running.' });

  // ---- teacher dashboard: every attempt row, only with the teacher key ----
  if (!TEACHER_KEY || TEACHER_KEY === 'CHANGE_ME') {
    return json({ ok: false, code: 'NO_KEY', error: 'Set TEACHER_KEY in the Apps Script, then deploy a new version.' });
  }
  if (String(p.key || '') !== TEACHER_KEY) return json({ ok: false, code: 'BAD_KEY', error: 'That teacher key is not right.' });

  return json({ ok: true, rows: readTab(getSheet(), LAST_COL), tests: readTab(getTestsSheet(), TEST_GROUP_COL), teams: teamMap() });
}

/* ==================================================================
   CLASS BOARD — this week's XP, per student and per team, one class only.
   Weekly XP = for each level, the best score received since Monday 00:00.
   Only codes and XP leave the sheet; no key needed (the class code scopes it).
   ================================================================== */

function board(cls) {
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(cls)) return { ok: false, error: 'Unknown class code.' };
  var since = weekStart();
  var rows = readTab(getSheet(), GROUP_COL).filter(function (r) { return String(r.class_code) === cls; });
  var best = {}, everyone = {}, groupOf = {};
  rows.forEach(function (r) {
    var s = String(r.student_code);
    everyone[s] = true;
    if (String(r.group || '').trim()) groupOf[s] = String(r.group).trim();   // rows are in order, so the latest group wins
    if (!(new Date(r.received) >= since)) return;
    var k = r.world + '-' + r.level, b = best[s] || (best[s] = {});
    b[k] = Math.max(b[k] || 0, Number(r.score_xp) || 0);
  });
  var teamOf = teamMap();
  var students = Object.keys(everyone).map(function (s) {
    var xp = 0, b = best[s] || {};
    Object.keys(b).forEach(function (k) { xp += b[k]; });
    return { code: s, xp: xp, team: teamOf[s] || groupOf[s] || '' };        // '' = playing alone
  }).sort(function (a, b) { return b.xp - a.xp; });
  var teams = {};
  students.forEach(function (s) {
    if (!s.team) return;
    var t = teams[s.team] || (teams[s.team] = { team: s.team, total: 0, members: [] });
    t.total += s.xp; t.members.push({ code: s.code, xp: s.xp });
  });
  var list = Object.keys(teams).map(function (k) {
    var t = teams[k]; t.xp = Math.round(t.total / t.members.length); return t;   // average, so team size doesn't matter
  }).sort(function (a, b) { return b.xp - a.xp; });
  return { ok: true, week_start: since.toISOString(), students: students, teams: list };
}

/* ==================================================================
   CLASS CONFIG — whether this class plays with lives. No key needed:
   it returns only the setting.
   ================================================================== */

function config(cls) {
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(cls)) return { ok: false, error: 'Unknown class code.' };
  return { ok: true, lives: classLives(cls) };
}

/** 'on', 'off', or '' when the class is not in the Classes tab. */
function classLives(cls) {
  var out = '';
  readTab(getClassesSheet(), 2).forEach(function (r) {
    if (String(r.class_code || '').trim().toUpperCase() === cls) out = livesValue(r.lives);
  });
  return out;
}

/** Accepts on/off, yes/no, true/false, 1/0 (any case); anything else counts as not set. */
function livesValue(v) {
  var s = String(v === undefined || v === null ? '' : v).trim().toLowerCase();
  if (['on', 'yes', 'true', '1', 'ya'].indexOf(s) >= 0) return 'on';
  if (['off', 'no', 'false', '0', 'tidak'].indexOf(s) >= 0) return 'off';
  return '';
}

function getClassesSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(CLASSES_SHEET) || ss.insertSheet(CLASSES_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['class_code', 'lives']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sh;
}

function weekStart() {
  var d = new Date(), day = (d.getDay() + 6) % 7;            // Monday = 0
  d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day);
  return d;
}

function teamMap() {
  var out = {};
  readTab(getTeamsSheet(), 2).forEach(function (r) {
    var s = String(r.student_code || '').trim().toUpperCase(), t = String(r.team || '').trim();
    if (s && t) out[s] = t;
  });
  return out;
}

function getTeamsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TEAMS_SHEET) || ss.insertSheet(TEAMS_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['student_code', 'team']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
  }
  return sh;
}

function readTab(sheet, cols) {
  var last = sheet.getLastRow();
  if (last < 2) return [];
  var head = sheet.getRange(1, 1, 1, cols).getValues()[0].map(function (h, i) { return h || ('col' + (i + 1)); });
  return sheet.getRange(2, 1, last - 1, cols).getValues().map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = (r[i] instanceof Date) ? r[i].toISOString() : r[i]; });
    return o;
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);

    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, error: 'No data received.' });

    var body = JSON.parse(e.postData.contents);
    var rows = Array.isArray(body.rows) ? body.rows : [];
    var tests = Array.isArray(body.tests) ? body.tests : [];
    if (!rows.length && !tests.length) return json({ ok: false, error: 'Nothing in the submission.' });
    if (rows.length + tests.length > MAX_ROWS_PER_POST) return json({ ok: false, error: 'Too many rows in one submission.' });

    for (var i = 0; i < rows.length; i++) {
      var problem = checkRow(rows[i]);
      if (problem) return json({ ok: false, error: 'Attempt ' + (i + 1) + ': ' + problem });
    }
    for (var j = 0; j < tests.length; j++) {
      var tp = checkTest(tests[j]);
      if (tp) return json({ ok: false, error: 'Test ' + (j + 1) + ': ' + tp });
    }
    var testsAdded = appendNew(getTestsSheet(), tests, TEST_FIELDS, 'test_id');

    var sheet = getSheet();
    var known = knownIds(sheet);
    var now = new Date();
    var out = [];

    rows.forEach(function (r) {
      var id = String(r.attempt_id);
      if (known[id]) return;                   // already stored — skip, don't duplicate
      known[id] = true;
      var line = FIELDS.map(function (f) { return r[f] === undefined ? '' : r[f]; });
      line.push(now, r.group || '');
      LIVES_FIELDS.forEach(function (f) { line.push(r[f] === undefined ? '' : r[f]); });
      out.push(line);
    });

    if (out.length) {
      ensureGroupHeader(sheet, GROUP_COL);
      ensureLivesHeaders(sheet);
      sheet.getRange(sheet.getLastRow() + 1, 1, out.length, LAST_COL).setValues(out);
    }
    return json({ ok: true, received: rows.length, added: out.length, skipped: rows.length - out.length,
                  testsReceived: tests.length, testsAdded: testsAdded });

  } catch (err) {
    return json({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


/* ==================================================================
   VALIDATION
   ================================================================== */

function checkRow(r) {
  if (!r || typeof r !== 'object') return 'not an object.';
  if (!/^[a-z0-9]+-[a-z0-9]+$/i.test(String(r.attempt_id || ''))) return 'missing attempt_id.';
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(String(r.class_code || ''))) return 'bad class_code.';
  if (!okStudent(r.student_code)) return 'bad student_code.';
  if (!okGroup(r.group)) return 'bad group.';
  if (!isInt(r.world, 1, 7)) return 'bad world.';          // 7 = the Boss Level
  if (!isInt(r.level, 1, 5)) return 'bad level.';
  if (typeof r.correct !== 'boolean' || typeof r.optimal !== 'boolean') return 'correct/optimal must be true or false.';
  if (!isInt(r.score_xp, -20, 100)) return 'bad score_xp.';
  if (!isInt(r.hints_used, 0, 99) || !isInt(r.learn_used, 0, 99)) return 'bad hint counts.';
  if (!isInt(r.time_s, 0, 86400)) return 'bad time_s.';
  if (String(r.mistake_tag || '').length > 60 || String(r.boss_tool_choice || '').length > 60) return 'tag too long.';
  // lives fields are optional: phones on the older game don't send them
  if (r.hearts_left !== undefined && r.hearts_left !== '' && !isInt(r.hearts_left, 0, 5)) return 'bad hearts_left.';
  if (r.fell !== undefined && typeof r.fell !== 'boolean') return 'fell must be true or false.';
  if (r.lives_on !== undefined && typeof r.lives_on !== 'boolean') return 'lives_on must be true or false.';
  if (r.game_version !== undefined && r.game_version !== '' && !/^[0-9]{1,3}$/.test(String(r.game_version))) return 'bad game_version.';
  return '';
}

function checkTest(r) {
  if (!r || typeof r !== 'object') return 'not an object.';
  if (!/^t[a-z0-9]+-[a-z0-9]+$/i.test(String(r.test_id || ''))) return 'missing test_id.';
  if (!/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(String(r.class_code || ''))) return 'bad class_code.';
  if (!okStudent(r.student_code)) return 'bad student_code.';
  if (!okGroup(r.group)) return 'bad group.';
  if (['pre', 'post', 'survey'].indexOf(r.test) < 0) return 'test must be pre, post or survey.';
  if (['A', 'B', ''].indexOf(r.form) < 0) return 'bad form.';
  if (!isInt(r.score, 0, 50) || !isInt(r.max, 0, 50)) return 'bad score.';
  if (String(r.answers || '').length > 2000 || String(r.correct_items || '').length > 50) return 'answers too long.';
  if (!isInt(r.time_s, 0, 86400) || !isInt(r.levels_cleared, 0, 100)) return 'bad time or levels.';
  if (typeof r.skipped !== 'boolean') return 'skipped must be true or false.';
  return '';
}

/** Append rows whose id isn't in the tab yet; returns how many were added. */
function appendNew(sheet, list, fields, idField) {
  if (!list.length) return 0;
  var known = knownIds(sheet), now = new Date(), out = [];
  list.forEach(function (r) {
    var id = String(r[idField]);
    if (known[id]) return;
    known[id] = true;
    var line = fields.map(function (f) { return r[f] === undefined ? '' : r[f]; });
    line.push(now, r.group || '');
    out.push(line);
  });
  if (out.length) {
    ensureGroupHeader(sheet, fields.length + 2);
    sheet.getRange(sheet.getLastRow() + 1, 1, out.length, fields.length + 2).setValues(out);
  }
  return out.length;
}

/* Class part, a dash, then a register number or a name. Names start with a
   letter or digit, so nothing can start with = + @ and turn into a formula. */
var NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} .'@\/-]{0,39}$/u;
function okStudent(v) {
  var s = String(v || ''), i = s.indexOf('-');
  return i > 0 && /^[A-Z0-9]+$/.test(s.slice(0, i)) && NAME_RE.test(s.slice(i + 1));
}
/* Optional: rows from phones that haven't updated yet have no group. */
function okGroup(v) { return v === undefined || v === '' || (NAME_RE.test(String(v)) && String(v).length <= 20); }

function isInt(v, lo, hi) { return typeof v === 'number' && v === Math.round(v) && v >= lo && v <= hi; }


/* ==================================================================
   HELPERS
   ================================================================== */

/** Sheets made before the group column get its header the first time it's needed. */
function ensureGroupHeader(sheet, col) {
  var cell = sheet.getRange(1, col);
  if (cell.getValue() !== 'group') cell.setValue('group').setFontWeight('bold');
}

/** Sheets made before lives get those headers the first time they're needed. */
function ensureLivesHeaders(sheet) {
  var cells = sheet.getRange(1, GROUP_COL + 1, 1, LIVES_FIELDS.length), now = cells.getValues()[0];
  if (now.join('|') !== LIVES_FIELDS.join('|')) cells.setValues([LIVES_FIELDS]).setFontWeight('bold');
}

function knownIds(sheet) {
  var out = {}, last = sheet.getLastRow();
  if (last < 2) return out;
  sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { out[String(r[0])] = true; });
  return out;
}

function getTestsSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TESTS_SHEET) || ss.insertSheet(TESTS_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(TEST_FIELDS.concat(['received', 'group']));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, TEST_GROUP_COL).setFontWeight('bold');
  }
  return sh;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || setupSheet();
}

/** Run this once from the editor to create the Attempts, Tests, Teams and Classes tabs. */
function setupSheet() {
  getTestsSheet();
  getTeamsSheet();
  getClassesSheet();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(FIELDS.concat(['received', 'group'], LIVES_FIELDS));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, LAST_COL).setFontWeight('bold');
  }
  return sh;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


/* ==================================================================
   SELF-TEST — run from the editor, check the log. Writes nothing.
   ================================================================== */

function testCollector() {
  var good = {
    attempt_id: 'lx3k9a-abc12', timestamp: '2026-10-14 10:32', class_code: '4S1-2026', student_code: '4S1-17',
    world: 3, level: 2, correct: true, optimal: false, score_xp: 30, hints_used: 1, learn_used: 0,
    time_s: 48, mistake_tag: 'fewest_edges_not_shortest', boss_tool_choice: ''
  };
  if (checkRow(good)) throw new Error('Good row rejected: ' + checkRow(good));

  function bad(change, why) {
    var r = JSON.parse(JSON.stringify(good));
    for (var k in change) r[k] = change[k];
    if (!checkRow(r)) throw new Error('Bad row accepted: ' + why);
  }
  bad({ level: 6 }, 'level 6');
  bad({ world: 0 }, 'world 0');
  bad({ optimal: 'yes' }, 'string boolean');
  bad({ score_xp: 101 }, 'score over 100');
  bad({ student_code: 'Ali' }, 'a name with no class');
  bad({ student_code: '4S1-=HYPERLINK(1)' }, 'a formula as the name');
  bad({ group: '<b>' }, 'markup as the group');
  var named = JSON.parse(JSON.stringify(good)); named.student_code = '4S1-AINA SOFEA'; named.group = 'MELUR';
  if (checkRow(named)) throw new Error('Name and group rejected: ' + checkRow(named));
  var old = JSON.parse(JSON.stringify(good)); delete old.group;
  if (checkRow(old)) throw new Error('Row without a group rejected: ' + checkRow(old));
  bad({ attempt_id: '' }, 'missing id');

  // lives (game v2)
  var v2 = JSON.parse(JSON.stringify(good)); v2.hearts_left = 3; v2.fell = true; v2.lives_on = true; v2.game_version = '2';
  if (checkRow(v2)) throw new Error('Lives row rejected: ' + checkRow(v2));
  var off = JSON.parse(JSON.stringify(good)); off.hearts_left = ''; off.fell = false; off.lives_on = false; off.game_version = '2';
  if (checkRow(off)) throw new Error('Lives-off row rejected: ' + checkRow(off));
  bad({ hearts_left: 6 }, 'six hearts');
  bad({ hearts_left: -1 }, 'negative hearts');
  bad({ fell: 'yes' }, 'string fell');
  bad({ lives_on: 1 }, 'number lives_on');
  bad({ game_version: 'v2' }, 'version with a letter');
  [['on', 'on'], [' ON ', 'on'], ['yes', 'on'], [true, 'on'], [1, 'on'], ['Ya', 'on'],
   ['off', 'off'], ['No', 'off'], [false, 'off'], [0, 'off'], ['', ''], ['maybe', ''], [null, '']].forEach(function (c) {
    if (livesValue(c[0]) !== c[1]) throw new Error('livesValue(' + c[0] + ') gave ' + livesValue(c[0]) + ', expected ' + c[1]);
  });
  if (config('bad code!').ok) throw new Error('Bad class code accepted by config');

  var t = { test_id: 'tlx3k9a-abc12', timestamp: '2026-10-14 10:32', class_code: '4S1-2026', student_code: '4S1-17',
    test: 'pre', form: 'A', score: 6, max: 10, answers: '[\"3\"]', correct_items: '1101100110', time_s: 240, levels_cleared: 0, skipped: false };
  if (checkTest(t)) throw new Error('Good test row rejected: ' + checkTest(t));
  var bt = JSON.parse(JSON.stringify(t)); bt.test = 'mid';
  if (!checkTest(bt)) throw new Error('Bad test row accepted: test=mid');

  Logger.log('All tests passed. %s fields per attempt (+ received, group, %s lives), %s per test.', FIELDS.length, LIVES_FIELDS.length, TEST_FIELDS.length);
  return 'OK';
}
