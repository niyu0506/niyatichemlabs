/* Niyati Chemlabs — interactions
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

  /* ── Drawer accordion (Products → division → categories) ─────────────
     Each [data-acc-toggle] owns the [data-acc-panel] next to it. Opening one
     closes its siblings inside the same [data-acc-group], so only the section
     that was tapped is ever open. */
  function accPanel(btn) {
    var panel = btn.nextElementSibling;
    return panel && panel.hasAttribute("data-acc-panel") ? panel : null;
  }

  function setAcc(btn, open) {
    var panel = accPanel(btn);
    if (!panel) return;
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("is-open", open);
    if (!open) {
      /* collapse anything nested, so reopening starts from a clean state */
      panel.querySelectorAll("[data-acc-toggle]").forEach(function (inner) {
        inner.setAttribute("aria-expanded", "false");
        var p = accPanel(inner);
        if (p) p.classList.remove("is-open");
      });
    }
  }

  document.querySelectorAll(".mobile-nav [data-acc-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") !== "true";
      var group = btn.closest("[data-acc-group]");
      var scope = group && group.parentElement ? group.parentElement : null;
      if (scope) {
        scope.querySelectorAll(":scope > [data-acc-group] > [data-acc-toggle]").forEach(function (sib) {
          if (sib !== btn) setAcc(sib, false);
        });
      }
      setAcc(btn, open);
    });
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

  /* ── Raw material category rail ─────────────────────────────────────── */
  var rmLinks = document.querySelectorAll("[data-rm-filter]");
  var rmBlocks = document.querySelectorAll("[data-rm-cat]");

  function applyRm(link, updateUrl) {
    var want = link.getAttribute("data-rm-filter");
    rmLinks.forEach(function (l) { l.classList.toggle("is-active", l === link); });
    rmBlocks.forEach(function (b) {
      b.hidden = want !== "all" && b.getAttribute("data-rm-cat") !== want;
    });
    if (updateUrl && history.replaceState) {
      history.replaceState(null, "", want === "all" ? location.pathname
                                                    : "?c=" + encodeURIComponent(want));
    }
  }

  if (rmLinks.length && rmBlocks.length) {
    rmLinks.forEach(function (link) {
      link.addEventListener("click", function () { applyRm(link, true); });
    });
    var rmWant = new URLSearchParams(location.search).get("c");
    if (rmWant) {
      var rmTarget = document.querySelector('[data-rm-filter="' + CSS.escape(rmWant) + '"]');
      if (rmTarget) applyRm(rmTarget, false);
    }
  }

  /* ── Gallery: group filter + lightbox ───────────────────────────────── */
  var galPills = document.querySelectorAll("[data-gal-filter]");
  var galGroups = document.querySelectorAll("[data-gal-group]");

  if (galPills.length && galGroups.length) {
    galPills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        var want = pill.getAttribute("data-gal-filter");
        galPills.forEach(function (p) { p.classList.toggle("is-active", p === pill); });
        galGroups.forEach(function (g) {
          g.hidden = want !== "all" && g.getAttribute("data-gal-group") !== want;
        });
      });
    });
  }

  var lb = document.getElementById("lightbox");
  var tiles = document.querySelectorAll("[data-gal-index]");

  if (lb && tiles.length) {
    var lbImg = lb.querySelector(".lightbox__img");
    var lbCap = lb.querySelector(".lightbox__caption");
    var lbClose = lb.querySelector(".lightbox__close");
    var lbPrev = lb.querySelector(".lightbox__nav--prev");
    var lbNext = lb.querySelector(".lightbox__nav--next");
    var opener = null;
    var at = 0;

    /* Only the photos currently on screen are navigable, so paging through a
       filtered gallery doesn't wander into a hidden group. */
    function visibleTiles() {
      return Array.prototype.filter.call(tiles, function (t) {
        return t.offsetParent !== null;
      });
    }

    function show(list, i) {
      if (!list.length) return;
      at = (i + list.length) % list.length;
      var t = list[at];
      lbImg.src = t.getAttribute("data-gal-src");
      lbImg.alt = t.getAttribute("data-gal-caption") || "";
      lbCap.textContent = t.getAttribute("data-gal-caption") || "";
    }

    function openLb(tile) {
      var list = visibleTiles();
      opener = tile;
      show(list, list.indexOf(tile));
      lb.hidden = false;
      lb.setAttribute("aria-hidden", "false");
      document.body.classList.add("nav-open");
      lbClose.focus();
    }

    function closeLb() {
      lb.hidden = true;
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("nav-open");
      if (opener) opener.focus();
    }

    function step(d) { var list = visibleTiles(); show(list, at + d); }

    tiles.forEach(function (t) {
      t.addEventListener("click", function () { openLb(t); });
    });
    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { step(-1); });
    lbNext.addEventListener("click", function () { step(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  /* ── Prefill the enquiry form from ?product=… ───────────────────────── */
  var productField = document.getElementById("f-product");
  if (productField) {
    var wantProduct = new URLSearchParams(location.search).get("product");
    if (wantProduct) productField.value = wantProduct;
  }

  /* ── Current year in footer ─────────────────────────────────────────── */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
