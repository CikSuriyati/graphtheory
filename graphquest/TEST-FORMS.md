# GRAPH QUEST — pre-test and post-test forms

For review before any class uses them. Generated from `tests.js`, so this is exactly what students see.

- **Odd register numbers:** form A before playing, form B after.
- **Even register numbers:** form B before, form A after.
- Item *n* tests the same idea on both forms. Items 1, 3, 5, 8, 10 are applied; 2, 4, 6, 7, 9 are recall.
- 1 mark each, 10 in total. No hints or feedback during the test; one attempt.

To change a question, edit `FORMS` in `tests.js` and keep A and B matched item by item.

## 1. Degree of a vertex · Darjah bucu

**Form A**  
What is the degree of vertex P?  
*Apakah darjah bucu P?*

*Diagram:* vertices P, Q, R, S, T; edges P–Q, P–R, P–S, Q–R, S–T.

Answer: **3**

**Form B**  
What is the degree of vertex B?  
*Apakah darjah bucu B?*

*Diagram:* vertices A, B, C, D, E; edges A–B, B–C, B–D, B–E, C–D.

Answer: **4**

## 2. Sum of degrees · Hasil tambah darjah

**Form A**  
A graph has 7 edges. What is the sum of the degrees of all its vertices?  
*Sebuah graf mempunyai 7 sisi. Apakah hasil tambah darjah semua bucunya?*

Answer: **14**

**Form B**  
A graph has 9 edges. What is the sum of the degrees of all its vertices?  
*Sebuah graf mempunyai 9 sisi. Apakah hasil tambah darjah semua bucunya?*

Answer: **18**

## 3. Edges from degrees · Sisi daripada darjah

**Form A**  
The vertices of a graph have degrees 3, 3, 2, 2 and 2. How many edges does the graph have?  
*Bucu-bucu sebuah graf mempunyai darjah 3, 3, 2, 2 dan 2. Berapakah bilangan sisi graf itu?*

Answer: **6**

**Form B**  
The vertices of a graph have degrees 4, 3, 3, 2 and 2. How many edges does the graph have?  
*Bucu-bucu sebuah graf mempunyai darjah 4, 3, 3, 2 dan 2. Berapakah bilangan sisi graf itu?*

Answer: **7**

## 4. Simple graph · Graf mudah

**Form A**  
Which of these is a simple graph?  
*Yang manakah graf mudah?*

- a) A graph with a loop at one vertex · *Graf dengan gelung pada satu bucu*
- b) A graph with two edges joining the same pair of vertices · *Graf dengan dua sisi menghubungkan pasangan bucu yang sama*
- c) A graph with no loops and no multiple edges · *Graf tanpa gelung dan tanpa sisi berbilang* ✅
- d) A graph where every vertex has a loop · *Graf yang setiap bucunya ada gelung*

**Form B**  
Which of these makes a graph NOT a simple graph?  
*Yang manakah menjadikan sebuah graf BUKAN graf mudah?*

- a) It has a vertex of degree 1 · *Ia ada bucu berdarjah 1*
- b) It has two edges joining the same two vertices · *Ia ada dua sisi yang menghubungkan dua bucu yang sama* ✅
- c) It is not connected · *Ia tidak tersambung*
- d) It has 6 vertices · *Ia ada 6 bucu*

## 5. Degree with a loop · Darjah dengan gelung

**Form A**  
What is the degree of vertex X?  
*Apakah darjah bucu X?*

*Diagram:* vertices Y, X, Z; edges X–Y, X–Z, X loop.

Answer: **4**

**Form B**  
What is the degree of vertex M?  
*Apakah darjah bucu M?*

*Diagram:* vertices N, M, O, P; edges M–N, M–O, M–P, M loop.

Answer: **5**

## 6. Path · Lorong

**Form A**  
Which of these is a path in this graph?  
*Yang manakah lorong dalam graf ini?*

*Diagram:* vertices P, Q, R, S, T; edges P–Q, P–R, P–S, Q–R, S–T.

- a) P → Q → P → S · *P → Q → P → S*
- b) P → Q → R · *P → Q → R* ✅
- c) P → T · *P → T*
- d) Q → S → T · *Q → S → T*

**Form B**  
Which of these is a path in this graph?  
*Yang manakah lorong dalam graf ini?*

*Diagram:* vertices A, B, C, D, E; edges A–B, B–C, B–D, B–E, C–D.

