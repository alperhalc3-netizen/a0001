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
    if (event.key === "Escape" && document.body.dataset.open === "true") requestClose();
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
      if (rect.top >= innerHeight) {
        footer.style.setProperty("--offsetY", "0");
        footer.style.setProperty("--scaleY", "1");
        return;
      }
      const progress = Math.min(1, Math.max(0, (innerHeight - rect.top) / innerHeight));
      footer.style.setProperty("--offsetY", String((1 - progress) * 36));
      footer.style.setProperty("--scaleY", String(0.4 + progress * 0.6));
    };
    onScroll();
    document.addEventListener("scroll", onScroll, { passive: true });
  }

  const catalogNode = document.getElementById("catalog");
  const catalog = catalogNode ? JSON.parse(catalogNode.textContent) : [];
  const byHref = new Map(catalog.map((item) => [item.href, item]));
  const homeHref = "/a0001/";

  function currentPath() {
    let path = location.pathname;
    if (!path.endsWith("/")) path += "/";
    return path;
  }

  function escapeText(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function wordMarkup(text) {
    return text.split(/(\s+)/).map((part, index) => (
      part.trim() ? `<span class="word" style="--delay:${index}">${escapeText(part)}</span>` : `<span class="space"> </span>`
    )).join("");
  }

  function overlayInner(project) {
    const booking = project.booking
      ? `<div class="booking"><p class="lead">Randevu, çizim ve gün birlikte netleşir. Yazışma Instagram veya e-posta ile yürür.</p><a class="pill" href="https://ig.me/m/alper.tatts">Randevu al</a><a class="text-link" href="mailto:info.alperh@gmail.com?subject=D%C3%B6vme%20randevusu">E-posta</a></div>`
      : "";
    const facts = [
      project.price ? `<p class="price">${escapeText(project.price)}</p>` : "",
      (project.lines || []).map((line) => `<p class="lead">${escapeText(line)}</p>`).join(""),
      project.shopier ? `<a class="pill" href="${escapeText(project.shopier)}" target="_blank" rel="noreferrer">Shopier</a>` : "",
      booking,
    ].join("");
    const image = `<img src="${project.src}" srcset="${project.jpg}" width="${project.w}" height="${project.h}" alt="${escapeText(project.title)}" decoding="async">`;
    return `<div class="modal"><div class="modal__bar"><a class="round" href="${homeHref}" data-close aria-label="Kapat">×</a></div><div class="modal__main"><figure>${image}</figure><div class="sheet"><h2 class="project-title">${wordMarkup(project.title)}</h2><div class="facts">${facts}</div></div></div></div>`;
  }

  let lockedScroll = 0;
  function lockPage() {
    if (document.body.dataset.open === "true") return;
    lockedScroll = window.scrollY;
    document.body.dataset.open = "true";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScroll}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  function unlockPage() {
    document.body.dataset.open = "false";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedScroll);
  }

  function bindClose(root) {
    root.querySelector("[data-close]")?.addEventListener("click", (event) => {
      event.preventDefault();
      requestClose();
    });
  }

  function mountProject(project, sourceImg) {
    let root = document.getElementById("project");
    const created = !root;
    if (!root) {
      root = document.createElement("div");
      root.id = "project";
      root.className = "project-page";
      document.body.append(root);
    }
    const paint = () => {
      root.className = "project-page";
      root.hidden = false;
      root.innerHTML = overlayInner(project);
      const image = root.querySelector("img");
      if (sourceImg && image) image.style.viewTransitionName = "piece";
      lockPage();
      bindClose(root);
      document.title = `${project.title} — A/0001`;
      requestAnimationFrame(() => root.classList.add("is-ready"));
    };
    if (sourceImg && !reduce && typeof document.startViewTransition === "function") {
      sourceImg.style.viewTransitionName = "piece";
      document.documentElement.classList.add("vt-piece");
      const transition = document.startViewTransition(() => {
        sourceImg.style.viewTransitionName = "";
        paint();
      });
      transition.finished.finally(() => {
        document.documentElement.classList.remove("vt-piece");
        root.querySelector("img")?.style.removeProperty("view-transition-name");
      });
      return;
    }
    paint();
    if (sourceImg && !reduce) {
      const image = root.querySelector("img");
      const from = sourceImg.getBoundingClientRect();
      const to = image.getBoundingClientRect();
      const sx = to.width ? from.width / to.width : 1;
      const sy = to.height ? from.height / to.height : 1;
      image.animate(
        [
          { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${sx}, ${sy})` },
          { transform: "none" },
        ],
        { duration: 700, easing: "cubic-bezier(.19, 1, .22, 1)" },
      );
    }
    if (created) return;
  }

  function hideProject() {
    const root = document.getElementById("project");
    if (root) {
      root.classList.remove("is-ready");
      root.hidden = true;
    }
    unlockPage();
    if (document.querySelector(".hero")) document.title = "A/0001";
  }

  function requestClose() {
    if (history.state && history.state.pushed) history.back();
    else location.assign(homeHref);
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.hasAttribute("data-close")) return;
    const url = new URL(link.href, location.origin);
    if (url.origin !== location.origin) return;
    let path = url.pathname;
    if (!path.endsWith("/")) path += "/";
    const project = byHref.get(path);
    if (!project || !document.querySelector(".hero")) return;
    event.preventDefault();
    const source = link.querySelector("img") || link.closest(".carousel__slide, .card, .hero__image")?.querySelector("img");
    mountProject(project, source || null);
    history.pushState({ view: "project", href: path, pushed: true }, "", path);
  });

  window.addEventListener("popstate", () => {
    const project = byHref.get(currentPath());
    if (project && document.querySelector(".hero")) mountProject(project, null);
    else hideProject();
  });

  if (byHref.has(currentPath()) && document.getElementById("project")) {
    lockedScroll = 0;
    document.body.dataset.open = "true";
    document.body.style.position = "fixed";
    document.body.style.top = "0";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    bindClose(document.getElementById("project"));
    history.replaceState({ view: "project", href: currentPath() }, "");
  } else if (document.querySelector(".hero")) {
    history.replaceState({ view: "home" }, "");
  }

  document.querySelectorAll(".bio p").forEach((paragraph) => {
    const seen = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.45) paragraph.setAttribute("data-in", "");
      else paragraph.removeAttribute("data-in");
    }, { threshold: [0.45, 0.7] });
    seen.observe(paragraph);
  });
})();
