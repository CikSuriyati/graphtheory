# GRAPH QUEST — setup

Three files, in `graphquest/`:

| File | What it is |
|---|---|
| `index.html` | The game students play |
| `graph.js` | The graph engine: draws nothing, solves everything. Every puzzle is solved before it is shown |
| `graphquest-apps-script.gs` | The backend that saves results to your Google Sheet |

The game is live at `graphtheory.visuallymath.com/graphquest/` as soon as this folder is pushed. It works with no setup at all. Students play, and progress is saved on their device. The Sheet is only needed when you want results to reach you.

Takes about 10 minutes.

---

## What's built — Stage 1

**World 3, Shortest Path Race**, complete: 5 levels, feedback, hints, Learn, the quick check, XP, and the Discover screen. The other five worlds show on the map as *Coming soon*.

| Level | Map | What it teaches |
|---|---|---|
| 1 · 4 towns | Temerloh → PPS Chenor | The shortest road out of the start (8 km) is not on the best route |
| 2 · 6 towns | Temerloh → PPS Jerantut | The 2-road route is 44 km; the best is 30 km with 3 roads |
| 3 · Road closed! | Temerloh → PPS Maran | A road floods after the first move, and the plan must change |
| 4 · Fastest, not shortest | Temerloh → PPS Triang | Two weights: the shortest route in km (42 km, 67 min) is not the fastest (43 min) |
| 5 · Random challenge | New map every time | Generated, solved and checked: one best route, and fewest roads ≠ shortest |

Distances are simplified for the game — they are not real road distances.

**Both languages throughout.** The BM / EN button is top right. It shares its setting with the GraphTheory tool, so a student who switched the tool to BM opens the game in BM too. Graph terms follow the tool: *bucu, sisi, pemberat, graf berpemberat, laluan terpendek, lorong*. New terms appear in both languages together (e.g. *pemberat · weight*).

---

## 1. Create the Sheet

Make a new Google Sheet. The script creates its own tab called **Attempts**.

## 2. Add the script

**Extensions → Apps Script**. Delete whatever is in `Code.gs`, paste the entire contents of `graphquest-apps-script.gs`, Save.

## 3. Run the two setup functions

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

| Tag | Means |
|---|---|
| `fewest_edges_not_shortest` | Chose the route with the fewest roads, when the best route has more |
| `chose_distance_not_time` | Level 4: found the shortest route in km instead of the fastest |
| `valid_not_optimal` | A legal route that simply wasn't the best |

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

## The one thing that trips everyone up

**After any edit to the Apps Script, redeploy as a new version.**

`Deploy → Manage deployments → pencil icon → Version: New version → Deploy`

---

## Troubleshooting

**"Results aren't connected yet"** — `ENDPOINT` still has the placeholder.

**"That didn't go through"** — deployment access isn't "Anyone", or the student is offline. Nothing is lost; they can submit again.

**A CORS error** — the POST must stay `Content-Type: text/plain`. That keeps it a simple request, so the browser skips the preflight check that Apps Script can't answer.

**Rows missing** — Apps Script editor → **Executions** shows the real error.

**A student changed device** — progress doesn't move with them, but the Sheet still has everything they submitted.

---

## Next stages

2. World 2 Graph Detective, and a combined *My progress* across worlds
3. The teacher dashboard page, reading the published Sheet as CSV. The pre-test/post-test trial can start here
4. World 1 Graph Maze, World 4 Build the Network, Boss Level
5. World 5 Euler Escape, World 6 Colour Master, team leaderboard
