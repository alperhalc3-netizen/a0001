(() => {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || reduce.matches || window.matchMedia("(pointer: coarse)").matches) return;

  const style = document.createElement("style");
  style.textContent = `
    html.has-brush-cursor, html.has-brush-cursor * { cursor: none !important; }
    html.has-brush-cursor a, html.has-brush-cursor button, html.has-brush-cursor summary, html.has-brush-cursor [role="button"] { cursor: pointer !important; }
    html.has-brush-cursor input, html.has-brush-cursor textarea, html.has-brush-cursor select { cursor: text !important; }
    .a0001-ink, .a0001-dabs { position: fixed; inset: 0; pointer-events: none; }
    .a0001-ink { z-index: 70; }
    .a0001-dabs { z-index: 71; }
    .a0001-cursor { position: fixed; top: 0; left: 0; z-index: 80; pointer-events: none; opacity: 0; color: #0a0a0a; }
    .a0001-cursor.on { opacity: 1; }
    .a0001-tip { display: block; transform: translate(-12%, -88%) rotate(-18deg); }
    .a0001-cursor.down .a0001-tip { transform: translate(-12%, -88%) rotate(-26deg) scale(0.92); }
    .a0001-dab { position: absolute; width: 3px; height: 2px; border-radius: 60% 40% 55% 45%; background: rgba(10,10,10,.62); pointer-events: none; animation: a0001Dab 280ms linear forwards; }
    @keyframes a0001Dab { from { opacity: .7 } to { opacity: 0 } }
  `;
  document.head.append(style);
  document.documentElement.classList.add("has-brush-cursor");

  const canvas = document.createElement("canvas");
  canvas.className = "a0001-ink";
  const dabs = document.createElement("div");
  dabs.className = "a0001-dabs";
  const cursor = document.createElement("div");
  cursor.className = "a0001-cursor";
  cursor.innerHTML = '<svg class="a0001-tip" viewBox="0 0 32 32" width="28" height="28"><path d="M3.8 29.2c1.6-1.2 4.2-4.4 8.6-12.6C17.2 7.2 21.4 3.4 25.6 4.2c.9 3.8-2.2 8.2-12.4 16.6-4.6 3.8-7.2 6.4-9.4 8.4Z" fill="currentColor"/><path d="M23.2 5.1c2.4 1.1 4 3.3 3.4 5.8" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/><path d="M24.6 3.4l2.4 1.4-1.1 2.1-2.6-1.3z" fill="currentColor" opacity="0.85"/></svg>';
  document.body.append(canvas, dabs, cursor);
  const ctx = canvas.getContext("2d");
  let dpr = 1;
  let seed = 1;
  let last = null;
  let prev = null;
  let lastT = 0;
  let smoothSpeed = 0;
  let strokeAge = 0;
  let lastFade = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function brushWidth(speed, age) {
    const vel = Math.min(Math.max(speed / 1.85, 0), 1);
    const bySpeed = 16.5 - (16.5 - 0.85) * vel ** 0.55;
    const attack = Math.min(age / 90, 1);
    const attackEase = attack * attack * (3 - 2 * attack);
    const tip = speed < 0.08 ? 0.72 + speed * 2.5 : 1;
    return Math.max(0.85, bySpeed * (0.35 + 0.65 * attackEase) * tip);
  }
  function stroke(a, b, c) {
    const mx1 = (a.x + b.x) / 2, my1 = (a.y + b.y) / 2, mx2 = (b.x + c.x) / 2, my2 = (b.y + c.y) / 2;
    const nx = -(c.y - a.y), ny = c.x - a.x, nlen = Math.hypot(nx, ny) || 1, ux = nx / nlen, uy = ny / nlen;
    const steps = Math.max(4, Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 3.2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, omt = 1 - t;
      const x = omt * omt * mx1 + 2 * omt * t * b.x + t * t * mx2;
      const y = omt * omt * my1 + 2 * omt * t * b.y + t * t * my2;
      const w = omt * omt * ((a.w + b.w) / 2) + 2 * omt * t * b.w + t * t * ((b.w + c.w) / 2);
      ctx.fillStyle = `rgba(10,10,10,${0.55 + 0.28 * (1 - Math.abs(t - 0.5) * 0.35)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.45, w * 0.48), 0, Math.PI * 2);
      ctx.fill();
      const bristles = 2 + Math.floor(w / 5);
      for (let k = 0; k < bristles; k++) {
        const side = k % 2 === 0 ? 1 : -1;
        const spread = (0.18 + rand() * 0.55) * w * side;
        const along = (rand() - 0.5) * w * 0.25;
        ctx.fillStyle = `rgba(10,10,10,${0.08 + rand() * 0.16})`;
        ctx.beginPath();
        ctx.arc(x + ux * spread + uy * along, y + uy * spread - ux * along, Math.max(0.25, w * (0.08 + rand() * 0.16)), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  function fade(now) {
    requestAnimationFrame(fade);
    if (now - lastFade < 48) return;
    const dt = Math.min(now - lastFade, 120);
    lastFade = now;
    const alpha = 1 - Math.pow(0.001, dt / 4000);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0,0,0,${Math.min(alpha * 1.15, 0.085)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  function dab(x, y) {
    const mark = document.createElement("span");
    mark.className = "a0001-dab";
    mark.style.left = x + "px";
    mark.style.top = y + "px";
    mark.style.transform = `translate(-50%, -50%) rotate(${Math.round((Math.random() - 0.5) * 24)}deg)`;
    dabs.append(mark);
    mark.addEventListener("animationend", () => mark.remove(), { once: true });
  }
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    cursor.classList.add("on");
    const now = performance.now();
    const dt = Math.max(now - lastT, 6);
    if (last && now - last.t > 140) {
      last = prev = null;
      strokeAge = smoothSpeed = 0;
    }
    const raw = last ? Math.hypot(event.clientX - last.x, event.clientY - last.y) / dt : 0;
    smoothSpeed = smoothSpeed * 0.72 + raw * 0.28;
    strokeAge += dt;
    const point = { x: event.clientX, y: event.clientY, w: brushWidth(smoothSpeed, strokeAge), t: now };
    if (prev && last) stroke(prev, last, point);
    else if (last) stroke(last, last, point);
    prev = last;
    last = point;
    lastT = now;
  });
  window.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    dab(event.clientX, event.clientY);
    cursor.classList.add("down");
    strokeAge = smoothSpeed = 0;
    last = { x: event.clientX, y: event.clientY, w: 9, t: performance.now() };
    prev = null;
    lastT = last.t;
  });
  window.addEventListener("pointerup", () => cursor.classList.remove("down"));
  document.addEventListener("mouseleave", () => {
    cursor.classList.remove("on");
    last = prev = null;
  });
  resize();
  requestAnimationFrame(fade);
})();
