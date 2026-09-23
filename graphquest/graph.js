/**
 * GRAPH QUEST — graph engine (shared by all worlds)
 * ------------------------------------------------------------------
 * A graph is { nodes:[{id,name,x,y}], edges:[{a,b,w,m?}] }.
 *   w = distance (km), m = time (minutes, optional).
 *   An edge's id is its index in `edges`.
 *
 * Every puzzle is solved here before a student sees it. Graphs in the
 * game are small (at most 8 towns), so the solver lists EVERY route
 * from start to end and adds up each one. That is exact, it detects
 * ties, and it is the same method a Form 4 student is taught — which
 * is why the Learn panel can show the solver's working directly.
 */
(function (root) {
  'use strict';

  /* ---------- seeded random numbers ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ---------- basics ---------- */
  function neighbours(g, id, closed) {
    const out = [];
    g.edges.forEach(function (e, i) {
      if (closed && closed.has(i)) return;
      if (e.a === id) out.push({ edge: i, to: e.b });
      else if (e.b === id) out.push({ edge: i, to: e.a });
    });
    return out;
  }

  function total(g, edges, key) {
    return edges.reduce(function (s, i) { return s + g.edges[i][key]; }, 0);
  }

  function sameRoute(a, b) {
    return a.length === b.length && a.every(function (x, i) { return x === b[i]; });
  }

  /* ---------- every simple route from s to t ---------- */
  function allRoutes(g, s, t, closed) {
    const out = [], seen = new Set([s]), nodes = [s], edges = [];
    (function dfs(u) {
      if (u === t) { out.push({ nodes: nodes.slice(), edges: edges.slice() }); return; }
      neighbours(g, u, closed).forEach(function (nb) {
        if (seen.has(nb.to)) return;
        seen.add(nb.to); nodes.push(nb.to); edges.push(nb.edge);
        dfs(nb.to);
        seen.delete(nb.to); nodes.pop(); edges.pop();
      });
    })(s);
    return out;
  }

  /**
   * Solve for the route with the smallest total of `key` ('w' or 'm').
   * Returns every route (sorted best first), the best one, whether the
   * best is unique, and the best of the routes with the fewest roads.
   */
  function solve(g, s, t, key, closed) {
    const hasM = g.edges.length && g.edges[0].m != null;
    const routes = allRoutes(g, s, t, closed).map(function (r) {
      r.km = total(g, r.edges, 'w');
      r.min = hasM ? total(g, r.edges, 'm') : null;
      r.cost = key === 'm' ? r.min : r.km;
      return r;
    }).sort(function (a, b) { return a.cost - b.cost || a.edges.length - b.edges.length; });

    if (!routes.length) return { routes: routes, best: null, unique: false };

    const best = routes[0];
    const unique = routes.length === 1 || routes[1].cost > best.cost;
    const minHops = Math.min.apply(null, routes.map(function (r) { return r.edges.length; }));
    const fewest = routes.filter(function (r) { return r.edges.length === minHops; })[0]; // already cost-sorted
    return { routes: routes, best: best, unique: unique, minHops: minHops, fewest: fewest };
  }

  /**
   * Check a student's route (a list of edge ids from s).
   * Returns { valid, cost, optimal, tag } where tag names the mistake
   * for feedback and for the teacher dashboard.
   */
  function checkRoute(g, s, t, key, closed, edges) {
    let at = s;
    const seen = new Set([s]);
    for (let k = 0; k < edges.length; k++) {
      const e = g.edges[edges[k]];
      if (!e || (closed && closed.has(edges[k]))) return { valid: false, tag: 'invalid' };
      const to = e.a === at ? e.b : e.b === at ? e.a : null;
      if (to === null || seen.has(to)) return { valid: false, tag: 'invalid' };
      seen.add(to); at = to;
    }
    if (at !== t) return { valid: false, tag: 'not_at_destination' };

    const sol = solve(g, s, t, key, closed);
    const cost = total(g, edges, key);
    const optimal = cost === sol.best.cost;
    let tag = '';
    if (!optimal) {
      if (key === 'm' && sameRoute(edges, solve(g, s, t, 'w', closed).best.edges)) tag = 'chose_distance_not_time';
      else if (edges.length === sol.minHops && sol.best.edges.length > sol.minHops) tag = 'fewest_edges_not_shortest';
      else tag = 'valid_not_optimal';
    }
    return { valid: true, cost: cost, optimal: optimal, tag: tag, sol: sol };
  }

  /* ---------- geometry for the generator ---------- */
  function cross(p1, p2, p3, p4) {
    function o(a, b, c) { return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); }
    const d1 = o(p3, p4, p1), d2 = o(p3, p4, p2), d3 = o(p1, p2, p3), d4 = o(p1, p2, p4);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  }
  function distToSeg(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const u = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
  }

  /**
   * Generate a random town map with exactly one best route.
   * Also requires the best route to use at least 3 roads, and the
   * route with the fewest roads to be a DIFFERENT, longer route —
   * so every random puzzle carries the chapter's key lesson.
   */
  function generate(seed, opts) {
    opts = opts || {};
    const n = opts.n || 7, names = opts.names || [];
    const W = 640, H = 400, R = rng(seed);

    for (let attempt = 0; attempt < 800; attempt++) {
      // ---- place towns, spread out ----
      const pts = [];
      let guard = 0;
      while (pts.length < n && guard++ < 3000) {
        const p = { x: 60 + R() * (W - 120), y: 55 + R() * (H - 125) };
        if (pts.every(function (q) { return Math.hypot(p.x - q.x, p.y - q.y) > 118; })) pts.push(p);
      }
      if (pts.length < n) continue;
      pts.sort(function (a, b) { return a.x - b.x; });

      const nodes = pts.map(function (p, i) {
        const id = i === 0 ? 'S' : i === n - 1 ? 'T' : 'N' + i;
        return { id: id, name: names[i] || id, x: Math.round(p.x), y: Math.round(p.y) };
      });

      // ---- roads: shortest first, no crossings, none through a town ----
      const cand = [];
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < 270 && !(i === 0 && j === n - 1)) cand.push({ i: i, j: j, d: d });
      }
      cand.sort(function (a, b) { return a.d - b.d; });

      const deg = new Array(n).fill(0), picked = [];
      cand.forEach(function (c) {
        if (deg[c.i] >= 4 || deg[c.j] >= 4) return;
        const A = nodes[c.i], B = nodes[c.j];
        const clash = picked.some(function (p) {
          if (p.i === c.i || p.i === c.j || p.j === c.i || p.j === c.j) return false;
          return cross(A, B, nodes[p.i], nodes[p.j]);
        }) || nodes.some(function (q, k) {
          return k !== c.i && k !== c.j && distToSeg(q, A, B) < 34;
        });
        if (clash) return;
        picked.push(c); deg[c.i]++; deg[c.j]++;
      });

      const edges = picked.map(function (c) {
        const km = Math.max(2, Math.round(c.d / 12 * (0.55 + R() * 1.0)));
        return { a: nodes[c.i].id, b: nodes[c.j].id, w: km };
      });
      const g = { nodes: nodes, edges: edges };

      // ---- accept only puzzles with one clear answer and a lesson in them ----
      const sol = solve(g, 'S', 'T', 'w');
      if (!sol.best || !sol.unique) continue;
      if (sol.best.edges.length < 3) continue;
      if (sameRoute(sol.fewest.edges, sol.best.edges)) continue;
      if (sol.routes.length < 4) continue;
      return g;
    }
    throw new Error('Could not generate a puzzle — try another seed.');
  }

  const api = {
    rng: rng, neighbours: neighbours, total: total, sameRoute: sameRoute,
    allRoutes: allRoutes, solve: solve, checkRoute: checkRoute, generate: generate
  };
  root.GraphEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
