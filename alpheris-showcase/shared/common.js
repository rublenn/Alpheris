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
    initWorkHeadingReveal();
    initWorkTriggerSpotlight();
    initStorySection();
    initProcessTransition();
    initProcessStages();
    initCosmicScene();
    initStartFormOtherAim();
  });

  // ---- "Others" aim option on the Start form: enable the text field only when chosen ----
  function initStartFormOtherAim() {
    var otherRadio = document.querySelector("#f-aim-other");
    var otherInput = document.querySelector("#f-aim-other-text");
    if (!otherRadio || !otherInput) return;

    var aimRadios = document.querySelectorAll('input[name="current_aim"]');
    aimRadios.forEach(function (radio) {
      radio.addEventListener("change", function () {
        var isOther = otherRadio.checked;
        otherInput.disabled = !isOther;
        if (isOther) otherInput.focus();
        else otherInput.value = "";
      });
    });
  }

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
      end: "max",
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

  // ---- Cosmic scene: Creativity, then Hype-Earth, then Neuromarketing —
  // stacked top to bottom in normal document flow (see the CSS), each
  // scrubbed in from its own direction as it individually scrolls through
  // the viewport: Creativity rises from below, Earth drops from above,
  // Neuromarketing slides in from the left. Earth also gets a slow
  // independent float on its own <img> (a separate element, so it can't
  // fight the scrubbed parent transform). ----
  function initCosmicScene() {
    var section = document.querySelector(".cosmic-scene");
    if (!section) return;

    var creativity = section.querySelector(".cosmic-scene__layer--creativity");
    var earth = section.querySelector(".cosmic-scene__layer--earth");
    var neuro = section.querySelector(".cosmic-scene__layer--neuro");
    if (!creativity || !earth || !neuro) return;

    if (reduceMotion) return;

    gsap.fromTo(
      creativity,
      { y: 120, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: { trigger: creativity, start: "top 90%", end: "top 40%", scrub: 0.4 },
      }
    );

    gsap.fromTo(
      earth,
      { y: -100, autoAlpha: 0, scale: 0.85 },
      {
        y: 0,
        autoAlpha: 1,
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: earth, start: "top 95%", end: "top 55%", scrub: 0.4 },
      }
    );

    gsap.fromTo(
      neuro,
      { x: -140, autoAlpha: 0 },
      {
        x: 0,
        autoAlpha: 1,
        ease: "none",
        scrollTrigger: { trigger: neuro, start: "top 95%", end: "top 45%", scrub: 0.4 },
      }
    );

    var earthImg = earth.querySelector("img");
    if (earthImg) {
      gsap.to(earthImg, {
        y: "+=10",
        duration: 4,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    }
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

  // A "spotlight" moves through an element's text as you scroll: only the
  // word(s) near the middle of the viewport are bright, words above and
  // below are dim. Words inside a .highlight are excluded — they stay
  // fully bright the whole time (used for the philosophy statement and the
  // work-statement trigger headings).
  function initSpotlightWords(container) {
    var wordSpans = wrapWords(container);
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

  // ---- Step 5: philosophy statement word spotlight ----
  function initPhilosophyReveal() {
    var statement = document.querySelector(".philosophy");
    if (!statement) return;
    initSpotlightWords(statement);
  }

  // ---- Work-statement trigger headings ("By Creating Ads With Purpose",
  // "...and Reasons"): same word spotlight, "Purpose"/"Reasons" stay lit ----
  function initWorkTriggerSpotlight() {
    document.querySelectorAll(".work-statement__trigger").forEach(initSpotlightWords);
  }

  // ---- Story section: a pinned scroll sequence where the narrative text
  // crossfades line to line while numbered cards arrive from below and
  // stack up behind each new arrival (grigoletti.ch-style interaction),
  // ending in a cream "final statement" card. One gsap timeline, pinned via
  // ScrollTrigger on .story__pin (same "pin the trigger, drive everything
  // off scroll progress" approach as initPhotoDeckStack), scrubbed so nothing
  // depends on real time — only scroll position. ----
  function initStorySection() {
    var section = document.querySelector(".story");
    var pin = section && section.querySelector(".story__pin");
    if (!section || !pin) return;

    var lines = Array.prototype.slice.call(pin.querySelectorAll(".story__line"));
    var cards = Array.prototype.slice.call(pin.querySelectorAll(".story-card"));
    var stack = pin.querySelector(".story__stack");
    var final = pin.querySelector(".story__final");
    if (!lines.length || !cards.length || !stack || !final) return;

    if (reduceMotion) {
      gsap.set(lines, { clearProps: "all" });
      gsap.set(lines[lines.length - 1], { position: "static", opacity: 1, filter: "none", backgroundPosition: "0% 0" });
      gsap.set(cards, { clearProps: "all", position: "static", marginBottom: "1.5rem" });
      gsap.set(document.querySelectorAll(".story-card--image .story-card__num, .story-card--image .story-card__label"), { opacity: 1 });
      gsap.set(final, { clearProps: "all", position: "static", margin: "2rem auto" });
      return;
    }

    var isCompact = window.innerWidth <= 900;

    // Each card's own resting tilt (its "identity" once settled), independent
    // of how deep in the stack it later sits — matches the brief's example
    // rotations across steps (card 1 stays near -5deg, card 2 near 2deg, etc).
    var REST_ROTATE = isCompact ? [-2, 1.2, -1.2, 0.8, -0.8] : [-4, 2, -2, 1, -1.5];

    function settledTransform(cardIndex, topIndex) {
      var depth = topIndex - cardIndex;
      return {
        y: depth === 0 ? 0 : -Math.min(30 + (depth - 1) * 25, isCompact ? 50 : 100),
        rotate: REST_ROTATE[cardIndex],
        scale: depth === 0 ? 1 : Math.max(1 - depth * 0.025, 0.92),
      };
    }

    gsap.set(lines, { opacity: 0, filter: "blur(6px)", y: 30, backgroundPosition: "160% 0" });
    gsap.set(lines[0], { opacity: 1, filter: "blur(0px)", y: 0 });
    gsap.set(cards, { y: "110vh", rotate: 2, scale: 0.94 });
    gsap.set(final, { y: "120vh" });

    // Opening moment: the first line starts big and centered on the whole
    // viewport (not just its usual left-hand column), then settles into
    // its normal position/size as the user starts scrolling — right before
    // card 1 arrives from below and the text changes for the first time.
    var openRect = lines[0].getBoundingClientRect();
    var openScale = Math.min(1.7, (window.innerWidth * 0.86) / openRect.width);
    var openOffsetX = window.innerWidth / 2 - (openRect.left + openRect.width / 2);
    var openOffsetY = window.innerHeight / 2 - (openRect.top + openRect.height / 2);
    gsap.set(lines[0], { x: openOffsetX, y: openOffsetY, scale: openScale, transformOrigin: "center center" });

    var tl = gsap.timeline();

    tl.to(lines[0], { x: 0, y: 0, scale: 1, duration: 0.6, ease: "power2.inOut" }, 0);

    // Each line's own entrance sweeps a gold sheen across it — a slower,
    // separate tween from the opacity/blur/y fade-in (different property,
    // longer duration) so the sweep keeps visibly travelling across the
    // word for a while after the text has already fully appeared, instead
    // of finishing instantly and reading as a flat color change.
    tl.fromTo(lines[0], { backgroundPosition: "160% 0" }, { backgroundPosition: "-20% 0", duration: 0.9, ease: "none" }, 0.1);

    function crossfade(at, fromLine, toLine) {
      tl.to(fromLine, { opacity: 0, y: -25, filter: "blur(6px)", duration: 0.3, ease: "power1.in" }, at)
        .fromTo(toLine, { opacity: 0, y: 30, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.3, ease: "power1.out" }, at + 0.08)
        .fromTo(toLine, { backgroundPosition: "160% 0" }, { backgroundPosition: "-20% 0", duration: 0.9, ease: "none" }, at + 0.08);
    }

    function cardCaption(card) {
      return card.querySelectorAll(".story-card__num, .story-card__label");
    }

    cards.forEach(function (card, i) {
      var at = 0.7 + i * 1;

      // line[0] ("You have a business?") is already visible from the very
      // start — no preceding intro line to crossfade away from — so only
      // cards after the first one trigger a text crossfade.
      if (i > 0) crossfade(at, lines[i - 1], lines[i]);

      var rest = settledTransform(i, i);
      tl.to(card, { y: rest.y, rotate: rest.rotate, scale: rest.scale, duration: 0.45, ease: "power3.out" }, at);
      // Only the newest (front) card shows its number/label — once a card
      // is no longer front, its caption fades away so stacked cards behind
      // it don't overlap into illegible garbled text.
      tl.to(cardCaption(card), { opacity: 1, duration: 0.3, ease: "power1.out" }, at + 0.1);

      for (var j = 0; j < i; j++) {
        var back = settledTransform(j, i);
        tl.to(cards[j], { y: back.y, rotate: back.rotate, scale: back.scale, duration: 0.45, ease: "power3.out" }, at);
        tl.to(cardCaption(cards[j]), { opacity: 0, duration: 0.3, ease: "power1.in" }, at);
      }
    });

    var closeAt = 0.7 + cards.length * 1 - 0.3;
    tl.to(lines[lines.length - 1], { opacity: 0, y: -25, filter: "blur(6px)", duration: 0.3, ease: "power1.in" }, closeAt)
      .to(stack, { scale: 0.88, y: "-=40", duration: 0.4, ease: "power2.inOut" }, closeAt)
      .to(final, { y: 0, duration: 0.55, ease: "power3.out" }, closeAt + 0.25);

    ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: function () {
        return "+=" + Math.round(window.innerHeight * (tl.duration() + 0.6));
      },
      pin: true,
      scrub: 0.5,
      animation: tl,
      invalidateOnRefresh: true,
    });
  }

  // ---- Process transition: the story's resting "Now, this is how we
  // work" card grows from a small paper card into a fullscreen dark panel,
  // its lead line fading out as an eyebrow ("How Alpheris Executes")
  // fades in — the bridge from the story's pinned section into the
  // pinned Content/Performance/Ground stages below ----
  function initProcessTransition() {
    var section = document.querySelector(".process-transition");
    var pin = section && section.querySelector(".process-transition__pin");
    var card = pin && pin.querySelector(".process-transition__card");
    var lead = pin && pin.querySelector(".process-transition__lead");
    var eyebrow = pin && pin.querySelector(".process-transition__eyebrow");
    if (!section || !pin || !card || !lead || !eyebrow) return;

    if (reduceMotion) {
      gsap.set([card, lead, eyebrow], { clearProps: "all" });
      return;
    }

    gsap.set(eyebrow, { opacity: 0, y: 20 });

    var tl = gsap.timeline();
    tl.to(lead, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.15)
      .to(card, { width: "100vw", height: "100vh", borderRadius: 0, duration: 0.6, ease: "power2.inOut" }, 0.1)
      .to(card, { backgroundColor: "#0d0d0c", borderColor: "transparent", duration: 0.3, ease: "none" }, 0.45)
      .to(eyebrow, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.65)
      .to(eyebrow, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.92);

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom top",
      pin: pin,
      scrub: 0.5,
      animation: tl,
      invalidateOnRefresh: true,
    });
  }

  // ---- Process stages (Content / Performance / Ground): each pins while
  // its heading, line of thinking, and step sequence reveal in order,
  // steps connected by arrows. The Performance stage's "Testing" step
  // briefly shows two ghost outlines fanning out and converging, implying
  // multiple variations being tried before the strongest continues on ----
  function initProcessStages() {
    var stages = Array.prototype.slice.call(document.querySelectorAll(".process-stage"));
    if (!stages.length) return;

    stages.forEach(function (stageSection) {
      var pin = stageSection.querySelector(".process-stage__pin");
      var index = stageSection.querySelector(".process-stage__index");
      var heading = stageSection.querySelector(".process-stage__heading");
      var idea = stageSection.querySelector(".process-stage__idea");
      var steps = Array.prototype.slice.call(stageSection.querySelectorAll(".process-stage__step"));
      if (!pin || !heading || !steps.length) return;

      if (reduceMotion) {
        gsap.set([index, heading, idea].concat(steps), { clearProps: "all" });
        return;
      }

      gsap.set(index, { opacity: 0, y: 10 });
      gsap.set(heading, { opacity: 0, y: 30 });
      gsap.set(idea, { opacity: 0, y: 20 });
      gsap.set(steps, { opacity: 0, y: 16 });

      var tl = gsap.timeline();
      tl.to(index, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0)
        .to(heading, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.05)
        .to(idea, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, 0.3);

      var STEP_GAP = 0.22;
      steps.forEach(function (step, i) {
        var at = 0.6 + i * STEP_GAP;
        tl.to(step, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, at);

        var ghosts = step.querySelectorAll(".process-stage__ghost");
        if (ghosts.length) {
          tl.to(ghosts, { opacity: 0.5, duration: 0.2, ease: "power1.out" }, at + 0.05)
            .to(ghosts, { opacity: 0, duration: 0.25, ease: "power1.in" }, at + 0.3);
        }
      });

      var totalDuration = 0.6 + steps.length * STEP_GAP + 0.4;

      ScrollTrigger.create({
        trigger: stageSection,
        start: "top top",
        end: function () {
          return "+=" + Math.round(window.innerHeight * totalDuration * 1.4);
        },
        pin: pin,
        scrub: 0.5,
        animation: tl,
        invalidateOnRefresh: true,
      });
    });
  }

  // ---- Work-statement heading: each word is rebuilt as text sitting
  // under a solid block; as the heading scrolls into view, the blocks
  // wipe away left -> right, "morphing" the blocks into letters ----
  function initWorkHeadingReveal() {
    var heading = document.querySelector(".work-statement__heading");
    if (!heading || reduceMotion) return;

    var words = heading.textContent.trim().split(/\s+/);
    heading.textContent = "";

    var blocks = words.map(function (word) {
      var wordEl = document.createElement("span");
      wordEl.className = "wh-word";
      wordEl.textContent = word;

      var blockEl = document.createElement("span");
      blockEl.className = "wh-word__block";
      wordEl.appendChild(blockEl);

      heading.appendChild(wordEl);
      return blockEl;
    });

    gsap.set(blocks, { scaleX: 1 });
    gsap.to(blocks, {
      scaleX: 0,
      stagger: 0.15,
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: heading,
        start: "top 85%",
        end: "top 30%",
        scrub: true,
      },
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
