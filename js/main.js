// =====================================================
// BAYU SETIAWAN // Pre-Sales Engineer - Star Wars theme
// Starfield, scroll reveals, count-up, nav, crawl trigger
// =====================================================

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Animated starfield ---------- */
  const canvas = document.getElementById("starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let w = 0, h = 0, raf = null;

    const build = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 7000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 * devicePixelRatio + 0.2,
        // faint drift + twinkle
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.004,
        vy: (Math.random() * 0.12 + 0.02) * devicePixelRatio,
        gold: Math.random() > 0.88
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.sp;
        s.y += s.vy;
        if (s.y > h) { s.y = 0; s.x = Math.random() * w; }
        const a = 0.4 + Math.abs(Math.sin(s.tw)) * 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.gold
          ? `rgba(255, 232, 31, ${a})`
          : `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    build();
    if (prefersReduced) {
      draw();                 // one static frame
      cancelAnimationFrame(raf);
    } else {
      draw();
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 200);
    });
  }

  /* ---------- Background video: always playing, cannot be stopped ---------- */
  const bgVideo = document.querySelector(".holofeed__bg");
  if (bgVideo) {
    const keepPlaying = () => {
      const p = bgVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };
    bgVideo.addEventListener("pause", keepPlaying);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) keepPlaying();
    });
    keepPlaying();
  }

  /* ---------- Star Wars theme music (on by default) ---------- */
  const theme = document.getElementById("theme");
  const soundBtn = document.getElementById("soundToggle");
  if (theme && soundBtn) {
    theme.volume = 0.55;

    const setUI = (playing) => {
      soundBtn.classList.toggle("is-playing", playing);
      soundBtn.setAttribute("aria-pressed", String(playing));
    };
    const start = () => {
      const p = theme.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    theme.addEventListener("play", () => setUI(true));
    theme.addEventListener("pause", () => setUI(false));

    // Sound starts after the visitor enters through the gate
    setUI(false);

    // Enter gate: the click on the gate button starts the theme (a real user
    // gesture, so it always works around browser autoplay restrictions)
    const gate = document.getElementById("enterGate");
    if (gate) {
      document.body.style.overflow = "hidden";   // lock scroll behind the gate
      const enterBtn = document.getElementById("enterBtn");
      const dismiss = () => {
        document.body.style.overflow = "";
        gate.classList.add("is-leaving");
        setTimeout(() => gate.remove(), 600);
      };
      if (enterBtn) enterBtn.addEventListener("click", () => { start(); dismiss(); });
    } else {
      start();
    }

    // Manual toggle (top-right)
    soundBtn.addEventListener("click", () => {
      if (theme.paused) start();
      else theme.pause();
    });
  }

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  const nav = document.getElementById("nav");
  const toggle = document.getElementById("navToggle");

  const onScrollObserver = new IntersectionObserver(
    ([entry]) => nav.classList.toggle("is-scrolled", !entry.isIntersecting),
    { rootMargin: "-80px 0px 0px 0px" }
  );
  const topSentinel = document.getElementById("top");
  if (topSentinel) onScrollObserver.observe(topSentinel);

  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll(".nav__links a").forEach((a) =>
      a.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* ---------- Scroll reveal ---------- */
  const revealables = document.querySelectorAll(".reveal");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          revealObserver.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  revealables.forEach((el) => revealObserver.observe(el));

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    if (prefersReduced) { el.textContent = target; return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { runCount(e.target); countObserver.unobserve(e.target); }
      }
    },
    { threshold: 0.6 }
  );
  counters.forEach((c) => countObserver.observe(c));

  /* ---------- Opening crawl: play only when in view ---------- */
  const crawlSection = document.querySelector(".crawl-section");
  if (crawlSection) {
    const crawlObserver = new IntersectionObserver(
      ([e]) => crawlSection.classList.toggle("is-visible", e.isIntersecting),
      { threshold: 0.2 }
    );
    crawlObserver.observe(crawlSection);
  }

  /* ---------- Hyperspace flash between anchor jumps ---------- */
  const hyperspace = document.getElementById("hyperspace");
  if (hyperspace && !prefersReduced) {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        hyperspace.classList.remove("is-jumping");
        void hyperspace.offsetWidth;      // reflow to restart animation
        hyperspace.classList.add("is-jumping");
      });
    });
  }
})();
