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
    initPhotoDeckPan();
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

  // ---- Hero background: two videos alternate, second one slides in over the first ----
  function initHeroVideoSlider() {
    var video1 = document.querySelector(".hero__bg-video--1");
    var video2 = document.querySelector(".hero__bg-video--2");
    if (!video1 || !video2) return;

    if (reduceMotion) {
      video1.setAttribute("loop", "");
      video1.play().catch(function () {});
      gsap.set(video2, { display: "none" });
      return;
    }

    gsap.set(video2, { yPercent: -100, opacity: 1 });

    function playVideo2() {
      gsap.to(video2, {
        yPercent: 0,
        duration: 2,
        ease: "power3.inOut",
        onStart: function () {
          video2.currentTime = 0;
          video2.play().catch(function () {});
        },
      });
    }

    function playVideo1() {
      gsap.to(video2, {
        yPercent: -100,
        duration: 2,
        ease: "power3.inOut",
        onStart: function () {
          video1.currentTime = 0;
          video1.play().catch(function () {});
        },
      });
    }

    video1.addEventListener("ended", playVideo2);
    video2.addEventListener("ended", playVideo1);
    video1.play().catch(function () {});
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

  // ---- Philosophy: click a highlighted phrase to pop in its metric tags ----
  function initPhilosophyTagToggles() {
    var triggers = document.querySelectorAll(".philosophy__trigger");
    if (!triggers.length) return;

    triggers.forEach(function (btn) {
      var target = document.getElementById(btn.getAttribute("aria-controls"));
      if (!target) return;

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";

        if (reduceMotion) {
          target.hidden = isOpen;
          btn.setAttribute("aria-expanded", String(!isOpen));
          return;
        }

        if (isOpen) {
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
        } else {
          target.hidden = false;
          gsap.fromTo(
            target.children,
            { opacity: 0, scale: 0.7, y: 10 },
            { opacity: 1, scale: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "back.out(1.7)" }
          );
          btn.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

  // ---- Photo deck: pan each image top -> bottom while its card is pinned,
  // so the whole photo is revealed instead of a fixed crop ----
  function initPhotoDeckPan() {
    var items = document.querySelectorAll(".photo-deck__item--photo");
    if (!items.length || reduceMotion) return;

    items.forEach(function (item) {
      var img = item.querySelector("img");
      if (!img) return;

      var maxOffset = 0;

      ScrollTrigger.create({
        trigger: item,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onRefresh: function () {
          maxOffset = Math.max(0, img.offsetHeight - item.offsetHeight);
        },
        onUpdate: function (self) {
          gsap.set(img, { y: -maxOffset * self.progress });
        },
      });
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
