/* Niyati Chem Labs — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully without it. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Sticky header condense ─────────────────────────────────────────── */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".fab--top");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-stuck", y > 12);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ── Mobile navigation drawer ───────────────────────────────────────── */
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.querySelector(".mobile-nav");
  var scrim = document.querySelector(".scrim");
  var closeBtn = document.querySelector(".mobile-nav__close");

  function setNav(open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    if (scrim) scrim.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) {
      var first = drawer.querySelector("a, button");
      if (first) first.focus();
    } else if (toggle) {
      toggle.focus();
    }
  }

  if (toggle) toggle.addEventListener("click", function () { setNav(!drawer.classList.contains("is-open")); });
  if (scrim) scrim.addEventListener("click", function () { setNav(false); });
  if (closeBtn) closeBtn.addEventListener("click", function () { setNav(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) setNav(false);
  });

  /* ── Scroll reveal ──────────────────────────────────────────────────── */
  var revealables = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
        setTimeout(function () { el.classList.add("is-visible"); }, delay);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    revealables.forEach(function (el) { io.observe(el); });

    /* Auto-stagger children of any [data-stagger] container */
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = parseInt(group.getAttribute("data-stagger") || "80", 10);
      var kids = group.querySelectorAll(":scope > [data-reveal]");
      kids.forEach(function (kid, i) {
        if (!kid.hasAttribute("data-reveal-delay")) {
          kid.setAttribute("data-reveal-delay", String(Math.min(i, 12) * step));
        }
      });
    });
  }

  /* ── Animated stat counters ─────────────────────────────────────────── */
  var stats = document.querySelectorAll("[data-count]");
  if (stats.length && !reduceMotion && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        so.unobserve(el);
        var raw = el.getAttribute("data-count") || el.textContent;
        var num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
        if (isNaN(num)) return;
        var suffix = String(raw).replace(/[0-9.,]/g, "");
        var start = performance.now();
        var dur = 1400;
        function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = num < 10 ? (num * eased).toFixed(0) : Math.round(num * eased);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    stats.forEach(function (el) { so.observe(el); });
  }

  /* ── Product filter (by division or by category) ─────────────────────── */
  var pills = document.querySelectorAll(".filter-pill");
  var cards = document.querySelectorAll("[data-category]");
  var emptyMsg = document.querySelector("[data-empty]");

  function applyFilter(pill, updateUrl) {
    var want = pill.getAttribute("data-filter");
    var attr = pill.getAttribute("data-filter-attr") || "category";
    pills.forEach(function (p) { p.classList.toggle("is-active", p === pill); });

    var shown = 0;
    cards.forEach(function (card) {
      var match = attr === "all" || card.getAttribute("data-" + attr) === want;
      card.classList.toggle("is-hidden", !match);
      if (match) {
        shown++;
        if (!reduceMotion) {
          card.style.animation = "none";
          /* force reflow so the animation restarts */
          void card.offsetWidth;
          card.style.animation = "pageIn 0.5s var(--ease-out) both";
        }
      }
    });
    if (emptyMsg) emptyMsg.hidden = shown !== 0;

    if (updateUrl && history.replaceState) {
      var q = attr === "all" ? location.pathname
            : "?" + (attr === "division" ? "d" : "c") + "=" + encodeURIComponent(want);
      history.replaceState(null, "", q);
    }
  }

  if (pills.length && cards.length) {
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () { applyFilter(pill, true); });
    });

    /* Honour ?c=tablets or ?d=raw-materials on load */
    var params = new URLSearchParams(location.search);
    var wantCat = params.get("c");
    var wantDiv = params.get("d");
    var sel = null;
    if (wantDiv) {
      sel = '.filter-pill[data-filter-attr="division"][data-filter="' + CSS.escape(wantDiv) + '"]';
    } else if (wantCat) {
      sel = '.filter-pill[data-filter-attr="category"][data-filter="' + CSS.escape(wantCat) + '"]';
    }
    if (sel) {
      var target = document.querySelector(sel);
      if (target) applyFilter(target, false);
    }
  }

  /* ── Current year in footer ─────────────────────────────────────────── */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
