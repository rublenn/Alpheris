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
    initMarquees();
    initPhilosophyReveal();
    initQuestionsFill();
    initGenericReveals();
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

  // ---- Step 5: philosophy statement, words/phrases fade in on scroll ----
  function initPhilosophyReveal() {
    var statement = document.querySelector(".philosophy");
    if (!statement) return;

    // Wrap every word (including inside .highlight spans) in its own span
    // so each can fade in independently, without altering the visible text.
    var walker = document.createTreeWalker(statement, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim().length) textNodes.push(node);
    }

    textNodes.forEach(function (textNode) {
      var words = textNode.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      words.forEach(function (word) {
        if (word.trim().length === 0) {
          frag.appendChild(document.createTextNode(word));
        } else {
          var span = document.createElement("span");
          span.className = "philosophy__word";
          span.textContent = word;
          frag.appendChild(span);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });

    var wordSpans = statement.querySelectorAll(".philosophy__word");
    if (!wordSpans.length) return;

    gsap.set(wordSpans, { opacity: 0.25 });
    gsap.to(wordSpans, {
      opacity: 1,
      stagger: 0.02,
      ease: "none",
      scrollTrigger: {
        trigger: statement,
        start: "top 80%",
        end: "bottom 55%",
        scrub: true,
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

  // ---- Generic fade-up reveal for sections without a bespoke effect ----
  function initGenericReveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    ScrollTrigger.batch(items, {
      start: "top 88%",
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power2.out",
        });
      },
    });
  }
})();
