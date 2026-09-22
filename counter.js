/**
 * Per-page visitor counter.
 *
 * Drop `<span class="page-counter" data-page-counter hidden></span>` anywhere in
 * a page's footer and load this file. The key is derived from the URL, so new
 * pages count themselves with no edit here and no edit in the worker.
 *
 * If the worker is unreachable the element stays hidden and nothing is logged —
 * a stale or broken counter is worse than no counter.
 *
 * The worker is shared across the sites; it namespaces counts by Origin, so
 * setviz.visuallymath.com keeps its own total rather than adding to the
 * visuallymath.com landing page.
 */
(function () {
  "use strict";

  // Swap for the *.workers.dev URL while prototyping.
  var ENDPOINT = "https://counter.suriyatiujang.com";

  // This site renders its footer with React, so the element usually does not
  // exist yet when this file runs. Wait for it rather than giving up.
  whenPresent("[data-page-counter]", start);

  function whenPresent(selector, fn) {
    var found = document.querySelectorAll(selector);
    if (found.length) return fn(found);

    var observer = new MutationObserver(function () {
      var els = document.querySelectorAll(selector);
      if (!els.length) return;
      observer.disconnect();
      clearTimeout(giveUp);
      fn(els);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // If the footer never arrives, stop watching rather than observing forever.
    var giveUp = setTimeout(function () {
      observer.disconnect();
    }, 15000);
  }

  function start(targets) {

  injectStyles();

  var path = normalizePath(window.location.pathname);

  // Reveal a neutral placeholder now that we know scripting is on.
  each(targets, function (el) {
    el.innerHTML = eyeIcon() + '<span class="page-counter__text">&mdash;</span>';
    el.removeAttribute("hidden");
  });

  fetch(ENDPOINT + "/hit?path=" + encodeURIComponent(path), {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    cache: "no-store",
  })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(function (data) {
      if (typeof data.views !== "number" || typeof data.uniques !== "number") {
        throw new Error("bad payload");
      }
      var text =
        format(data.views) +
        (data.views === 1 ? " view" : " views") +
        " · " +
        format(data.uniques) +
        (data.uniques === 1 ? " visitor" : " visitors");
      each(targets, function (el) {
        el.querySelector(".page-counter__text").textContent = text;
      });
    })
    .catch(function () {
      each(targets, function (el) {
        el.setAttribute("hidden", "");
      });
    });

  }

  /** "/index.html" and "/" are the same page; so are "/STA191" and "/STA191/".
   *  Case is preserved — the site's folders (STA191, STA323, ...) are
   *  uppercase and Vercel's static file serving is case-sensitive, so
   *  lowercasing here would make the existence check 404. */
  function normalizePath(raw) {
    var p = raw || "/";
    if (p.indexOf("/index.html", p.length - 11) !== -1) {
      p = p.slice(0, -"index.html".length);
    }
    if (
      p.indexOf(".html", p.length - 5) === -1 &&
      p.charAt(p.length - 1) !== "/"
    ) {
      p += "/";
    }
    return p;
  }

  function format(n) {
    try {
      return n.toLocaleString("en-US");
    } catch (e) {
      return String(n);
    }
  }

  function each(list, fn) {
    Array.prototype.forEach.call(list, fn);
  }

  function eyeIcon() {
    return (
      '<svg class="page-counter__icon" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/>' +
      '<circle cx="12" cy="12" r="3"/></svg>'
    );
  }

  /** Inherits font and colour from the footer, so it follows the active theme. */
  function injectStyles() {
    var css =
      ".page-counter{display:inline-flex;align-items:center;gap:7px;" +
      "font-family:inherit;font-size:inherit;letter-spacing:inherit;" +
      "text-transform:inherit;color:currentColor;opacity:.62;" +
      "font-variant-numeric:tabular-nums;}" +
      ".page-counter[hidden]{display:none;}" +
      ".page-counter__icon{width:13px;height:13px;flex:none;}";
    var style = document.createElement("style");
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }
})();
