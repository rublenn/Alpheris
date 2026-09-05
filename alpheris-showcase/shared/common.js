// Pass 2 — animation layer (GSAP + ScrollTrigger).
// Everything here adds motion on top of the Pass 1 structure; nothing here
// changes layout, spacing, or content.

(function () {
  if (typeof gsap === "undefined") return;

  gsap.registerPlugin(ScrollTrigger);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initLoader();
    initHeaderScroll();
    initHeroVideoSlider();
    initMarquees();
    initPhilosophyReveal();
    initPhilosophyTagToggles();
    initQuestionsFill();
    initGenericReveals();
    initPhotoDeckStack();
  });

  // ---- Step 1 / Step 2: loader intro -> resolves into the header logo ----
  function initLoader() {
    var loader = document.querySelector("#loader");
    var lockup = document.querySelector(".loader__lockup");
    var headerLogo = document.querySelector(".site-header .logo");
    var heroHeadline = document.querySelector(".hero__headline");
    var heroCtas = document.querySelector(".hero__ctas");

    if (!loader || !lockup || !headerLogo) return;

    if (reduceMotion) {
      gsap.set(loader, { display: "none" });
      return;
    }

    // Lift the loader out of document flow so it overlays the page during
    // the intro, without ever touching the Pass 1 layout underneath it.
    gsap.set(loader, { position: "fixed", inset: 0, zIndex: 100 });
    gsap.set(headerLogo, { autoAlpha: 0 });
    if (heroHeadline) gsap.set(heroHeadline, { autoAlpha: 0, y: 24 });
    if (heroCtas) gsap.set(heroCtas, { autoAlpha: 0, y: 24 });

    var loaderRect = lockup.getBoundingClientRect();
    var logoRect = headerLogo.getBoundingClientRect();
    var scale = logoRect.width / loaderRect.width;
    var deltaX = logoRect.left + logoRect.width / 2 - (loaderRect.left + loaderRect.width / 2);
    var deltaY = logoRect.top + logoRect.height / 2 - (loaderRect.top + loaderRect.height / 2);

    var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    tl.from(lockup, { autoAlpha: 0, y: 24, duration: 0.7, ease: "power2.out" })
      .to({}, { duration: 0.35 }) // hold
      .to(lockup, { x: deltaX, y: deltaY, scale: scale, duration: 0.9 })
      .to(loader, { autoAlpha: 0, duration: 0.35 }, "-=0.25")
      .set(loader, { display: "none" })
      .to(headerLogo, { autoAlpha: 1, duration: 0.3 }, "<")
      .to(heroHeadline, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.1")
      .to(heroCtas, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power2.out" }, "-=0.5");
  }

  // ---- Step 2: header background, transparent -> solid on scroll ----
  function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    ScrollTrigger.create({
      start: 40,
      toggleClass: { targets: header, className: "is-scrolled" },
    });
  }

  // ---- Hero background: videos cycle in order, each new one sliding down
  // to cover the one currently playing ----
  function initHeroVideoSlider() {
    var videos = document.querySelectorAll(".hero__bg-video");
    if (!videos.length) return;

    var first = videos[0];

    if (reduceMotion || videos.length === 1) {
      first.setAttribute("loop", "");
      first.play().catch(function () {});
      for (var i = 1; i < videos.length; i++) gsap.set(videos[i], { display: "none" });
      return;
    }

    videos.forEach(function (v, i) {
      gsap.set(v, { yPercent: i === 0 ? 0 : -100, opacity: 1, zIndex: i + 1 });
    });

    var current = 0;
    var zCounter = videos.length;

    function playNext() {
      var next = (current + 1) % videos.length;
      var incoming = videos[next];
      var outgoing = videos[current];

      zCounter += 1;
      gsap.set(incoming, { zIndex: zCounter });

      gsap.to(incoming, {
        yPercent: 0,
        duration: 2,
        ease: "power3.inOut",
        onStart: function () {
          incoming.currentTime = 0;
          incoming.play().catch(function () {});
        },
        onComplete: function () {
          gsap.set(outgoing, { yPercent: -100 });
        },
      });

      current = next;
    }

    videos.forEach(function (v) {
      v.addEventListener("ended", playNext);
    });
    first.play().catch(function () {});
  }

  // ---- Step 4 / Step 7: marquees scroll continuously leftward ----
  function initMarquees() {
    if (reduceMotion) return;

    document.querySelectorAll(".marquee__track").forEach(function (track) {
      // Content is duplicated x2 in the markup, so translating exactly
      // -50% loops seamlessly back to the start.
      gsap.to(track, {
        xPercent: -50,
        duration: 22,
        ease: "none",
        repeat: -1,
      });
    });
  }

  // Wrap every word of an element's text (including inside nested tags,
  // e.g. .highlight spans) in its own <span class="reveal-word">, so each
  // word can be animated independently without altering the visible text.
  function wrapWords(el) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim().length) textNodes.push(node);
    }

    textNodes.forEach(function (textNode) {
      // Word spans + the plain whitespace between them are wrapped in one
      // inline <span> rather than inserted as siblings directly — a flex
      // container (e.g. .founder__portrait) discards whitespace-only text
      // nodes between flex-level boxes, which would otherwise collapse the
      // spaces away. Nesting them one level deep keeps normal inline
      // formatting (and its whitespace/wrapping rules) in effect.
      var wrapper = document.createElement("span");
      var words = textNode.nodeValue.split(/(\s+)/);
      words.forEach(function (word) {
        if (word.trim().length === 0) {
          wrapper.appendChild(document.createTextNode(word));
        } else {
          var span = document.createElement("span");
          span.className = "reveal-word";
          span.textContent = word;
          wrapper.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(wrapper, textNode);
    });

    return el.querySelectorAll(".reveal-word");
  }

  // ---- Step 5: philosophy statement — a "spotlight" moves through the
  // text as you scroll: only the word(s) near the middle of the viewport
  // are bright, words above and below are dim. The two highlighted phrases
  // ("discovered your business", "became your customers") are excluded —
  // they stay fully bright the whole time. ----
  function initPhilosophyReveal() {
    var statement = document.querySelector(".philosophy");
    if (!statement) return;

    var wordSpans = wrapWords(statement);
    if (!wordSpans.length) return;

    var DIM = 0.15;
    var plainWords = [];

    wordSpans.forEach(function (span) {
      if (span.closest(".highlight")) {
        gsap.set(span, { opacity: 1 });
      } else {
        plainWords.push(span);
      }
    });

    gsap.set(plainWords, { opacity: DIM });

    plainWords.forEach(function (span) {
      gsap.timeline({
        scrollTrigger: {
          trigger: span,
          start: "top 68%",
          end: "top 32%",
          scrub: true,
        },
      })
        .fromTo(span, { opacity: DIM }, { opacity: 1, ease: "none" })
        .to(span, { opacity: DIM, ease: "none" });
    });
  }

  // ---- Philosophy: click a highlighted phrase to pop in its metric tags;
  // clicking its trigger again, another trigger, or anywhere else closes it ----
  function initPhilosophyTagToggles() {
    var triggers = document.querySelectorAll(".philosophy__trigger");
    if (!triggers.length) return;

    var pairs = Array.prototype.map.call(triggers, function (btn) {
      return { btn: btn, target: document.getElementById(btn.getAttribute("aria-controls")) };
    }).filter(function (pair) {
      return !!pair.target;
    });

    function close(pair) {
      var btn = pair.btn;
      var target = pair.target;
      if (btn.getAttribute("aria-expanded") !== "true") return;

      if (reduceMotion) {
        target.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        return;
      }

      gsap.to(target.children, {
        opacity: 0,
        scale: 0.8,
        y: 6,
        duration: 0.25,
        stagger: 0.03,
        ease: "power1.in",
        onComplete: function () {
          target.hidden = true;
        },
      });
      btn.setAttribute("aria-expanded", "false");
    }

    function open(pair) {
      var btn = pair.btn;
      var target = pair.target;

      if (reduceMotion) {
        target.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        return;
      }

      target.hidden = false;
      gsap.fromTo(
        target.children,
        { opacity: 0, scale: 0.7, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "back.out(1.7)" }
      );
      btn.setAttribute("aria-expanded", "true");
    }

    pairs.forEach(function (pair) {
      pair.btn.addEventListener("click", function (event) {
        event.stopPropagation();
        var isOpen = pair.btn.getAttribute("aria-expanded") === "true";

        pairs.forEach(function (other) {
          if (other !== pair) close(other);
        });

        if (isOpen) {
          close(pair);
        } else {
          open(pair);
        }
      });
    });

    document.addEventListener("click", function () {
      pairs.forEach(close);
    });
  }

  // ---- Photo deck: all cards sit absolutely stacked inside one pinned,
  // viewport-sized stage. As the stage is pinned, each card slides up to
  // instantly cover the previous one, then (for photo cards) its image
  // pans top -> bottom for the rest of its turn. This avoids CSS
  // position:sticky's document-flow handoff, which forces a viewport-height
  // "catch up" scroll where the outgoing and incoming cards blend together ----
  function initPhotoDeckStack() {
    var deck = document.querySelector(".photo-deck");
    var items = document.querySelectorAll(".photo-deck__item");
    if (!deck || !items.length || reduceMotion) return;

    var n = items.length;
    var imgs = [];
    var maxOffsets = [];

    items.forEach(function (item, i) {
      item.style.zIndex = i;
      imgs[i] = item.querySelector("img");
      maxOffsets[i] = 0;
    });

    gsap.set(items, { yPercent: 100 });
    gsap.set(items[0], { yPercent: 0 });

    var SLIDE_SHARE = 0.35; // portion of a card's turn spent sliding up

    // Every card gets its own full-length dedicated segment [i, i+1] of the
    // overall scroll: card 0 occupies [0,1], card 1 occupies [1,2], etc.
    // A card only starts being covered once scroll crosses into the NEXT
    // card's segment, so each card's own pan always has its full, otherwise
    // undisturbed segment to complete in — including card 0, which used to
    // get covered mid-pan because it shared its segment with card 1's slide.
    ScrollTrigger.create({
      trigger: deck,
      start: "top top",
      end: function () {
        return "+=" + n * window.innerHeight;
      },
      pin: true,
      scrub: true,
      onRefresh: function () {
        items.forEach(function (item, i) {
          maxOffsets[i] = imgs[i] ? Math.max(0, imgs[i].offsetHeight - item.offsetHeight) : 0;
        });
      },
      onUpdate: function (self) {
        var overall = self.progress * n;

        items.forEach(function (item, i) {
          var turnProgress = Math.min(Math.max(overall - i, 0), 1);

          if (i > 0) {
            var slide = Math.min(turnProgress / SLIDE_SHARE, 1);
            gsap.set(item, { yPercent: 100 * (1 - slide) });
          }

          if (imgs[i] && maxOffsets[i] > 0) {
            var panStart = i === 0 ? 0 : SLIDE_SHARE;
            var pan = Math.min(Math.max((turnProgress - panStart) / (1 - panStart), 0), 1);
            gsap.set(imgs[i], { y: -maxOffsets[i] * pan });
          }
        });
      },
    });
  }

  // ---- Step 9: questions, light fill-in effect per item on scroll ----
  function initQuestionsFill() {
    var items = document.querySelectorAll(".questions__item");
    if (!items.length) return;

    gsap.set(items, { opacity: 0.3 });

    ScrollTrigger.batch(items, {
      start: "top 85%",
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power1.out",
        });
      },
      onLeaveBack: function (batch) {
        gsap.to(batch, { opacity: 0.3, duration: 0.4 });
      },
    });
  }

  // ---- Generic reveal for sections without a bespoke effect: words
  // brighten in from a heavy dim as the section scrolls through, same
  // technique as the philosophy statement but with a stronger dim state
  // so it reads clearly against short headings/labels too ----
  function initGenericReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    items.forEach(function (el) {
      var wordSpans = wrapWords(el);
      if (!wordSpans.length) return;

      gsap.set(wordSpans, { opacity: 0.08 });
      gsap.to(wordSpans, {
        opacity: 1,
        stagger: 0.025,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
          end: "bottom 65%",
          scrub: true,
        },
      });
    });
  }
})();
