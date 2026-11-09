/*
 * Behaviour for the parts of the page that are still vanilla: the service menu and its detail
 * panel, and reveal-on-scroll. It drives server-rendered markup in the DOM, so it lives outside
 * React. The deck, the menu and the header tone are React (see components/deck and
 * lib/deck). `initSiteBehavior` returns a cleanup function.
 */
import { serviceMessage, whatsappLink } from "./contact";

export function initSiteBehavior() {
  var ac = new AbortController();
  var io = null;

  var root = document.documentElement;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- service menu data (prices from the shop price list) ---- */
  var IMG = {
    colour: "/images/portrait-colour.jpg",
    bob: "/images/bob-copper.jpg",
    mono: "/images/portrait-mono.jpg",
    parlor: "/images/parlor-reception.jpg",
  };
  var CHEM = "Chemical services don’t include a haircut, wash or finish — add one when you book.";
  var BARBERS = [
    { name: "Rave", days: "Mon, Thu, Fri, Sat & Sun" },
    { name: "John", days: "Tue, Wed, Thu, Fri & occasional Sat" },
    { name: "Julian", days: "Thu, Fri, Sat & Sun" },
  ];
  var CUT_PRICES = [
    ["£55", "£80", "£35"],
    ["£45", "£60", "£30"],
    ["£40", "£65", "£30"],
  ];
  var MENU = {
    cut: {
      name: "Cut & Style",
      images: [IMG.colour, IMG.mono],
      media: IMG.colour,
      mediaPos: "50% 30%",
      barbers: BARBERS,
      intro: [
        "Every appointment starts with a conversation about how you wear your hair. Cuts are shaped to your texture and routine, then finished so you leave ready.",
        "Choose from Rave, John or Julian. Styling and up-dos are available for events, weddings and nights out.",
      ],
      items: [
        {
          name: "Cutting & Finishing",
          cols: ["Gentleman", "Ladies", "Under 12s"],
          rows: BARBERS.map(function (b, i) {
            return { label: b.name, sub: b.days, prices: CUT_PRICES[i] };
          }),
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
      bk.href = whatsappLink(
        serviceMessage({ service: it.name, barber: null, chooseBarber: !!c.barbers, cut: null }),
      );
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
  var shownItem = null,
    shownCat = null,
    pickedBarber = null,
    pickedCut = null,
    hasPick = false;
  var EXPAND = 560;

  function isPrice(v) {
    return !!v && v !== "–" && v !== "-";
  }

  // a single price row with at least two real prices (e.g. hair lengths) has something to choose
  function hasChoices(item) {
    return !!item.cols && !!item.prices && !item.rows && item.prices.filter(isPrice).length >= 2;
  }

  // services in a category that has barbers get the picker, as do services with several price columns
  function pickable(item, c) {
    return !!c.barbers || hasChoices(item);
  }

  function updateWhatsApp() {
    panel.querySelector(".md-book").href = whatsappLink(
      serviceMessage({
        service: shownItem.name,
        barber: pickedBarber,
        chooseBarber: !!MENU[shownCat].barbers,
        cut: pickedCut,
      }),
    );
  }

  var flipped = false;
  function setFlipped(on) {
    flipped = on;
    var flip = document.getElementById("md-flip"),
      front = document.getElementById("md-front");
    if (on) flip.setAttribute("data-flipped", "");
    else flip.removeAttribute("data-flipped");
    front.inert = on;
    front.setAttribute("aria-hidden", on ? "true" : "false");
    panel.querySelector(".md-book").textContent = on ? "Continue on WhatsApp" : "Book now";
    panel.querySelector(".md-back-btn").hidden = !on;
    document.querySelectorAll("#md-price .md-cell").forEach(function (b) {
      b.disabled = !on;
    });
    document.querySelectorAll("#md-price table, #md-price .md-who").forEach(function (pt) {
      pt.classList.toggle("is-picking", on);
    });
    var bk = panel.querySelector(".md-book");
    if (on && !hasPick) bk.setAttribute("aria-disabled", "true");
    else bk.removeAttribute("aria-disabled");
  }

  function pickCell(btn) {
    pickedBarber = btn.dataset.barber || null;
    pickedCut = btn.dataset.cut || null;
    hasPick = true;
    document.querySelectorAll("#md-price .md-cell").forEach(function (b) {
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    var tbl = btn.closest("table");
    if (tbl) {
      var tr = btn.closest("tr"),
        ci = btn.closest("td").cellIndex;
      tbl.classList.add("has-sel");
      tbl.querySelectorAll("tbody tr").forEach(function (r) {
        r.classList.toggle("is-on", r === tr);
      });
      tbl.querySelectorAll("thead th").forEach(function (h, i) {
        h.classList.toggle("is-on", i === ci);
      });
    }
    panel.querySelector(".md-book").removeAttribute("aria-disabled");
    updateWhatsApp();
  }

  function fillModal(item, cat) {
    shownItem = item;
    shownCat = cat;
    pickedBarber = null;
    pickedCut = null;
    hasPick = false;
    var c = MENU[cat];
    document.getElementById("md-cat").textContent = c.name;
    document.getElementById("md-name").textContent = item.name;
    var pr = document.getElementById("md-price");
    pr.textContent = "";
    function cellBtn(barber, cut, price, text) {
      var b = el("button", "md-cell", text || price);
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.disabled = true;
      b.dataset.barber = barber;
      b.dataset.cut = cut;
      b.dataset.price = price;
      return b;
    }
    function barberHead(label, sub) {
      var h = el("th", null, label);
      h.scope = "row";
      if (sub) h.appendChild(el("small", null, sub));
      return h;
    }
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
        if (item.rows) vr.appendChild(barberHead(row.label, row.sub));
        row.prices.forEach(function (v, idx) {
          var td = el("td");
          if (item.rows) td.appendChild(cellBtn(row.label, item.cols[idx], v));
          else if (hasChoices(item) && isPrice(v)) {
            var cutLabel =
              item.cols.join("|") === "Short|Medium|Long"
                ? item.cols[idx] + " length"
                : item.cols[idx];
            td.appendChild(cellBtn("", cutLabel, v));
          } else td.textContent = v;
          vr.appendChild(td);
        });
        tb.appendChild(vr);
      });
      if (c.barbers && item.rows) {
        var ar = el("tr", "md-any");
        ar.appendChild(barberHead("No preference"));
        item.cols.forEach(function (col, idx) {
          var min = Math.min.apply(
            null,
            item.rows.map(function (r) {
              return parseInt(r.prices[idx].replace(/[^\d]/g, ""), 10);
            }),
          );
          var td = el("td");
          td.appendChild(cellBtn("", col, "from £" + min));
          ar.appendChild(td);
        });
        tb.appendChild(ar);
      }
      t.appendChild(th);
      t.appendChild(tb);
      pr.appendChild(t);
    } else {
      pr.appendChild(el("div", "one", item.range));
      if (c.barbers) {
        // single price, but still choose the barber: names only, shown while picking
        var who = el("div", "md-who");
        c.barbers.forEach(function (b) {
          who.appendChild(cellBtn(b.name, "", "", b.name));
        });
        who.appendChild(cellBtn("", "", "", "No preference"));
        pr.appendChild(who);
      }
    }
    document.getElementById("md-desc").textContent = item.desc;
    document.getElementById("md-ideal").textContent = item.ideal || "";
    document.getElementById("md-ideal-wrap").style.display = item.ideal ? "" : "none";
    document.getElementById("md-note").textContent = item.note || "";
    document.getElementById("md-note-wrap").style.display = item.note ? "" : "none";
    setFlipped(false);
    updateWhatsApp();
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

  function openModal(card, picking) {
    if (mdBusy) return;
    var item = MENU[current].items[+card.dataset.i];
    fillModal(item, current);
    if (picking) setFlipped(true);
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

  function closeModal() {
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
      if (card) card.focus({ preventScroll: true });
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
      if (e.target.closest(".mn-booknow")) {
        var bookItem = MENU[current].items[+card.dataset.i];
        if (pickable(bookItem, MENU[current])) {
          // options to choose from: open the details already in the booking step
          e.preventDefault();
          openModal(card, true);
        }
        return; // otherwise the link goes straight to WhatsApp
      }
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
      if (e.target.closest(".md-book") && pickable(shownItem, MENU[shownCat]) && !flipped) {
        e.preventDefault();
        setFlipped(true);
        document
          .getElementById("md-price")
          .scrollIntoView({ block: "nearest", behavior: still.matches ? "auto" : "smooth" });
        return;
      }
      if (e.target.closest(".md-book") && flipped && !hasPick) {
        e.preventDefault();
        var priceEl = document.getElementById("md-price");
        priceEl.classList.add("nudge");
        setTimeout(function () {
          priceEl.classList.remove("nudge");
        }, 600);
        return;
      }
      var cell = e.target.closest(".md-cell");
      if (cell && !cell.disabled) {
        pickCell(cell);
        return;
      }
      if (e.target.closest(".md-back-btn")) {
        e.preventDefault();
        setFlipped(false);
        panel.querySelector(".md-book").focus({ preventScroll: true });
        return;
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

  return function destroy() {
    ac.abort();
    if (io) io.disconnect();
    root.classList.remove("modal-open");
  };
}
