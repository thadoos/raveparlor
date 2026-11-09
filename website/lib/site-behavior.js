/*
 * Behaviour for the single-page deck: header tone, menu, full-screen slide
 * paging (wheel / touch / keys / in-page links), the service menu and its
 * detail panel, and reveal-on-scroll. It drives server-rendered markup in the
 * DOM, so it lives outside React. `initSiteBehavior` returns a cleanup function.
 */
export function initSiteBehavior() {
  var ac = new AbortController();
  var io = null;

  var root = document.documentElement;
  var head = document.getElementById("head");
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  var phone = window.matchMedia("(max-width: 820px)");
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ticking = false;

  function update() {
    ticking = false;
    setTone();
  }

  // a section can set a different tone for phones (data-tone-m), e.g. when its layout changes there
  function toneOf(el) {
    return phone.matches && el.hasAttribute("data-tone-m")
      ? el.getAttribute("data-tone-m")
      : el.getAttribute("data-tone");
  }

  function setTone() {
    var dark = false,
      blur = false;
    if (!root.classList.contains("menu-open")) {
      var y = head.offsetHeight / 2;
      var hits = document.elementsFromPoint(window.innerWidth / 2, y);
      for (var i = 0; i < hits.length; i++) {
        if (head.contains(hits[i]) || hits[i].closest(".md")) continue;
        var host = hits[i].closest("[data-tone]");
        if (host) {
          dark = toneOf(host) === "dark";
          blur = !!hits[i].closest("[data-blur]");
          break;
        }
      }
    }
    head.classList.toggle("is-dark", dark);
    head.classList.toggle("is-blur", blur);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  /* ---- menu ---- */
  function setMenu(open, viaKeyboard) {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (open && viaKeyboard) {
      var first = menu.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
    setTone();
  }
  burger.addEventListener(
    "click",
    function (e) {
      setMenu(!root.classList.contains("menu-open"), e.detail === 0);
    },
    { signal: ac.signal },
  );
  menu.addEventListener(
    "click",
    function (e) {
      if (e.target.closest("a")) setMenu(false);
    },
    { signal: ac.signal },
  );
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) {
        setMenu(false);
        burger.focus();
      }
    },
    { signal: ac.signal },
  );
  head.querySelectorAll("a").forEach(function (a) {
    a.addEventListener(
      "click",
      function () {
        setMenu(false);
      },
      { signal: ac.signal },
    );
  });

  /* ---- deck: full-screen slides moved with transforms (like Swiper) ---- */
  var deck = document.getElementById("deck");
  var DURATION = 450; // ms per screen for wheel, keys and links
  var EASE = "cubic-bezier(.37,0,.63,1)"; // gentle in-out
  var EASE_OUT = "cubic-bezier(.22,.61,.36,1)"; // finishing a finger drag
  var slides = [],
    cur = 0,
    busy = false,
    quiet = false,
    lastWheel = 0,
    lastAbs = 0;

  function vh() {
    return deck.clientHeight;
  }
  function isScroll(s) {
    return s.classList.contains("scroll");
  }
  function canScroll(s, dir) {
    if (!isScroll(s)) return false;
    return dir > 0 ? s.scrollTop + s.clientHeight < s.scrollHeight - 1 : s.scrollTop > 0;
  }

  function layout() {
    slides.forEach(function (s, i) {
      s.style.transition = "";
      s.style.transform = "";
      s.style.visibility = "";
      s.style.zIndex = i + 1;
      s.classList.toggle("is-current", i === cur);
      s.classList.toggle("is-under", i < cur);
      s.classList.toggle("is-far", i < cur - 1 || i > cur + 1);
      s.classList.remove("moving");
      if (i === cur) s.classList.remove("pre");
      else if (i === cur + 1) s.classList.add("pre");
    });
    setTone();
  }

  function collect() {
    var prev = slides[cur];
    deck.querySelectorAll(".slide, .half").forEach(function (s) {
      s.classList.remove("is-current", "is-under", "is-far", "pre", "moving");
      s.style.transform = "";
      s.style.transition = "";
      s.style.zIndex = "";
      s.style.visibility = "";
    });
    slides = Array.prototype.slice.call(
      deck.querySelectorAll(phone.matches ? ".slide:not(.pair), .half" : ".slide"),
    );
    cur = 0;
    if (prev)
      for (var i = 0; i < slides.length; i++) {
        if (slides[i] === prev || slides[i].contains(prev) || prev.contains(slides[i])) {
          cur = i;
          break;
        }
      }
    layout();
  }

  function slideTo(el, y, dur, ease, done) {
    var finished = false;
    function end() {
      if (finished) return;
      finished = true;
      el.removeEventListener("transitionend", onEnd);
      done();
    }
    function onEnd(e) {
      if (e.target === el && e.propertyName === "transform") end();
    }
    if (!dur || still.matches) {
      el.style.transition = "none";
      el.style.transform = "translate3d(0," + y + "px,0)";
      end();
      return;
    }
    el.addEventListener("transitionend", onEnd, { signal: ac.signal });
    el.style.transition = "transform " + dur + "ms " + ease;
    el.style.transform = "translate3d(0," + y + "px,0)";
    setTimeout(end, dur + 80);
  }

  function headFor(s) {
    // logo colour / blur for the screen that is arriving
    if (isScroll(s) && s.scrollTop > 4) return; // decided from what's under the header once it lands
    head.classList.toggle("is-dark", toneOf(s) === "dark");
    head.classList.toggle(
      "is-blur",
      s.hasAttribute("data-blur") ||
        (isScroll(s) && !!s.querySelector(":scope > [data-blur]:first-child")),
    );
  }

  // move to slide `to`; `from` = current drag offset in px (optional), `dur`/`ease` override timing
  function go(to, opt) {
    opt = opt || {};
    if (busy || to < 0 || to >= slides.length || to === cur) return false;
    busy = true;
    var dir = to > cur ? 1 : -1,
      H = vh();
    var dur = opt.dur != null ? opt.dur : DURATION,
      ease = opt.ease || EASE;
    if (dir > 0) {
      var t = slides[to];
      t.classList.remove("is-far");
      t.style.visibility = "visible";
      t.style.transition = "none";
      t.style.transform = "translate3d(0," + (opt.from != null ? opt.from : H) + "px,0)";
      void t.offsetHeight; // commit start position
      t.classList.remove("pre");
      t.classList.add("moving");
      headFor(t);
      slideTo(t, 0, dur, ease, function () {
        cur = to;
        busy = false;
        quiet = true;
        layout();
      });
    } else {
      var c = slides[cur],
        target = slides[to];
      for (var i = to + 1; i < cur; i++) slides[i].style.visibility = "hidden"; // skip screens in between
      target.classList.remove("is-far");
      target.style.visibility = "visible";
      c.style.transition = "none";
      c.style.transform = "translate3d(0," + (opt.from != null ? opt.from : 0) + "px,0)";
      void c.offsetHeight;
      c.classList.add("moving");
      headFor(target);
      slideTo(c, H, dur, ease, function () {
        cur = to;
        busy = false;
        quiet = true;
        layout();
      });
    }
    return true;
  }

  function step(dir) {
    return go(cur + dir);
  }

  /* wheel / trackpad: one gesture = one screen; inner scrolling where a screen scrolls */
  window.addEventListener(
    "wheel",
    function (e) {
      if (root.classList.contains("menu-open") || root.classList.contains("modal-open")) return;
      var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(dy) < 1) return;
      var dir = dy > 0 ? 1 : -1,
        now = performance.now(),
        abs = Math.abs(dy);
      if (!busy && canScroll(slides[cur], dir)) {
        lastWheel = now;
        lastAbs = abs;
        quiet = true;
        return;
      } // native inner scroll
      e.preventDefault();
      if (busy) {
        lastWheel = now;
        lastAbs = abs;
        return;
      }
      if (quiet) {
        // swallow trackpad momentum; a pause or a fresh, stronger push starts a new move
        var fresh = now - lastWheel > 160 || (abs > lastAbs * 1.8 && abs > 24);
        lastWheel = now;
        lastAbs = abs;
        if (!fresh) return;
        quiet = false;
      }
      lastWheel = now;
      lastAbs = abs;
      step(dir);
    },
    { passive: false, signal: ac.signal },
  );

  /* touch: the screen follows the finger 1:1, then finishes on release */
  var tch = null;
  deck.addEventListener(
    "touchstart",
    function (e) {
      if (
        e.touches.length !== 1 ||
        busy ||
        root.classList.contains("menu-open") ||
        root.classList.contains("modal-open")
      ) {
        tch = null;
        return;
      }
      var y = e.touches[0].clientY;
      tch = {
        y0: y,
        x0: e.touches[0].clientX,
        decided: false,
        drag: false,
        lastY: y,
        lastT: performance.now(),
        v: 0,
      };
    },
    { passive: true, signal: ac.signal },
  );

  deck.addEventListener(
    "touchmove",
    function (e) {
      if (!tch) return;
      var y = e.touches[0].clientY,
        x = e.touches[0].clientX,
        now = performance.now();
      var dy = tch.y0 - y; // >0: finger moving up = forward
      if (!tch.decided) {
        if (Math.abs(dy) < 6) {
          if (!isScroll(slides[cur])) e.preventDefault();
          return;
        }
        tch.decided = true;
        if (Math.abs(x - tch.x0) > Math.abs(dy)) return; // sideways (e.g. the tab strip)
        var dir = dy > 0 ? 1 : -1;
        if (canScroll(slides[cur], dir)) return; // let the screen scroll itself
        if ((dir > 0 && cur === slides.length - 1) || (dir < 0 && cur === 0)) return;
        tch.drag = true;
        tch.dir = dir;
        tch.y0 = y;
        dy = 0;
        tch.el = dir > 0 ? slides[cur + 1] : slides[cur];
        if (dir > 0) {
          tch.el.classList.remove("is-far");
          tch.el.style.visibility = "visible";
        } else slides[cur - 1].classList.remove("is-far");
        tch.el.style.transition = "none";
        tch.el.classList.add("moving");
      }
      if (!tch.drag) return;
      e.preventDefault();
      var H = vh(),
        off = tch.dir > 0 ? Math.min(H, Math.max(0, H - dy)) : Math.min(H, Math.max(0, -dy));
      tch.off = off;
      tch.el.style.transform = "translate3d(0," + off + "px,0)";
      var dt = now - tch.lastT;
      if (dt > 0) tch.v = 0.8 * ((tch.lastY - y) / dt) + 0.2 * tch.v; // px/ms, >0 = forward
      tch.lastY = y;
      tch.lastT = now;
    },
    { passive: false, signal: ac.signal },
  );

  function touchEnd() {
    var t = tch;
    tch = null;
    if (!t || !t.drag) return;
    var H = vh(),
      off = t.off != null ? t.off : t.dir > 0 ? H : 0;
    if (performance.now() - t.lastT > 120) t.v = 0; // finger rested before lifting: no flick
    var moved = t.dir > 0 ? H - off : off; // px travelled toward the next screen
    var flick = t.dir > 0 ? t.v > 0.35 : t.v < -0.35;
    var back = t.dir > 0 ? t.v < -0.35 : t.v > 0.35;
    var commit = !back && (moved > H * 0.15 || flick);
    var rest = commit ? H - moved : moved;
    var speed = Math.max(Math.abs(t.v), 1.2);
    var dur = Math.max(180, Math.min(DURATION, rest / speed + 110));
    if (commit) {
      go(cur + t.dir, { from: off, dur: dur, ease: EASE_OUT });
    } else {
      busy = true;
      slideTo(t.el, t.dir > 0 ? H : 0, dur, EASE_OUT, function () {
        busy = false;
        layout();
      });
    }
  }
  deck.addEventListener("touchend", touchEnd, { passive: true, signal: ac.signal });
  deck.addEventListener("touchcancel", touchEnd, { passive: true, signal: ac.signal });

  /* keys */
  document.addEventListener(
    "keydown",
    function (e) {
      if (root.classList.contains("menu-open") || root.classList.contains("modal-open")) return;
      if (e.target.closest && e.target.closest("input, textarea, select, .mn-tabs")) return;
      var down = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      var up = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      var dir = down ? 1 : -1;
      if (!busy && canScroll(slides[cur], dir)) return;
      e.preventDefault();
      if (!busy) step(dir);
    },
    { signal: ac.signal },
  );

  /* in-page links: move to the screen that holds the target, scrolling inside it if needed */
  function scrollInner(s, to) {
    var start = s.scrollTop,
      dist = to - start;
    if (Math.abs(dist) < 1 || still.matches) {
      s.scrollTop = to;
      return;
    }
    var dur = Math.min(900, 300 + Math.abs(dist) * 0.25),
      t0 = performance.now();
    (function frame(now) {
      var t = Math.min(1, (now - t0) / dur);
      s.scrollTop = start + dist * (-(Math.cos(Math.PI * t) - 1) / 2);
      if (t < 1) requestAnimationFrame(frame);
    })(t0);
  }
  function goToEl(el) {
    var idx = -1;
    slides.forEach(function (s, i) {
      if (idx === -1 && (s === el || s.contains(el))) idx = i;
    });
    if (idx === -1)
      slides.forEach(function (s, i) {
        if (idx === -1 && el.contains(s)) idx = i;
      });
    if (idx === -1) return;
    var s = slides[idx],
      y = 0;
    if (isScroll(s) && el !== s) {
      y =
        el.getBoundingClientRect().top -
        s.getBoundingClientRect().top +
        s.scrollTop -
        (parseFloat(getComputedStyle(el).scrollMarginTop) || 0);
    }
    if (idx === cur) {
      if (isScroll(s)) scrollInner(s, y);
      return;
    }
    if (isScroll(s)) s.scrollTop = y; // land already in place
    go(idx, { dur: Math.abs(idx - cur) > 1 ? DURATION * 1.25 : DURATION });
  }
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.hasAttribute("data-close-nav")) return;
      var id = a.getAttribute("href").slice(1);
      var el = id === "top" ? slides[0] : document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      goToEl(el);
    },
    { signal: ac.signal },
  );

  // header colour/blur follows content while a screen scrolls internally
  deck.querySelectorAll(".slide.scroll").forEach(function (s) {
    s.addEventListener("scroll", onScroll, { passive: true, signal: ac.signal });
  });
  phone.addEventListener("change", collect, { signal: ac.signal });
  collect();

  /* ---- service menu data (prices from the shop price list) ---- */
  var IMG = {
    colour: "/images/portrait-colour.jpg",
    bob: "/images/bob-copper.jpg",
    mono: "/images/portrait-mono.jpg",
    parlor: "/images/parlor-reception.jpg",
  };
  var CHEM = "Chemical services don’t include a haircut, wash or finish — add one when you book.";
  var MENU = {
    cut: {
      name: "Cut & Style",
      images: [IMG.colour, IMG.mono],
      media: IMG.colour,
      mediaPos: "50% 30%",
      intro: [
        "Every appointment starts with a conversation about how you wear your hair. Cuts are shaped to your texture and routine, then finished so you leave ready.",
        "Choose from Rave, John or Julian. Styling and up-dos are available for events, weddings and nights out.",
      ],
      items: [
        {
          name: "Cutting & Finishing",
          cols: ["Gentleman", "Ladies", "Under 12s"],
          rows: [
            { label: "Rave", sub: "Mon, Thu, Fri, Sat & Sun", prices: ["£55", "£80", "£35"] },
            {
              label: "John",
              sub: "Tue, Wed, Thu, Fri & occasional Sat",
              prices: ["£45", "£60", "£30"],
            },
            { label: "Julian", sub: "Thu, Fri, Sat & Sun", prices: ["£40", "£65", "£30"] },
          ],
          from: "£30",
          desc: "A consultation, precision cut, wash and finish with Rave, John or Julian.",
          ideal: "Regular trims, a change of shape, or a complete restyle.",
          note: "Prices depend on your barber. All haircut services include wash and finishing.",
        },
        {
          name: "Cleansing & Styling",
          range: "£30 – £40",
          from: "£30",
          desc: "A wash with a blow-dry or style — sleek, smooth or full of volume.",
          ideal: "A reset between cuts, or looking polished for an evening out.",
          note: "Priced for ladies. The same with Rave, John and Julian.",
        },
        {
          name: "Up-do Hairdressing",
          range: "£30 – £80",
          from: "£30",
          desc: "Pinned and set styles, from soft and loose to sculpted. Price depends on length and detail.",
          ideal: "Weddings, parties and special occasions.",
          note: "Priced for ladies. The same with Rave, John and Julian.",
        },
      ],
    },
    colour: {
      name: "Colour & Highlights",
      images: [IMG.bob, IMG.colour],
      media: IMG.bob,
      mediaPos: "50% 30%",
      intro: [
        "From natural tones to statement shades like copper, colour is matched to your skin tone and the look you’re after.",
        "Highlights add brightness and dimension; technical work is priced after a consultation.",
      ],
      items: [
        {
          name: "Root Retouching",
          cols: ["Short", "Medium", "Long"],
          prices: ["£80", "–", "–"],
          from: "£80",
          desc: "Colour applied to the regrowth at the roots, keeping your colour seamless between full colour appointments.",
          ideal: "Covering regrowth and greys between full colour appointments.",
          note: CHEM,
        },
        {
          name: "Full Head Colour",
          cols: ["Short", "Medium", "Long"],
          prices: ["£80", "£100", "£120"],
          from: "£80",
          desc: "All-over colour, from rich natural shades to vivid statement tones.",
          ideal: "Covering greys, refreshing faded colour or a complete change.",
          note: CHEM,
        },
        {
          name: "Half Head Highlights",
          cols: ["Short", "Medium", "Long"],
          prices: ["£100", "£110", "£130"],
          from: "£100",
          desc: "Highlights through the top and sides, where light naturally falls.",
          ideal: "A softer lift, or topping up between full head appointments.",
          note: CHEM,
        },
        {
          name: "Full Head Highlights",
          cols: ["Short", "Medium", "Long"],
          prices: ["£100", "£120", "£150"],
          from: "£100",
          desc: "Highlights woven through the whole head for brightness and dimension.",
          ideal: "A noticeable lift with a natural, blended finish.",
          note: CHEM,
        },
        {
          name: "Technical Highlight",
          range: "£100 – £220+",
          from: "£100",
          desc: "Advanced placement for a tailored, seamless blend. Priced after a consultation.",
          ideal: "Detailed, high-impact colour work.",
          note: CHEM,
        },
        {
          name: "Full Head Bleach",
          range: "£70 – £100",
          from: "£70",
          desc: "Lightening through the whole head, as a base for pale blondes or vivid shades.",
          ideal: "Going significantly lighter.",
          note: CHEM,
        },
      ],
    },
    perm: {
      name: "Perm & Straightening",
      images: [IMG.mono, IMG.bob],
      media: IMG.mono,
      mediaPos: "50% 30%",
      intro: [
        "Add soft movement and body with a perm, or go sleek with long-lasting ion straightening.",
        "Prices depend on hair length.",
      ],
      items: [
        {
          name: "Technical Perm (Cool Perm)",
          cols: ["Short", "Medium", "Long"],
          prices: ["£100", "£120", "£150"],
          from: "£100",
          desc: "A cool perm for soft, natural-looking movement and body.",
          ideal: "Adding texture and volume that lasts.",
          note: CHEM,
        },
        {
          name: "Half-Head Perm on Top",
          cols: ["Short"],
          prices: ["£90"],
          from: "£90",
          desc: "Volume and texture through the top section only.",
          ideal: "Shorter styles that need lift on top.",
          note: CHEM,
        },
        {
          name: "Ion Straightening",
          cols: ["Short", "Medium", "Long"],
          prices: ["£120", "£170", "£200"],
          from: "£120",
          desc: "Long-lasting straightening for smooth, sleek, frizz-free hair.",
          ideal: "Taming frizz and cutting down daily styling time.",
          note: CHEM,
        },
      ],
    },
    treat: {
      name: "Treatments",
      images: [IMG.parlor, IMG.bob],
      media: IMG.parlor,
      mediaPos: "40% 50%",
      intro: [
        "Olaplex repairs broken bonds inside the hair, protecting it through colour, bleach and perm services.",
        "Add it to any chemical service, or relax with a Kérastase scalp spa.",
      ],
      items: [
        {
          name: "Olaplex No.1 & No.2",
          range: "£30",
          from: "£30",
          single: true,
          desc: "Professional bond-building treatment: No.1 before your chemical service, No.2 to finish.",
          ideal: "Anyone colouring, lightening or perming — especially regular bleach.",
        },
        {
          name: "Kérastase Scalp Relax Spa & Serum",
          range: "£15",
          from: "£15",
          single: true,
          desc: "A Kérastase scalp spa treatment with serum, to relax the scalp.",
          ideal: "A calming treat alongside your haircut or chemical service.",
        },
      ],
    },
  };
  var ORDER = ["cut", "colour", "perm", "treat"];

  var grid = document.getElementById("mn-grid");
  var current = "cut";

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function renderMenu(cat, animate) {
    current = cat;
    var c = MENU[cat];
    document.querySelectorAll(".mn-tab").forEach(function (t) {
      t.setAttribute("aria-selected", t.dataset.cat === cat ? "true" : "false");
      t.tabIndex = t.dataset.cat === cat ? 0 : -1;
    });
    document.getElementById("mn-title").textContent = c.name;
    var intro = document.getElementById("mn-intro");
    intro.textContent = "";
    c.intro.forEach(function (t) {
      intro.appendChild(el("p", null, t));
    });
    grid.textContent = "";
    var nodes = [];
    var media = el("div", "mn-media");
    var mi = el("img");
    mi.src = c.media;
    mi.alt = "";
    mi.style.objectPosition = c.mediaPos;
    media.appendChild(mi);
    c.items.forEach(function (it, i) {
      var card = el("article", "mn-card");
      card.tabIndex = 0;
      card.dataset.i = i;
      card.setAttribute(
        "aria-label",
        it.name + ", " + (it.single ? it.range : "from " + it.from) + ". Open details",
      );
      card.appendChild(el("h3", null, it.name));
      var pr = el("div", "mn-price");
      if (it.range) pr.textContent = it.range;
      else if (it.cols && it.cols.length > 1) {
        var sm = el("small", null, "From");
        sm.style.margin = "0 8px 0 0";
        pr.appendChild(sm);
        pr.appendChild(document.createTextNode(it.from));
      } else pr.textContent = it.from;
      card.appendChild(pr);
      card.appendChild(el("p", null, it.desc));
      var acts = el("div", "mn-actions");
      var bk = el("a", "mn-booknow", "Book now");
      bk.href = "#book";
      var more = el("button", "mn-more", "Learn more");
      more.type = "button";
      acts.appendChild(bk);
      acts.appendChild(more);
      card.appendChild(acts);
      nodes.push(card);
    });
    // portrait photo beside the cards; CSS sizes the grid from the number of services (data-n)
    if (c.items.length >= 2) media.classList.add("tall");
    grid.setAttribute("data-n", c.items.length);
    [media].concat(nodes).forEach(function (n, i) {
      if (animate && !still.matches) {
        n.classList.add("mn-in");
        n.style.animationDelay = i * 50 + "ms";
      }
      grid.appendChild(n);
    });
  }

  document.querySelectorAll(".mn-tab").forEach(function (t) {
    t.addEventListener(
      "click",
      function () {
        renderMenu(t.dataset.cat, true);
      },
      { signal: ac.signal },
    );
    t.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        var i = ORDER.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1);
        i = (i + ORDER.length) % ORDER.length;
        renderMenu(ORDER[i], true);
        document.querySelector('.mn-tab[data-cat="' + ORDER[i] + '"]').focus();
      },
      { signal: ac.signal },
    );
  });
  // the Services overview cards pick the matching tab
  document.querySelectorAll(".svc-card[data-cat]").forEach(function (a) {
    a.addEventListener(
      "click",
      function () {
        renderMenu(a.dataset.cat, false);
      },
      { signal: ac.signal },
    );
  });
  renderMenu("cut", false);

  /* ---- detail panel: expands out of the clicked card ---- */
  var md = document.getElementById("md"),
    panel = document.getElementById("md-panel");
  var openCard = null,
    mdBusy = false;
  var EXPAND = 560;

  function fillModal(item, cat) {
    var c = MENU[cat];
    document.getElementById("md-cat").textContent = c.name;
    document.getElementById("md-name").textContent = item.name;
    var pr = document.getElementById("md-price");
    pr.textContent = "";
    if (item.cols) {
      var t = el("table"),
        hr = el("tr");
      var rows = item.rows || [{ prices: item.prices }];
      if (item.rows) {
        t.className = "has-rows";
        hr.appendChild(el("th"));
      }
      item.cols.forEach(function (h) {
        hr.appendChild(el("th", null, h));
      });
      var th = el("thead");
      th.appendChild(hr);
      var tb = el("tbody");
      rows.forEach(function (row) {
        var vr = el("tr");
        if (item.rows) {
          var rh = el("th", null, row.label);
          rh.scope = "row";
          if (row.sub) rh.appendChild(el("small", null, row.sub));
          vr.appendChild(rh);
        }
        row.prices.forEach(function (v) {
          vr.appendChild(el("td", null, v));
        });
        tb.appendChild(vr);
      });
      t.appendChild(th);
      t.appendChild(tb);
      pr.appendChild(t);
    } else pr.appendChild(el("div", "one", item.range));
    document.getElementById("md-desc").textContent = item.desc;
    document.getElementById("md-ideal").textContent = item.ideal || "";
    document.getElementById("md-ideal-wrap").style.display = item.ideal ? "" : "none";
    document.getElementById("md-note").textContent = item.note || "";
    document.getElementById("md-note-wrap").style.display = item.note ? "" : "none";
    var gallery = panel.querySelector(".md-media");
    gallery.textContent = "";
    c.images.forEach(function (src) {
      var im = el("img");
      im.src = src;
      im.alt = "";
      gallery.appendChild(im);
    });
    panel.querySelector(".md-body").scrollTop = 0;
  }

  function rectTransform(from, to) {
    return (
      "translate(" +
      (from.left - to.left) +
      "px," +
      (from.top - to.top) +
      "px) scale(" +
      from.width / to.width +
      "," +
      from.height / to.height +
      ")"
    );
  }

  function openModal(card) {
    if (mdBusy) return;
    var item = MENU[current].items[+card.dataset.i];
    fillModal(item, current);
    openCard = card;
    mdBusy = true;
    md.classList.add("open");
    md.setAttribute("aria-hidden", "false");
    root.classList.add("modal-open");
    var to = panel.getBoundingClientRect(),
      from = card.getBoundingClientRect();
    if (still.matches) {
      md.classList.add("show", "ready");
      mdBusy = false;
      panel.querySelector(".md-close").focus({ preventScroll: true });
      return;
    }
    panel.style.transition = "none";
    panel.style.transform = rectTransform(from, to);
    void panel.offsetWidth; // commit the start state
    card.style.visibility = "hidden";
    panel.style.transition = "transform " + EXPAND + "ms cubic-bezier(.2,.75,.15,1)";
    panel.style.transform = "none";
    md.classList.add("show");
    setTimeout(function () {
      md.classList.add("ready");
      mdBusy = false;
      panel.querySelector(".md-close").focus({ preventScroll: true });
    }, EXPAND - 120);
  }

  function closeModal(after) {
    if (!md.classList.contains("open") || mdBusy) return;
    mdBusy = true;
    md.classList.remove("ready");
    var card = openCard;
    var finish = function () {
      md.classList.remove("open", "show");
      md.setAttribute("aria-hidden", "true");
      panel.style.transition = "none";
      panel.style.transform = "";
      root.classList.remove("modal-open");
      if (card) {
        card.style.visibility = "";
      }
      openCard = null;
      mdBusy = false;
      if (after) after();
      else if (card) card.focus({ preventScroll: true });
    };
    if (still.matches || !card || !card.isConnected) {
      finish();
      return;
    }
    var to = panel.getBoundingClientRect(),
      from = card.getBoundingClientRect();
    setTimeout(function () {
      panel.style.transition = "transform " + (EXPAND - 80) + "ms cubic-bezier(.5,0,.2,1)";
      panel.style.transform = rectTransform(from, to);
      md.classList.remove("show");
      setTimeout(finish, EXPAND - 60);
    }, 160);
  }

  grid.addEventListener(
    "click",
    function (e) {
      var card = e.target.closest(".mn-card");
      if (!card) return;
      if (e.target.closest(".mn-booknow")) return; // straight to booking
      openModal(card);
    },
    { signal: ac.signal },
  );
  grid.addEventListener(
    "keydown",
    function (e) {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("mn-card")) {
        e.preventDefault();
        openModal(e.target);
      }
    },
    { signal: ac.signal },
  );
  md.addEventListener(
    "click",
    function (e) {
      if (e.target.closest("[data-close]")) {
        e.preventDefault();
        closeModal();
        return;
      }
      var nav = e.target.closest("[data-close-nav]");
      if (nav) {
        e.preventDefault();
        e.stopPropagation();
        var target = document.getElementById(nav.getAttribute("href").slice(1));
        closeModal(function () {
          goToEl(target);
        });
      }
    },
    { signal: ac.signal },
  );
  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key === "Escape" && md.classList.contains("open")) closeModal();
      if (e.key === "Tab" && md.classList.contains("ready")) {
        // keep focus inside the panel
        var f = panel.querySelectorAll("button, a[href]");
        if (!f.length) return;
        var first = f[0],
          last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    { signal: ac.signal },
  );

  /* ---- fade-in for the price list and visit sections ---- */
  if ("IntersectionObserver" in window && !still.matches) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("in");
    });
  }

  window.addEventListener("resize", onScroll, { passive: true, signal: ac.signal });
  window.addEventListener("load", update, { signal: ac.signal });
  update();

  return function destroy() {
    ac.abort();
    if (io) io.disconnect();
    root.classList.remove("menu-open", "modal-open");
  };
}
