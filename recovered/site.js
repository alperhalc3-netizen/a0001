(() => {
  const base = "/a0001";

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http")) return;
      if (href.startsWith(base + "/") || href === base || href === base + "/") return;
      event.preventDefault();
      event.stopPropagation();
      const path = href.startsWith("/") ? base + href : href;
      location.assign(path);
    },
    true,
  );

  const toggle = document.querySelector(".Af2_WG_toggle");
  const nav = document.querySelector(".Af2_WG_nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("Af2_WG_navOpen");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("menu-open", open);
    });
  }

  const light = document.createElement("div");
  light.className = "a0001-light";
  light.innerHTML = '<button type="button">Close</button><img alt="">';
  document.body.append(light);
  const lightImg = light.querySelector("img");
  function closeLight() {
    light.dataset.open = "false";
  }
  light.querySelector("button").addEventListener("click", closeLight);
  light.addEventListener("click", (event) => {
    if (event.target === light) closeLight();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLight();
  });
  document.querySelectorAll(".detail-image--button").forEach((button) => {
    button.addEventListener("click", () => {
      const image = button.querySelector("img");
      if (!image) return;
      lightImg.src = image.currentSrc || image.src;
      lightImg.alt = image.alt || "";
      light.dataset.open = "true";
    });
  });

  const tabs = [...document.querySelectorAll(".a0001-tabs button")];
  const panels = [...document.querySelectorAll(".a0001-panel")];
  function show(name) {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== name;
    });
  }
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => show(tab.dataset.tab));
  });

  document.querySelectorAll(".a0001-panel").forEach((panel) => {
    const scroller = panel.querySelector(".a0001-carousel");
    if (!scroller) return;
    const step = (direction) => {
      const card = scroller.querySelector("a");
      const amount = card ? card.getBoundingClientRect().width + 14 : scroller.clientWidth * 0.8;
      scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
    };
    panel.querySelector(".a0001-prev")?.addEventListener("click", () => step(-1));
    panel.querySelector(".a0001-next")?.addEventListener("click", () => step(1));
    scroller.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    });
    let startX = 0;
    let startLeft = 0;
    let active = false;
    scroller.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      active = true;
      startX = event.clientX;
      startLeft = scroller.scrollLeft;
    });
    scroller.addEventListener("pointermove", (event) => {
      if (!active) return;
      const delta = event.clientX - startX;
      if (Math.abs(delta) > 6) scroller.setPointerCapture(event.pointerId);
      scroller.scrollLeft = startLeft - delta;
    });
    const end = () => {
      active = false;
    };
    scroller.addEventListener("pointerup", end);
    scroller.addEventListener("pointercancel", end);
  });
})();
