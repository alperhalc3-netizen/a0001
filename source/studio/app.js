(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const themes = {
    paper: ["#ffffff", "#d2d2d2", "#2c2c2c"],
    ink: ["#161616", "#2a2a2a", "#f3f3f3"],
    warm: ["#f4efe6", "#e3d9c8", "#1c1c1c"],
    stone: ["#ececec", "#c8c8c8", "#1a1a1a"],
  };

  function applyTheme(name) {
    const theme = themes[name] || themes.paper;
    const root = document.documentElement;
    root.style.setProperty("--color-primary", theme[0]);
    root.style.setProperty("--color-secondary", theme[1]);
    root.style.setProperty("--color-onPrimary", theme[2]);
    root.dataset.theme = themes[name] ? name : "paper";
    try { localStorage.setItem("a0001-theme", root.dataset.theme); } catch {}
  }

  try { applyTheme(localStorage.getItem("a0001-theme") || "paper"); } catch { applyTheme("paper"); }

  const palette = document.querySelector(".palette");
  palette?.querySelector(".palette__toggle")?.addEventListener("click", () => {
    const open = palette.getAttribute("data-open") === "true";
    palette.setAttribute("data-open", open ? "false" : "true");
  });
  palette?.querySelectorAll(".palette__swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      applyTheme(swatch.dataset.theme);
      palette.setAttribute("data-open", "false");
    });
  });

  const ready = () => {
    document.querySelector(".hero")?.classList.add("is-ready");
    document.querySelector(".project-page")?.classList.add("is-ready");
    document.querySelector(".about")?.classList.add("is-ready");
  };
  if (reduce) ready();
  else requestAnimationFrame(() => requestAnimationFrame(ready));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.body.dataset.kind === "detail") {
      const back = document.querySelector(".modal__bar a");
      if (back) location.assign(back.href);
    }
  });

  const heroImages = [...document.querySelectorAll(".hero__image")];
  if (heroImages.length && !reduce && matchMedia("(pointer: fine)").matches) {
    const springs = heroImages.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }));
    window.addEventListener("pointermove", (event) => {
      const dx = (event.clientX - innerWidth / 2) / innerWidth;
      const dy = (event.clientY - innerHeight / 2) / innerHeight;
      springs.forEach((spring, index) => {
        const depth = (index + 1) / springs.length;
        spring.tx = dx * 80 * depth;
        spring.ty = dy * 50 * depth;
      });
    });
    const tick = () => {
      springs.forEach((spring, index) => {
        let ox = (spring.tx - spring.x) * 0.05;
        let oy = (spring.ty - spring.y) * 0.05;
        spring.vx = spring.vx * 0.8 + ox;
        spring.vy = spring.vy * 0.8 + oy;
        spring.x += spring.vx;
        spring.y += spring.vy;
        const image = heroImages[index].querySelector("img");
        if (!image) return;
        const base = [5, -6, 5, -4][index] || 0;
        image.style.translate = `${spring.x.toFixed(2)}px calc(${spring.y.toFixed(2)}px + ${base}%)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  document.querySelectorAll(".carousel").forEach((root) => {
    const track = root.querySelector(".carousel__track");
    const slides = [...track.children];
    if (!slides.length) return;
    let offset = 0;
    let velocity = 0;
    let down = false;
    let lastX = 0;
    let moved = 0;
    const gap = 16;
    const width = () => slides[0].getBoundingClientRect().width;
    const limit = () => Math.max(0, (slides.length - 1) * (width() + gap));
    const draw = () => {
      const slideWidth = width();
      const max = limit();
      offset = Math.min(max, Math.max(0, offset));
      const center = (root.clientWidth - slideWidth) / 2;
      track.style.paddingLeft = `${center}px`;
      track.style.paddingRight = `${center}px`;
      track.style.translate = `${-offset}px 0`;
      slides.forEach((slide, index) => {
        const pos = center + index * (slideWidth + gap) - offset;
        const dist = pos - center;
        slide.style.translate = `0px ${Math.cos((dist * Math.PI) / 1000) * -48 + 48}px`;
        slide.style.rotate = `${dist * 0.03}deg`;
        slide.style.transformOrigin = "50% 70vw";
      });
    };
    const loop = () => {
      if (!down) velocity *= 0.85;
      if (Math.abs(velocity) < 0.05) velocity = 0;
      offset += velocity;
      draw();
      if (!reduce) requestAnimationFrame(loop);
    };
    root.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      down = true;
      lastX = event.clientX;
      moved = 0;
      velocity = 0;
      root.classList.add("is-down");
    });
    window.addEventListener("pointermove", (event) => {
      if (!down) return;
      const delta = event.clientX - lastX;
      lastX = event.clientX;
      moved += Math.abs(delta);
      offset -= delta;
      velocity = -delta;
    });
    const end = () => {
      down = false;
      root.classList.remove("is-down");
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    root.addEventListener("click", (event) => {
      if (moved > 8) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
    root.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      velocity += direction * (width() + gap) * 0.15;
    });
    root.tabIndex = 0;
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) root.classList.add("is-in");
    }, { threshold: 0.2 });
    seen.observe(root);
    draw();
    if (reduce) return;
    requestAnimationFrame(loop);
  });

  const cards = document.querySelectorAll(".card");
  if (cards.length) {
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-in");
      });
    }, { threshold: 0.2 });
    cards.forEach((card) => seen.observe(card));
  }

  const footer = document.querySelector(".site-footer");
  const phantom = document.querySelector(".phantom");
  if (footer && phantom) {
    const onScroll = () => {
      const rect = phantom.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / innerHeight));
      footer.style.setProperty("--offsetY", String((1 - progress) * 48));
      footer.style.setProperty("--scaleY", String(0.82 + progress * 0.18));
    };
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
  }

  document.querySelectorAll(".bio p").forEach((paragraph) => {
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.45) paragraph.setAttribute("data-in", "");
      else paragraph.removeAttribute("data-in");
    }, { threshold: [0.45, 0.7] });
    seen.observe(paragraph);
  });
})();
