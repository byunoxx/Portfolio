// =====================================================
// BAYU SETIAWAN // Pre-Sales Engineer - Star Wars theme
// Starfield, scroll reveals, count-up, nav, crawl trigger
// =====================================================

(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Animated starfield (reusable) ---------- */
  const createStarfield = (canvas) => {
    const ctx = canvas.getContext("2d");
    let stars = [], w = 0, h = 0, raf = null, resizeTimer = null;

    const build = () => {
      w = canvas.width = window.innerWidth * devicePixelRatio;
      h = canvas.height = window.innerHeight * devicePixelRatio;
      const count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 7000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 * devicePixelRatio + 0.2,
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
        ctx.fillStyle = s.gold ? `rgba(255, 232, 31, ${a})` : `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (prefersReduced) { draw(); cancelAnimationFrame(raf); }
      }, 200);
    };

    build();
    draw();
    if (prefersReduced) cancelAnimationFrame(raf);   // one static frame
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  };

  const mainField = document.getElementById("starfield");
  if (mainField) createStarfield(mainField);
  const gateField = document.getElementById("gateStars");
  let stopGateStars = gateField ? createStarfield(gateField) : null;

  /* ---------- Hyperspace entry effect ---------- */
  const runHyperspace = (duration, onDone) => {
    const canvas = document.getElementById("hyperCanvas");
    if (!canvas) { if (onDone) onDone(); return; }
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width = window.innerWidth * dpr;
    const h = canvas.height = window.innerHeight * dpr;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.hypot(w, h) / 2;
    const N = Math.min(520, Math.floor((window.innerWidth * window.innerHeight) / 2600));

    const spawn = () => {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * maxR * 0.22;
      return { angle, r, pr: r, speed: (Math.random() * 2 + 1) * dpr };
    };
    const stars = Array.from({ length: N }, spawn);

    canvas.classList.add("is-active");
    const startT = performance.now();
    let raf;
    const frame = (now) => {
      const t = now - startT;
      const prog = Math.min(t / duration, 1);
      const accel = 1 + prog * prog * 15;                 // ramp into lightspeed
      ctx.fillStyle = "rgba(5, 6, 10, 0.32)";             // motion-blur trails
      ctx.fillRect(0, 0, w, h);
      for (const s of stars) {
        s.pr = s.r;
        s.r += s.speed * accel;
        const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
        const x1 = cx + cos * s.pr, y1 = cy + sin * s.pr;
        const x2 = cx + cos * s.r, y2 = cy + sin * s.r;
        const bright = Math.min(0.35 + (s.r / maxR) * 0.65, 1);
        ctx.strokeStyle = `rgba(${180 + Math.floor(bright * 75)}, 225, 255, ${bright})`;
        ctx.lineWidth = Math.max(1, (s.r / maxR) * 2.6 * dpr);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (s.r > maxR) Object.assign(s, spawn());
      }
      if (t < duration) {
        raf = requestAnimationFrame(frame);
      } else {
        canvas.classList.remove("is-active");             // fade out via CSS
        setTimeout(() => { ctx.clearRect(0, 0, w, h); if (onDone) onDone(); }, 400);
      }
    };
    raf = requestAnimationFrame(frame);
  };

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
      if (enterBtn) enterBtn.addEventListener("click", () => {
        start();                                  // music
        if (stopGateStars) stopGateStars();       // stop the gate's starfield
        if (prefersReduced) { dismiss(); return; }
        runHyperspace(3000, dismiss);             // 3s jump, then reveal the site
      }, { once: true });
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
