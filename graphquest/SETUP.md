# GRAPH QUEST — setup

Six files, in `graphquest/`, plus a review sheet:

| File | What it is |
|---|---|
| `index.html` | The game shell (entry, world map, My progress, Discover) and World 3 |
| `world2.js` | World 2, Graph Detective |
| `teacher.html` | The teacher dashboard (Stage 3) — see *Teacher dashboard* below |
| `tests.js` | The pre-test, post-test and survey — see *Pre-test and post-test* below |
| `TEST-FORMS.md` | Both test forms written out with their answers, for review |
| `graph.js` | The graph engine: draws nothing, solves everything. Every puzzle is solved before it is shown |
| `graphquest-apps-script.gs` | The backend that saves results to your Google Sheet |

The game is live at `graphtheory.visuallymath.com/graphquest/` as soon as this folder is pushed. It works with no setup at all. Students play, and progress is saved on their device. The Sheet is only needed when you want results to reach you.

Takes about 10 minutes.

---

## What's built — Stages 1 and 2

Two worlds are playable. Worlds 1, 4, 5 and 6 show on the map as *Coming soon*.

### World 2 · Graph Detective (Stage 2)

*Case #007: The Missing Trophy.* School places are vertices, corridors are edges, and every clue is about degree.

| Level | What the student does | What it teaches |
|---|---|---|
| 1 · Count the corridors | Says how many corridors meet at 3 places | Vertex, edge, degree |
| 2 · Follow the suspect | Taps the place with degree 4, then 1, then 3 | Finding a vertex from its degree; degree 1 = a dead end |
| 3 · Loops and twin corridors | Finds the loop and the double corridor, then counts degrees there | A loop adds 2; multiple edges; simple graph |
| 4 · Three witnesses | Taps the one place that fits 3 clues (degree 2, next to the Surau, not next to the Library) | Combining degree and adjacency. Every clue is needed |
| 5 · Timed case | A new school map every time: one count, one find, one clue case | Generated and checked: every question has one answer |

**Discover:** students fill in the degree table for the Level 1 map and count the corridors (12 and 6). Then they pick the true statement. Only after that do they see the rule *sum of degrees = 2 × number of edges*, with a table showing it holds on every map they solved.

### World 3 · Shortest Path Race (Stage 1)

5 levels, feedback, hints, Learn, the quick check, XP, and the Discover screen.

| Level | Map | What it teaches |
|---|---|---|
| 1 · 4 towns | Temerloh → PPS Chenor | The shortest road out of the start (8 km) is not on the best route |
| 2 · 6 towns | Temerloh → PPS Jerantut | The 2-road route is 44 km; the best is 30 km with 3 roads |
| 3 · Road closed! | Temerloh → PPS Maran | A road floods after the first move, and the plan must change |
| 4 · Fastest, not shortest | Temerloh → PPS Triang | Two weights: the shortest route in km (42 km, 67 min) is not the fastest (43 min) |
| 5 · Random challenge | New map every time | Generated, solved and checked: one best route, and fewest roads ≠ shortest |

Distances are simplified for the game — they are not real road distances.

**Both languages throughout.** The BM / EN button is top right. It shares its setting with the GraphTheory tool, so a student who switched the tool to BM opens the game in BM too. Graph terms follow the tool: *bucu, sisi, darjah, pemberat, graf berpemberat, laluan terpendek, lorong*, plus *gelung, sisi berbilang, graf mudah* in World 2. New terms appear in both languages together (e.g. *pemberat · weight*).

---

## 1. Create the Sheet

Make a new Google Sheet. The script creates its own tab called **Attempts**.

## 2. Add the script

**Extensions → Apps Script**. Delete whatever is in `Code.gs`, paste the entire contents of `graphquest-apps-script.gs`, Save.

## 3. Run the two setup functions (creates the Attempts and Tests tabs)

Run **`setupSheet`**. Authorise when prompted — Google will warn the app "isn't verified," which is expected for your own script. **Advanced → Go to (project name) → Allow**.

Then run **`testCollector`**. The log should say *"All tests passed. 14 fields per attempt."* It writes nothing to the sheet.

## 4. Deploy as a web app

**Deploy → New deployment → gear icon → Web app.**

| Setting | Value |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