- a) A → C · *A → C*
- b) A → B → A → E · *A → B → A → E*
- c) A → B → C → D · *A → B → C → D* ✅
- d) E → D · *E → D*

## 7. Connected graph · Graf tersambung

**Form A**  
Is this graph connected?  
*Adakah graf ini tersambung?*

*Diagram:* vertices A, B, C, D, E; edges A–B, B–C, D–E.

- a) Yes — every vertex has at least one edge · *Ya — setiap bucu ada sekurang-kurangnya satu sisi*
- b) No — some pairs of vertices have no path between them · *Tidak — ada pasangan bucu yang tiada lorong antaranya* ✅
- c) Yes — it has 3 edges · *Ya — ia ada 3 sisi*

**Form B**  
Is this graph connected?  
*Adakah graf ini tersambung?*

*Diagram:* vertices A, B, C, D, E; edges A–B, A–C, B–D, C–D, D–E.

- a) Yes — there is a path between every pair of vertices · *Ya — ada lorong antara setiap pasangan bucu* ✅
- b) No — it has a vertex of degree 1 · *Tidak — ia ada bucu berdarjah 1*
- c) No — it contains a cycle · *Tidak — ia mengandungi kitaran*

## 8. Shortest path · Laluan terpendek

**Form A**  
The numbers are distances in km. What is the shortest distance from S to T?  
*Nombor-nombor itu ialah jarak dalam km. Apakah jarak terpendek dari S ke T?*

*Diagram:* vertices S, A, B, T; edges S–A (4), S–B (7), A–B (2), A–T (8), B–T (3).

Answer: **9** km

**Form B**  
The numbers are distances in km. What is the shortest distance from S to T?  
*Nombor-nombor itu ialah jarak dalam km. Apakah jarak terpendek dari S ke T?*

*Diagram:* vertices S, A, B, T; edges S–A (5), S–B (3), A–B (1), A–T (4), B–T (9).

Answer: **8** km

## 9. Edges of a tree · Sisi pokok

**Form A**  
A tree has 8 vertices. How many edges does it have?  
*Sebuah pokok mempunyai 8 bucu. Berapakah bilangan sisinya?*

Answer: **7**

**Form B**  
A tree has 11 vertices. How many edges does it have?  
*Sebuah pokok mempunyai 11 bucu. Berapakah bilangan sisinya?*

Answer: **10**

## 10. Minimum total weight · Jumlah pemberat minimum

**Form A**  
The numbers are cable lengths in metres. Every house must be connected using the least total cable. What is that smallest total?  
*Nombor-nombor itu ialah panjang kabel dalam meter. Setiap rumah mesti disambungkan dengan jumlah kabel paling sedikit. Berapakah jumlah itu?*

*Diagram:* vertices P, Q, R, S; edges P–Q (3), Q–R (4), R–S (2), S–P (5), P–R (6).

Answer: **9** m

**Form B**  
The numbers are cable lengths in metres. Every house must be connected using the least total cable. What is that smallest total?  
*Nombor-nombor itu ialah panjang kabel dalam meter. Setiap rumah mesti disambungkan dengan jumlah kabel paling sedikit. Berapakah jumlah itu?*

*Diagram:* vertices A, B, C, D; edges A–B (6), B–C (2), C–D (5), D–A (3), A–C (7).

Answer: **10** m

## Survey (after the post-test, game group only)

1 = strongly disagree … 5 = strongly agree

1. Graph Quest was fun to use. · *Graph Quest seronok digunakan.*
2. I understand degree better after playing. · *Saya lebih faham darjah selepas bermain.*
3. I understand shortest paths better after playing. · *Saya lebih faham laluan terpendek selepas bermain.*
4. The feedback helped me see my mistakes. · *Maklum balas membantu saya melihat kesilapan saya.*
5. The hints helped me when I was stuck. · *Petunjuk membantu saya apabila tersekat.*
6. I would like to learn other topics this way. · *Saya mahu belajar topik lain dengan cara ini.*
7. The game was easy to use on my device. · *Permainan ini mudah digunakan pada peranti saya.*
8. I feel confident answering graph questions now. · *Saya kini yakin menjawab soalan graf.*

Open question: What did you like most, or what should we improve? · *Apa yang paling anda suka, atau apa yang perlu diperbaiki?*
