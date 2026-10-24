# Graph Quest: facilitator guide

For lecturers and facilitators running Graph Quest with a class. No setup is needed on your side beyond choosing a class code.

**Game:** graphtheory.visuallymath.com/graphquest/
**Teacher dashboard:** graphtheory.visuallymath.com/graphquest/teacher.html
(Students: phone or laptop, any browser. English / Bahasa Melayu button top right.)

---

## 1. The workflow at a glance

```
BEFORE CLASS        →  DURING CLASS                                   →  AFTER CLASS
Choose class code       Join → Pre-test → Play worlds → Submit results    Open dashboard
Test the link           → Post-test → Survey                              Reteach the weakest idea
Brief students          (you circulate and prompt, not explain)           Compare pre vs post
```

### Student journey (what they see in the game)

| Step | What the student does | Notes for you |
|---|---|---|
| 1. Join | Types **class code**, optional **group**, and **name or register number** | Same name every time (`Aina` and `Aina Sofea` count as two students) |
| 2. Pre-test | 10 questions, 1 mark each, no hints, one attempt | Not marked for their grade. Comes first so the guide can't give answers away |
| 3. How to play | Short step-by-step guide, shown once | Available again from the top bar |
| 4. Play | 4 core worlds × 5 levels, then 2 bonus worlds and the Boss Level | See section 3 |
| 5. Submit results | **My progress → Submit results** | Nothing reaches you until they press this |
| 6. Post-test | Opens after **5 levels cleared + Submit results**. 10 questions on the parallel form, then a short survey | Tell them to take it only when finished playing |

---

## 2. Before class (10 minutes)

1. **Pick one class code per class**, for example `4S1`. Only the part before a dash is used, so don't run `4S1-2026` and `4S1-2027` at the same time.
2. **Try it yourself once** on a phone: join with a test name such as `TEST-Lecturer`, so you can spot and ignore that row later.
3. **Decide individual or team play.**
   - Individual: students leave Group empty.
   - Team: every member types the same group name (for example `Melur`). Team XP is the *average* per member, so team size doesn't matter.
4. **Check the Apps Script is up to date** (one time, see `SETUP.md`). If it isn't, results wait safely on each student's device, and nothing is lost.
5. **Have your teacher key ready** for the dashboard. Keep it private.
6. Make sure students have a charged phone or laptop. The game works offline, and results send when they reconnect and press Submit.

---

## 3. What the game teaches

| World | Story | Core idea |
|---|---|---|
| 1 · Graph Maze | Scout in Taman Negara | Walk, path, connected, directed graph |
| 2 · Graph Detective | Case of the missing trophy | Vertex, edge, degree, loop, multiple edge, simple graph; sum of degrees = 2 × edges |
| 3 · Shortest Path Race | Roads between towns | Weighted graph, shortest path (fewest roads is not shortest distance) |
| 4 · Build the Network | Fibre between kampung | Tree, minimum spanning tree (cheapest first, skip cycles) |
| 5 · Euler Escape *(bonus)* | Cross every bridge once | Euler trail and circuit, odd vertices |
| 6 · Colour Master *(bonus)* | Exam timetable clashes | Graph colouring, chromatic number |
| Boss Level | One town, four missions | Students pick **which idea to use** with no hint |

**Unlock rules:** bonus worlds open at 10 core levels. Boss opens at all 20 core levels.
**Each world has a Discover screen:** students state the rule before they see the term.

---

## 4. Suggested session plans

Timings are estimates. Adjust after your first class.

### Option A: one 2-hour session
| Time | Activity |
|---|---|
| 0–10 min | Explain the aim. Give the class code and group rule. Students join. |
| 10–25 min | Pre-test (silent, individual) |
| 25–85 min | Play. Circulate. Nudge with questions (section 5) |
| 85–95 min | Everyone presses **Submit results** |
| 95–115 min | Post-test and survey |
| 115–120 min | Debrief: what surprised you? |