Copy the **Web app URL** (ends in `/exec`).

## 5. Wire up the game

In `graphquest/index.html`, near the top of the main `<script>` block:

```js
const ENDPOINT = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```

Replace with your `/exec` URL, commit, push.

## 6. Give students the class code

Students enter a **class code** (e.g. `4S1-2026`) and their **register number**. That becomes their student code, `4S1-17`. No names, no passwords.

Use one class code per class, and change the year each year so cohorts never mix.

---

## How results reach you

Progress lives on the student's device, so the game works offline in class. When they're ready, students open **My progress → Submit results**. Every attempt not yet sent goes to the Sheet in one go.

**One row per attempt**, wrong ones included. The wrong attempts are the useful data:

| Column | Example | Meaning |
|---|---|---|
| attempt_id | `lx3k9a-abc12` | Made on the device; stops duplicates |
| timestamp | `2026-10-14 10:32` | Device time when the attempt ended |
| class_code | `4S1-2026` | |
| student_code | `4S1-17` | Class + register number |
| world, level | `3`, `2` | |
| correct | `true` | Reached the PPS with a legal route |
| optimal | `false` | Was it the best route |
| score_xp | `30` | XP for this attempt |
| hints_used, learn_used | `1`, `0` | |
| time_s | `48` | Seconds since the level opened |
| mistake_tag | `fewest_edges_not_shortest` | What went wrong — see below |
| boss_tool_choice | | Empty until the Boss Level exists |
| received | | Server time, added by the script |

**Submitting twice is harmless.** A row whose `attempt_id` is already in the sheet is skipped.

### Mistake tags

| World | Tag | Means |
|---|---|---|
| 3 | `fewest_edges_not_shortest` | Chose the route with the fewest roads, when the best route has more |
| 3 | `chose_distance_not_time` | Level 4: found the shortest route in km instead of the fastest |
| 3 | `valid_not_optimal` | A legal route that simply wasn't the best |
| 2 | `miscounted_degree` | Gave the wrong degree for a place |
| 2 | `loop_counted_once` | Counted a loop as 1 instead of 2 |
| 2 | `multiple_edge_counted_once` | Counted two corridors between the same places as one |
| 2 | `wrong_vertex_for_degree` | Tapped a place with the wrong degree |
| 2 | `missed_loop` | Tapped something that isn't a loop |
| 2 | `missed_multiple_edge` | Tapped a corridor that has no twin |
| 2 | `clue_ignored` | Tapped a place that fails one of the clues |

In World 2 every wrong answer is its own row (`correct` false, 0 XP). Solving the case adds one row with the level's score.

These are what the dashboard will turn into *"Chose fewest roads, not shortest distance — 41% of attempts."*

---

## Scoring

| Part | XP | Earned by |
|---|---|---|
| Best route | 60 | Finding the best route (a valid, not-best route banks 30) |
| Quick check | 20 | The question after each level: *"the route with the fewest roads is… longer / my route / shorter?"* |
| No hint | 10 | No Hint or Learn used |
| Speed | 10 | Under the level's target time (45–120 s) |
| Learn | −10 | Learn shows every route added up, so it costs a little |
| Discover | +20 | Once per world, stating the rule before seeing the term |

Replaying keeps the **best** score. Mastery = the average of the best scores across the 5 levels, flagged under 70%.

---

## Teacher dashboard

`graphtheory.visuallymath.com/graphquest/teacher.html` (also linked as *For teachers* at the bottom of the game). It answers one question: **which idea should I reteach tomorrow, and to whom?**

It shows, for the class you pick:

- **Reteach tomorrow** — the level with the highest share of wrong answers, its most common mistake, a one-line teaching tip for that mistake, and the students to check in with
- **Mastery per world**, flagged under 70%, and the **most common mistakes** as a share of that world's attempts
- **Level by level** — how much of the class cleared each level, the wrong-answer rate, how many needed Hint or Learn, and the top mistake
- **Students needing support** — the lowest 5 by mastery in each world
- **Every student** — tap one for their attempt trail (✗ → ✗ → ✓) and mistakes, level by level
- **Pre-test and post-test** — filled in automatically from the in-game tests: means, mean gain, % improved and a paired t, for the students who played and for a control group that didn't. Also the difference in gain between the two groups, question-by-question results, and the survey. Paper tests instead? Open a CSV with columns `student_code, pre, post`

