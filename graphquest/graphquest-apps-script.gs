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
 *   - No names are stored. student_code is class code + register number.
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

var MAX_ROWS_PER_POST = 500;


/* ==================================================================
   ENTRY POINTS
   ================================================================== */

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'rows') return json({ ok: true, message: 'GRAPH QUEST collector is running.' });

  // ---- teacher dashboard: every attempt row, only with the teacher key ----
  if (!TEACHER_KEY || TEACHER_KEY === 'CHANGE_ME') {
    return json({ ok: false, code: 'NO_KEY', error: 'Set TEACHER_KEY in the Apps Script, then deploy a new version.' });
  }
  if (String(p.key || '') !== TEACHER_KEY) return json({ ok: false, code: 'BAD_KEY', error: 'That teacher key is not right.' });

  var sheet = getSheet(), last = sheet.getLastRow();
  if (last < 2) return json({ ok: true, rows: [] });
  var head = sheet.getRange(1, 1, 1, RECEIVED_COL).getValues()[0];
  var rows = sheet.getRange(2, 1, last - 1, RECEIVED_COL).getValues().map(function (r) {
    var o = {};
    head.forEach(function (h, i) { o[h] = (r[i] instanceof Date) ? r[i].toISOString() : r[i]; });
    return o;
  });
  return json({ ok: true, rows: rows });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);

    if (!e || !e.postData || !e.postData.contents) return json({ ok: false, error: 'No data received.' });

    var body = JSON.parse(e.postData.contents);
    var rows = body.rows;
    if (!Array.isArray(rows) || !rows.length) return json({ ok: false, error: 'No attempts in the submission.' });
    if (rows.length > MAX_ROWS_PER_POST) return json({ ok: false, error: 'Too many attempts in one submission.' });

    for (var i = 0; i < rows.length; i++) {
      var problem = checkRow(rows[i]);
      if (problem) return json({ ok: false, error: 'Attempt ' + (i + 1) + ': ' + problem });
    }

    var sheet = getSheet();
    var known = knownIds(sheet);
    var now = new Date();
    var out = [];

    rows.forEach(function (r) {
      var id = String(r.attempt_id);
      if (known[id]) return;                   // already stored — skip, don't duplicate
      known[id] = true;
      var line = FIELDS.map(function (f) { return r[f] === undefined ? '' : r[f]; });
      line.push(now);
      out.push(line);
    });

    if (out.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, out.length, RECEIVED_COL).setValues(out);
    }
    return json({ ok: true, received: rows.length, added: out.length, skipped: rows.length - out.length });

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
  if (!/^[A-Z0-9]+-\d{1,3}$/.test(String(r.student_code || ''))) return 'bad student_code.';
  if (!isInt(r.world, 1, 6)) return 'bad world.';
  if (!isInt(r.level, 1, 5)) return 'bad level.';
  if (typeof r.correct !== 'boolean' || typeof r.optimal !== 'boolean') return 'correct/optimal must be true or false.';
  if (!isInt(r.score_xp, -20, 100)) return 'bad score_xp.';
  if (!isInt(r.hints_used, 0, 99) || !isInt(r.learn_used, 0, 99)) return 'bad hint counts.';
  if (!isInt(r.time_s, 0, 86400)) return 'bad time_s.';
  if (String(r.mistake_tag || '').length > 60 || String(r.boss_tool_choice || '').length > 60) return 'tag too long.';
  return '';
}

function isInt(v, lo, hi) { return typeof v === 'number' && v === Math.round(v) && v >= lo && v <= hi; }


/* ==================================================================
   HELPERS
   ================================================================== */

function knownIds(sheet) {
  var out = {}, last = sheet.getLastRow();
  if (last < 2) return out;
  sheet.getRange(2, 1, last - 1, 1).getValues().forEach(function (r) { out[String(r[0])] = true; });
  return out;
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || setupSheet();
}

/** Run this once from the editor to create the sheet and header row. */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(FIELDS.concat(['received']));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, RECEIVED_COL).setFontWeight('bold');
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
  bad({ student_code: 'Ali' }, 'a name as student_code');
  bad({ attempt_id: '' }, 'missing id');

  Logger.log('All tests passed. %s fields per attempt.', FIELDS.length);
  return 'OK';
}