### Option B: spread over a week (better for retention data)
| Session | Activity |
|---|---|
| Week start, 20 min | Join and pre-test |
| Self-paced, at home or in a lab | Play worlds 1–4, Submit results |
| Lab or class, 30 min | Bonus worlds, Boss Level, post-test |
| After | Reteach from the dashboard |

If you want a comparison group, keep a few students *out* of the game. The dashboard compares players with non-players who took the tests.

---

## 5. Your role during play

Circulate and ask, and try not to explain. The game gives feedback, hints and a Learn option.

Good prompts:
- "What did the wrong answer tell you?"
- "Is your route the shortest, or just the one with the fewest roads?"
- "How many odd places are there? What does that tell you?"
- "Which world's idea fits this problem?" (Boss Level)

Common situations:

| Situation | What to do |
|---|---|
| Student can't get in | Check they typed the class code exactly. Letters and numbers only |
| Student typed a different name and has "lost" progress | Have them retype the original name. Progress is on that device |
| Student wants to change team | Map → **Change** under group. Progress is kept |
| Student stuck | Use Hint (small XP cost). Learn costs more XP. Both are recorded |
| Student asks to skip the pre-test | It can be skipped, but the pre/post comparison then has no data for them. Encourage doing it |
| Phone offline | They can keep playing. Submit when back online |

---

## 6. Submitting results (important)

Progress lives on each student's device. **Nothing reaches you until they press My progress → Submit results.** The game reminds them, but remind them aloud:

- once before the post-test (this also unlocks it)
- once at the end of the session

Submitting twice is harmless because duplicates are skipped. Wrong attempts are stored too, and they are the most useful data.

---

## 7. After class: reading the dashboard

1. Open `teacher.html`, paste your teacher key, select the class, press **Load results**. (No connection? Download the Attempts and Tests tabs as CSV and open both files on the dashboard.)
2. Read it top to bottom. It answers one question: **which idea should I reteach, and to whom?**

| Dashboard section | Use it to |
|---|---|
| **Reteach tomorrow** | See the level with the most wrong answers, the common mistake, a teaching tip, and the students to check in with |
| Part 1 · Mastery and mistakes by world | Find worlds under 70% mastery and the top mistake types |
| Part 2 · Level by level | See who cleared each level and who needed Hint or Learn |
| Part 3 · Students needing support | Find the lowest 5 per world |
| Part 4 · Every student | Tap a student to see their attempt trail (✗ → ✗ → ✓) |
| Part 5 · Boss Level | Check whether students chose the right idea for each mission |
| Part 6 · Pre-test and post-test | Read mean gain, % improved, paired t, question-by-question results and the survey |

Everything is computed in your browser and nothing is sent anywhere.

### A simple debrief routine (10 minutes next class)
1. Show the **Reteach tomorrow** card.
2. Put the most common mistake on the board with a small graph.
3. Ask the class why it's tempting, and what rule avoids it.
4. Link back to the Discover rule for that world.

---

## 8. Using it for research or evaluation

- **Test forms:** A and B are matched item by item. Odd register numbers take A before and B after. Even register numbers take B before and A after. See `TEST-FORMS.md`.
- **Data you get:** pre/post scores, per-question results, every attempt (with hints, time, mistake tag), Boss tool choice, and a Likert survey plus comments.
- **Privacy:** students see classmates' names or register numbers on the class board. If that's a concern, tell them to use register numbers only.
- **Remove test rows** (yours) before analysing.

---

## 9. Quick checklist

**Before**
- [ ] Class code chosen and told to students
- [ ] Individual vs team decided
- [ ] Tried the game once on a phone
- [ ] Teacher key ready

**During**
- [ ] Everyone joined and did the pre-test
- [ ] Students playing, prompted with questions
- [ ] Everyone pressed **Submit results**
- [ ] Post-test and survey done at the end

**After**
- [ ] Dashboard loaded, my own test rows ignored
- [ ] Reteach card read
- [ ] Pre/post gain noted