Everything is computed in the teacher's browser. Nothing is sent anywhere.

### Two ways to load results

**A. Connect to the Sheet (recommended).** The dashboard reads the Attempts and Tests tabs through the same Apps Script, but only with a teacher key. The Sheet stays private.

1. In the Apps Script, change `var TEACHER_KEY = 'CHANGE_ME';` to your own long random phrase (e.g. four unrelated words). Keep it out of GitHub — only your Apps Script copy holds the real key.
2. **Deploy → Manage deployments → pencil → Version: New version → Deploy.** The /exec link stays the same.
3. Open the dashboard, paste the /exec link (already filled in) and your key, and press **Load results**. The key is remembered on that device only, and **Reload** fetches the latest rows.

**B. Open CSV files.** In the Sheet, download each tab: on Attempts, then on Tests, **File → Download → Comma-separated values (.csv)**. Choose both files together on the dashboard. This needs no setup, and the file never leaves the device.

Don't use *File → Share → Publish to web* for this: it makes every row readable by anyone with the link.

---

## Pre-test and post-test

Built into the game, open to everyone, controlled only by the order of play. There is no switch to turn it on.

| | When it appears | What the student sees |
|---|---|---|
| **Pre-test** | On the *Before & after test* card, and automatically the first time a student taps a level | 10 questions, then *Submitted ✓* and *Start playing*. It can be skipped, and it closes once the student clears a level |
| **Post-test** | Once the student has cleared **5 levels** and pressed **Submit results** | 10 matched questions, then the 8-item survey and one open question, then *before x/10 → after y/10* |
| **Control class** | Give them `graphtheory.visuallymath.com/graphquest/?test=pre` and later `…?test=post` | The test straight away, no playing needed and no survey |

- **Two matched forms.** Odd register numbers take form A before and B after; even numbers take B then A. Item *n* tests the same idea on both. **Review them in `TEST-FORMS.md` before a class uses them.**
- **A test, not a game.** No hints, no feedback on answers, no XP, one attempt. The pre-test score isn't shown until after the post-test.
- **Sent straight away.** Test answers go to a new **Tests** tab in the Sheet when the student finishes, and again with *Submit results* if the first try failed.
- **The dashboard keeps the data honest.** It leaves out pre-tests taken after a student had already cleared a level, and says how many skipped, took only one test, or took the pre-test late.

The Tests tab has one row per test: `test_id, timestamp, class_code, student_code, test (pre / post / survey), form, score, max, answers, correct_items, time_s, levels_cleared, skipped, received`. `correct_items` is ten 1s and 0s, one per question, which makes item analysis in Excel or SPSS straightforward.

**Needs the updated Apps Script.** Until you paste in the new `graphquest-apps-script.gs` and deploy a new version, test answers wait safely on each student's device. They are sent the next time the student presses *Submit results* after the update.

---

## The one thing that trips everyone up

**After any edit to the Apps Script, redeploy as a new version.**

`Deploy → Manage deployments → pencil icon → Version: New version → Deploy`

---

## Troubleshooting

**"Results aren't connected yet"** — `ENDPOINT` still has the placeholder.

**"That didn't go through"** — deployment access isn't "Anyone", or the student is offline. Nothing is lost; they can submit again.

**A CORS error** — the POST must stay `Content-Type: text/plain`. That keeps it a simple request, so the browser skips the preflight check that Apps Script can't answer.

**Rows missing** — Apps Script editor → **Executions** shows the real error.

**Dashboard says "no teacher key yet"** — `TEACHER_KEY` is still `CHANGE_ME`, or you changed it but didn't deploy a new version.

**Dashboard can't reach the Apps Script** — the deployed version predates the dashboard. Deploy a new version (step 2 above).

**A student changed device** — progress doesn't move with them, but the Sheet still has everything they submitted.

---

## Next stages

2. ~~World 2 Graph Detective, and a combined *My progress* across worlds~~ — done
3. ~~The teacher dashboard page~~ — done. The pre-test/post-test trial can start from here
4. World 1 Graph Maze, World 4 Build the Network, Boss Level
5. World 5 Euler Escape, World 6 Colour Master, team leaderboard
