
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // widget-src/parts/99-boot.js
  var exports__99_boot = {};
  __export(exports__99_boot, {
    boot: () => boot
  });

  // widget-src/parts/00-core.js
  var alreadyLoaded = !!window.__flypodCommentsLoaded;
  window.__flypodCommentsLoaded = true;
  var script = document.currentScript;
  var SITE = script?.getAttribute("data-flypod-site") || "";
  var READY = !alreadyLoaded && !!SITE;
  var STATE = {
    open: false,
    cfg: null,
    pseudonym: null,
    threads: [],
    pending: [],
    loadError: null,
    passcodeError: null,
    activeId: null,
    draft: null,
    showResolved: false,
    menuFor: null,
    editingId: null,
    renaming: false,
    confirmDeleteId: null,
    busy: {},
    errors: {},
    notice: null
  };
  function vw() {
    const v = window.visualViewport;
    return v?.width ? v.width : window.innerWidth;
  }
  function vh() {
    const v = window.visualViewport;
    return v?.height ? v.height : window.innerHeight;
  }
  var NARROW_PX = 640;
  function isNarrow() {
    return vw() < NARROW_PX;
  }
  function pagePath() {
    return window.location?.pathname || "/";
  }
  function draftKey(id) {
    return `flypod-cmt-draft:${pagePath()}:${id}`;
  }
  function readDraft(id) {
    try {
      return sessionStorage.getItem(draftKey(id)) || "";
    } catch (_) {
      return "";
    }
  }
  function saveDraft(id, text) {
    try {
      if (text)
        sessionStorage.setItem(draftKey(id), text);
      else
        sessionStorage.removeItem(draftKey(id));
    } catch (_) {}
  }
  var renderer = null;
  var pending = false;
  var fallbackTimer = null;
  var afterRender = [];
  function setRenderer(fn) {
    renderer = fn;
  }
  function requestRender(after) {
    if (after)
      afterRender.push(after);
    if (pending)
      return;
    pending = true;
    const fire = () => {
      if (!pending)
        return;
      pending = false;
      if (fallbackTimer)
        clearTimeout(fallbackTimer);
      fallbackTimer = null;
      if (renderer)
        renderer();
      const cbs = afterRender;
      afterRender = [];
      for (const cb of cbs) {
        try {
          cb();
        } catch (_) {}
      }
    };
    (window.requestAnimationFrame || ((f) => setTimeout(f, 16)))(fire);
    fallbackTimer = setTimeout(fire, 250);
  }
  function api(path, opts) {
    opts = opts || {};
    const init = {
      method: opts.method || "GET",
      credentials: "include",
      headers: { "x-flypod-widget": "1" }
    };
    if (opts.body !== undefined) {
      init.headers["content-type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    return fetch(`/_flypod/${path}`, init).then((r) => {
      const isJson = (r.headers.get("content-type") || "").indexOf("json") >= 0;
      if (r.ok)
        return isJson ? r.json() : r.text();
      return r.text().then((t) => {
        let msg = t || r.statusText || "Request failed";
        let code = null;
        if (isJson) {
          try {
            const j = JSON.parse(t);
            msg = j && (j.message || j.error) || msg;
            code = j?.error || null;
          } catch (_) {}
        }
        const err = new Error(msg);
        err.code = code;
        err.status = r.status;
        throw err;
      });
    });
  }
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v === undefined || v === null || v === false)
          continue;
        if (k === "class")
          n.className = v;
        else if (k === "text")
          n.textContent = v;
        else if (k.indexOf("on") === 0)
          n.addEventListener(k.slice(2), v);
        else
          n.setAttribute(k, v === true ? "" : v);
      }
    }
    appendAll(n, kids);
    return n;
  }
  function appendAll(n, kids) {
    if (!kids)
      return;
    for (const c of kids) {
      if (c === null || c === undefined || c === false)
        continue;
      if (Array.isArray(c))
        appendAll(n, c);
      else if (typeof c === "string")
        n.appendChild(document.createTextNode(c));
      else
        n.appendChild(c);
    }
  }
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svg(paths, size) {
    const node = document.createElementNS(SVG_NS, "svg");
    node.setAttribute("viewBox", "0 0 24 24");
    node.setAttribute("width", size || 16);
    node.setAttribute("height", size || 16);
    node.setAttribute("fill", "none");
    node.setAttribute("aria-hidden", "true");
    for (const d of typeof paths === "string" ? [paths] : paths) {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", "2");
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      node.appendChild(p);
    }
    return node;
  }
  function timeAgo(ms) {
    const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
    if (s < 60)
      return "just now";
    if (s < 3600)
      return `${Math.floor(s / 60)}m`;
    if (s < 86400)
      return `${Math.floor(s / 3600)}h`;
    if (s < 604800)
      return `${Math.floor(s / 86400)}d`;
    return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function absTime(ms) {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  function timeEl(ms) {
    return el("time", {
      class: "fp-time",
      datetime: new Date(ms).toISOString(),
      title: absTime(ms),
      text: timeAgo(ms)
    });
  }
  function hueFor(name) {
    let h = 0;
    for (let i = 0;i < (name || "").length; i++)
      h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }
  function initialFor(name) {
    const s = (name || "").trim();
    return s ? s.charAt(0).toUpperCase() : "?";
  }
  function avatar(name) {
    return el("span", {
      class: "fp-av",
      style: `--h:${hueFor(name)}`,
      "aria-hidden": "true",
      text: initialFor(name)
    });
  }
  function authorName(comment) {
    return comment?.author?.display_name || "anonymous";
  }
  function isMine(comment) {
    return !!STATE.pseudonym && authorName(comment) === STATE.pseudonym;
  }
  function canModerate() {
    return !!STATE.cfg?.is_owner;
  }
  function threadById(id) {
    for (const t of STATE.threads)
      if (t.thread_id === id)
        return t;
    for (const t of STATE.pending)
      if (t.thread_id === id)
        return t;
    return null;
  }
  function rootOf(thread) {
    return thread.root_comment || thread.comments?.[0] || null;
  }
  function turnsOf(thread) {
    const list = thread.comments?.length ? thread.comments : [];
    if (list.length)
      return list;
    const rootC = rootOf(thread);
    return rootC ? [rootC] : [];
  }
  function isResolved(thread) {
    return thread.status === "resolved";
  }
  function isPendingApproval(thread) {
    return thread.visibility === "pending";
  }
  function openThreads() {
    return STATE.threads.filter((t) => !isResolved(t));
  }
  function setBusy(id, on) {
    if (on)
      STATE.busy[id] = true;
    else
      delete STATE.busy[id];
  }
  function isBusy(id) {
    return !!STATE.busy[id];
  }
  var noticeTimer = null;
  function notice(text) {
    STATE.notice = text ? { text } : null;
    if (noticeTimer)
      clearTimeout(noticeTimer);
    noticeTimer = null;
    if (text) {
      noticeTimer = setTimeout(() => {
        noticeTimer = null;
        STATE.notice = null;
        requestRender();
      }, 3200);
    }
    requestRender();
  }

  // widget-src/parts/10-style.js
  var host = document.createElement("div");
  host.setAttribute("data-flypod-comments", "");
  host.style.cssText = "all:initial;position:fixed;inset:0;pointer-events:none;z-index:2147483646;";
  var root = host.attachShadow({ mode: "closed" });
  var FONT = `-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,sans-serif`;
  var MONO = `ui-monospace,SFMono-Regular,Menlo,Consolas,monospace`;
  var CSS = `
:host, * { box-sizing: border-box; }
:host {
  --fp-accent: #3f7a0b;
  --fp-accent-ink: #ffffff;
  --fp-hl: #b7f84a;
  --fp-bg: #ffffff;
  --fp-bg-2: #f5f7f8;
  --fp-bg-3: #eaeef1;
  --fp-ink: #15191c;
  --fp-ink-2: #4f5c64;
  --fp-ink-3: #7f8b93;
  --fp-line: #e3e8eb;
  --fp-focus: #2f6fed;
  --fp-danger: #c0282f;
  --fp-warn: #a85b00;
  --fp-radius: 10px;
  --fp-shadow: 0 0 0 1px rgba(16,24,32,.06), 0 16px 48px -12px rgba(16,24,32,.28);
  --fp-font: ${FONT};
  --fp-mono: ${MONO};
}
@media (prefers-color-scheme: dark) {
  :host {
    --fp-accent: #b7f84a;
    --fp-accent-ink: #101600;
    --fp-bg: #15191d;
    --fp-bg-2: #1b2025;
    --fp-bg-3: #232a30;
    --fp-ink: #e9eef2;
    --fp-ink-2: #a7b4bc;
    --fp-ink-3: #7c8a93;
    --fp-line: #2a3238;
    --fp-focus: #7aa2f7;
    --fp-danger: #ff8a8a;
    --fp-warn: #f0a94b;
    --fp-shadow: 0 0 0 1px rgba(0,0,0,.5), 0 16px 48px -12px rgba(0,0,0,.7);
  }
}

[hidden] { display: none !important; }
button, input, textarea { font: inherit; color: inherit; }
button { cursor: pointer; }
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--fp-focus); outline-offset: 2px;
}
.fp-vh { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ── Highlights (on the page) ─────────────────────────────────────── */
.fp-hl {
  position: fixed; z-index: 1; pointer-events: none; border-radius: 2px;
  background: color-mix(in srgb, var(--fp-hl) 32%, transparent);
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--fp-hl) 85%, transparent);
  transition: background 160ms ease, box-shadow 160ms ease;
}
.fp-hl.is-active, .fp-hl.is-hover, .fp-hl.is-draft {
  background: color-mix(in srgb, var(--fp-hl) 55%, transparent);
  box-shadow: inset 0 -2px 0 var(--fp-hl);
}
.fp-hl.is-resolved {
  background: transparent;
  box-shadow: inset 0 -2px 0 color-mix(in srgb, var(--fp-ink-3) 55%, transparent);
}
.fp-hl.is-resolved.is-active { background: color-mix(in srgb, var(--fp-ink-3) 18%, transparent); }

/* ── Chrome layer: everything the visitor clicks ───────────────────── */
.fp-chrome { position: absolute; inset: 0; z-index: 2; pointer-events: none; font: 14px/1.5 var(--fp-font); color: var(--fp-ink); -webkit-font-smoothing: antialiased; }
.fp-chrome > * { pointer-events: auto; }

/* The selection button */
.fp-sel-btn {
  position: absolute; display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 0; border-radius: 999px;
  background: var(--fp-ink); color: var(--fp-bg);
  font-weight: 600; font-size: 13px; line-height: 1; white-space: nowrap;
  box-shadow: 0 6px 20px -6px rgba(0,0,0,.45);
  transform: translate(-50%, 0);
}
.fp-sel-btn::after {
  content: ""; position: absolute; left: 50%; bottom: -5px; width: 10px; height: 10px;
  background: inherit; transform: translateX(-50%) rotate(45deg); border-radius: 2px; z-index: -1;
}
.fp-sel-btn.is-docked { bottom: 24px; left: 20px; top: auto; transform: none; }
.fp-sel-btn.is-docked::after { display: none; }

/* The floating button */
.fp-fab {
  position: absolute; right: 20px; bottom: 20px;
  display: inline-flex; align-items: center; gap: 8px;
  height: 40px; padding: 0 14px 0 12px; border: 0; border-radius: 999px;
  background: var(--fp-ink); color: var(--fp-bg);
  font-weight: 600; font-size: 13.5px; box-shadow: 0 8px 24px -8px rgba(0,0,0,.5);
  transition: transform 120ms ease, opacity 120ms ease;
}
.fp-fab:hover { transform: translateY(-1px); }
.fp-fab-count {
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: var(--fp-hl); color: #101600; font-size: 12px; line-height: 20px; text-align: center;
}
.fp-chrome.is-open .fp-fab { opacity: 0; visibility: hidden; pointer-events: none; }

/* ── Panel ────────────────────────────────────────────────────────── */
.fp-panel {
  position: absolute; top: 0; right: 0; bottom: 0; width: 380px; max-width: 100%;
  display: flex; flex-direction: column;
  background: var(--fp-bg); color: var(--fp-ink);
  box-shadow: var(--fp-shadow);
  transform: translateX(104%); visibility: hidden;
  transition: transform 200ms ease, visibility 0s linear 200ms;
}
.fp-chrome.is-open .fp-panel { transform: none; visibility: visible; transition: transform 200ms ease; }
.fp-chrome.is-narrow .fp-panel {
  top: auto; left: 0; width: 100%; height: 82%; border-radius: 16px 16px 0 0;
  transform: translateY(104%);
}
.fp-chrome.is-narrow.is-open .fp-panel { transform: none; }
.fp-chrome.is-narrow .fp-panel::before {
  content: ""; position: absolute; top: 7px; left: 50%; width: 36px; height: 4px;
  border-radius: 2px; background: var(--fp-bg-3); transform: translateX(-50%);
}
.fp-chrome.is-narrow .fp-head { padding-top: 14px; }

.fp-head {
  display: flex; align-items: center; gap: 10px; min-height: 52px;
  padding: 8px 10px 8px 16px; border-bottom: 1px solid var(--fp-line);
}
.fp-title { font-weight: 650; font-size: 15px; letter-spacing: -0.01em; }
.fp-count { margin-left: 6px; color: var(--fp-ink-3); font-weight: 500; font-size: 13px; }
.fp-grow { flex: 1; }
.fp-row { display: flex; align-items: center; gap: 8px; }
.fp-icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0; border: 0; border-radius: 8px;
  background: transparent; color: var(--fp-ink-2);
}
.fp-icon-btn:hover { background: var(--fp-bg-2); color: var(--fp-ink); }

.fp-id-btn {
  display: inline-flex; align-items: center; gap: 7px; max-width: 170px;
  height: 30px; padding: 0 10px 0 4px; border: 0; border-radius: 999px;
  background: var(--fp-bg-2); color: var(--fp-ink-2); font-size: 12.5px;
}
.fp-id-btn:hover { background: var(--fp-bg-3); color: var(--fp-ink); }
.fp-id-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fp-rename { display: flex; gap: 6px; align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--fp-line); background: var(--fp-bg-2); }
.fp-rename-input {
  flex: 1; min-width: 0; height: 32px; padding: 0 10px; border: 1px solid var(--fp-line); border-radius: 8px;
  background: var(--fp-bg); font-size: 13px;
}
.fp-rename-hint { padding: 0 16px 8px; background: var(--fp-bg-2); border-bottom: 1px solid var(--fp-line); color: var(--fp-ink-3); font-size: 12px; }
.fp-rename-hint.is-err { color: var(--fp-danger); }

.fp-av {
  flex: none; display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 50%;
  background: hsl(var(--h, 200) 55% 46%); color: #fff; font-size: 11px; font-weight: 700;
}
.fp-av.is-sm { width: 18px; height: 18px; font-size: 9.5px; }

.fp-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.fp-foot {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  border-top: 1px solid var(--fp-line); background: var(--fp-bg);
}
.fp-foot-hint { flex: 1; min-width: 0; color: var(--fp-ink-3); font-size: 12px; text-align: right; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Buttons */
.fp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  height: 32px; padding: 0 12px; border: 1px solid var(--fp-line); border-radius: 8px;
  background: var(--fp-bg); color: var(--fp-ink); font-size: 13px; font-weight: 600; white-space: nowrap;
}
.fp-btn:hover { background: var(--fp-bg-2); }
.fp-btn:disabled { opacity: .55; cursor: default; }
.fp-btn-primary { background: var(--fp-accent); border-color: var(--fp-accent); color: var(--fp-accent-ink); }
.fp-btn-primary:hover { filter: brightness(1.06); background: var(--fp-accent); }
.fp-btn-ghost { border-color: transparent; background: transparent; color: var(--fp-ink-2); }
.fp-btn-ghost:hover { background: var(--fp-bg-2); color: var(--fp-ink); }
.fp-btn-danger { color: var(--fp-danger); }
.fp-btn-sm { height: 28px; padding: 0 10px; font-size: 12.5px; }
.fp-kbd { color: var(--fp-ink-3); font-size: 11.5px; font-family: var(--fp-mono); }
.fp-chrome.is-narrow .fp-kbd { display: none; }

/* States */
.fp-empty { padding: 48px 28px; text-align: center; color: var(--fp-ink-2); font-size: 13.5px; }
.fp-empty strong { display: block; margin-bottom: 6px; color: var(--fp-ink); font-size: 15px; font-weight: 650; }
.fp-error { margin: 16px; padding: 14px; border: 1px solid var(--fp-line); border-radius: var(--fp-radius); background: var(--fp-bg-2); color: var(--fp-ink-2); font-size: 13px; }
.fp-error .fp-btn { margin-top: 10px; }
.fp-gate { padding: 40px 28px; text-align: center; }
.fp-gate h3 { margin: 12px 0 4px; font-size: 15px; font-weight: 650; }
.fp-gate p { margin: 0 0 16px; color: var(--fp-ink-2); font-size: 13px; }
.fp-gate-input {
  width: 100%; height: 38px; padding: 0 12px; margin-bottom: 8px;
  border: 1px solid var(--fp-line); border-radius: 8px; background: var(--fp-bg-2); font-size: 14px; text-align: center;
}
.fp-gate .fp-btn { width: 100%; }
.fp-err { margin: 6px 0 0; color: var(--fp-danger); font-size: 12.5px; }
.fp-notice {
  position: absolute; left: 50%; bottom: 60px; transform: translateX(-50%);
  padding: 7px 12px; border-radius: 999px; background: var(--fp-ink); color: var(--fp-bg);
  font-size: 12.5px; font-weight: 600; white-space: nowrap; pointer-events: none;
}

/* Section labels */
.fp-section { padding: 14px 16px 6px; color: var(--fp-ink-3); font-size: 11.5px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
.fp-section.is-warn { color: var(--fp-warn); }
.fp-toggle-resolved {
  display: block; width: 100%; padding: 12px 16px; border: 0; border-top: 1px solid var(--fp-line);
  background: transparent; color: var(--fp-ink-3); font-size: 12.5px; font-weight: 600; text-align: left;
}
.fp-toggle-resolved:hover { color: var(--fp-ink); background: var(--fp-bg-2); }

/* Composer */
.fp-composer { padding: 12px 16px 14px; border-bottom: 1px solid var(--fp-line); }
.fp-composer.is-new { background: var(--fp-bg-2); }
.fp-composer-label { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; color: var(--fp-ink-2); font-size: 12.5px; font-weight: 600; }
.fp-textarea {
  display: block; width: 100%; min-height: 72px; max-height: 40vh; padding: 9px 11px; resize: none;
  border: 1px solid var(--fp-line); border-radius: 8px; background: var(--fp-bg); color: var(--fp-ink);
  font-size: 13.5px; line-height: 1.5;
}
.fp-textarea:focus { border-color: var(--fp-focus); outline: none; }
.fp-textarea::placeholder { color: var(--fp-ink-3); }
.fp-composer-actions { display: flex; align-items: center; gap: 8px; margin-top: 8px; }

/* Quote */
.fp-quote {
  display: block; width: 100%; margin: 0 0 8px; padding: 2px 0 2px 10px; border: 0; border-left: 3px solid var(--fp-hl);
  background: transparent; color: var(--fp-ink-2); font-size: 12.5px; line-height: 1.45; text-align: left;
  overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
button.fp-quote { cursor: pointer; }
button.fp-quote:hover { color: var(--fp-ink); border-left-color: var(--fp-accent); }
.fp-quote.is-orphan { border-left-color: var(--fp-ink-3); border-left-style: dashed; }
.fp-quote.is-resolved { border-left-color: var(--fp-ink-3); }
.fp-quote.is-page { border-left-color: var(--fp-line); color: var(--fp-ink-3); font-style: italic; }
.fp-panel:focus { outline: none; }

/* Cards */
.fp-card { border-bottom: 1px solid var(--fp-line); }
.fp-card.is-open { background: color-mix(in srgb, var(--fp-bg-2) 55%, var(--fp-bg)); }
.fp-card-head {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 12px 6px 16px;
  border: 0; background: transparent; text-align: left; cursor: pointer;
}
.fp-card:not(.is-open) { cursor: pointer; }
.fp-card:not(.is-open):hover { background: var(--fp-bg-2); }
.fp-author { font-weight: 650; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fp-meta { display: flex; align-items: center; gap: 8px; margin-left: auto; color: var(--fp-ink-3); font-size: 12px; white-space: nowrap; }
.fp-time { color: inherit; }
.fp-chip { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; background: var(--fp-bg-3); color: var(--fp-ink-2); font-size: 11px; font-weight: 650; line-height: 16px; }
.fp-chip.is-you { background: color-mix(in srgb, var(--fp-accent) 16%, transparent); color: var(--fp-accent); }
.fp-chip.is-resolved { color: var(--fp-ink-2); }
.fp-chip.is-pending { background: color-mix(in srgb, var(--fp-warn) 16%, transparent); color: var(--fp-warn); }
.fp-chip.is-orphan { color: var(--fp-warn); background: color-mix(in srgb, var(--fp-warn) 12%, transparent); }
.fp-card-main { padding: 0 16px 12px; }
.fp-turn-body { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 13.5px; line-height: 1.55; }
.fp-card.is-resolved:not(.is-open) .fp-turn-body { color: var(--fp-ink-2); }
.fp-card:not(.is-open) .fp-turn-body { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.fp-reply-count { margin-top: 6px; color: var(--fp-ink-3); font-size: 12px; font-weight: 600; }
.fp-code { padding: 1px 5px; border-radius: 4px; background: var(--fp-bg-3); font: 12.5px var(--fp-mono); }
.fp-link { color: var(--fp-accent); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }

.fp-replies { padding: 0 16px; }
.fp-turn { padding: 10px 0; border-top: 1px solid var(--fp-line); }
.fp-turn-head { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; font-size: 12.5px; }
.fp-turn-head .fp-author { font-size: 12.5px; }
.fp-turn-head .fp-meta { gap: 8px; }
.fp-edit-btn { padding: 0; border: 0; background: none; color: var(--fp-ink-3); font-size: 12px; }
.fp-edit-btn:hover { color: var(--fp-ink); text-decoration: underline; }
.fp-edited { color: var(--fp-ink-3); }

.fp-actions { display: flex; align-items: center; gap: 6px; padding: 4px 12px 12px 16px; }
.fp-menu-wrap { position: relative; margin-left: auto; }
.fp-menu {
  position: absolute; right: 0; bottom: 36px; z-index: 2; min-width: 150px; padding: 4px;
  border-radius: 8px; background: var(--fp-bg); box-shadow: var(--fp-shadow);
}
.fp-menu-item {
  display: block; width: 100%; padding: 7px 10px; border: 0; border-radius: 6px;
  background: transparent; color: var(--fp-ink); font-size: 13px; text-align: left;
}
.fp-menu-item:hover { background: var(--fp-bg-2); }
.fp-menu-item.is-danger { color: var(--fp-danger); }
.fp-confirm { display: flex; align-items: center; gap: 8px; padding: 10px 16px 12px; color: var(--fp-ink-2); font-size: 13px; }
.fp-confirm .fp-grow { flex: 1; }
.fp-mod-actions { display: flex; gap: 6px; padding: 0 16px 12px; }
.fp-card .fp-composer { padding: 10px 16px 14px; border-bottom: 0; border-top: 1px solid var(--fp-line); }
.fp-card .fp-composer .fp-textarea { min-height: 40px; }

@media (prefers-reduced-motion: reduce) {
  :host * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
`;

  // widget-src/parts/20-anchor.js
  function buildBodyIndex() {
    const nodes = [];
    let text = "";
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (host.contains(node))
          return NodeFilter.FILTER_REJECT;
        const tag = node.parentNode?.tagName;
        if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let cur = walker.nextNode();
    while (cur) {
      const t = cur.textContent || "";
      if (t.length) {
        nodes.push({ node: cur, start: text.length });
        text += t;
      }
      cur = walker.nextNode();
    }
    return { nodes, text };
  }
  function locateNeedle(text, needle) {
    if (!needle)
      return null;
    const direct = text.indexOf(needle);
    if (direct >= 0)
      return { idx: direct, len: needle.length, exact: true };
    const map = [];
    let norm = "";
    let prevSpace = false;
    for (let i = 0;i < text.length; i++) {
      const ch = text.charAt(i);
      if (/\s/.test(ch)) {
        if (prevSpace)
          continue;
        norm += " ";
        map.push(i);
        prevSpace = true;
      } else {
        norm += ch;
        map.push(i);
        prevSpace = false;
      }
    }
    const normNeedle = needle.replace(/\s+/g, " ").trim();
    if (!normNeedle)
      return null;
    const at = norm.indexOf(normNeedle);
    if (at < 0)
      return null;
    const start = map[at];
    const end = map[at + normNeedle.length - 1];
    if (start == null || end == null)
      return null;
    return { idx: start, len: end + 1 - start, exact: false };
  }
  function rangeFromOffsets(nodes, idx, len) {
    const endIdx = idx + len;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;
    for (const nd of nodes) {
      const ndEnd = nd.start + (nd.node.textContent || "").length;
      if (!startNode && idx < ndEnd) {
        startNode = nd.node;
        startOffset = Math.max(0, idx - nd.start);
      }
      if (endIdx <= ndEnd) {
        endNode = nd.node;
        endOffset = Math.max(0, endIdx - nd.start);
        break;
      }
    }
    if (!startNode)
      return null;
    if (!endNode) {
      const last = nodes[nodes.length - 1];
      endNode = last.node;
      endOffset = (last.node.textContent || "").length;
    }
    const rng = document.createRange();
    try {
      rng.setStart(startNode, Math.min(startOffset, (startNode.textContent || "").length));
      rng.setEnd(endNode, Math.min(endOffset, (endNode.textContent || "").length));
    } catch (_) {
      return null;
    }
    const rect = rng.getBoundingClientRect();
    if (!rect || rect.width === 0 && rect.height === 0)
      return null;
    return rng;
  }
  var FUZZY_THRESHOLD = 0.72;
  var FUZZY_MAX_QUOTE_LEN = 300;
  function trigramsOf(str) {
    const counts = {};
    let total = 0;
    const s = str.toLowerCase();
    for (let i = 0;i + 3 <= s.length; i++) {
      const g = s.slice(i, i + 3);
      counts[g] = (counts[g] || 0) + 1;
      total++;
    }
    return { counts, total };
  }
  function trigramScore(needle, windowStr) {
    const used = {};
    const w = windowStr.toLowerCase();
    let matched = 0;
    let windowTotal = 0;
    for (let i = 0;i + 3 <= w.length; i++) {
      const g = w.slice(i, i + 3);
      windowTotal++;
      const already = used[g] || 0;
      if (needle.counts[g] != null && already < needle.counts[g]) {
        matched++;
        used[g] = already + 1;
      }
    }
    return needle.total + windowTotal === 0 ? 0 : 2 * matched / (needle.total + windowTotal);
  }
  function fuzzyLocate(text, needle) {
    const len = needle.length;
    if (len < 8 || text.length < len)
      return null;
    const grams = trigramsOf(needle);
    let best = 0;
    let bestIdx = -1;
    const step = len > 40 ? Math.max(1, Math.floor(len / 20)) : 1;
    const maxStart = text.length - len;
    for (let start = 0;start <= maxStart; start += step) {
      const score = trigramScore(grams, text.substr(start, len));
      if (score > best) {
        best = score;
        bestIdx = start;
      }
    }
    if (step > 1 && bestIdx >= 0) {
      const lo = Math.max(0, bestIdx - step);
      const hi = Math.min(maxStart, bestIdx + step);
      for (let i = lo;i <= hi; i++) {
        const score = trigramScore(grams, text.substr(i, len));
        if (score > best) {
          best = score;
          bestIdx = i;
        }
      }
    }
    return bestIdx >= 0 && best >= FUZZY_THRESHOLD ? { idx: bestIdx, len } : null;
  }
  function textQuoteOf(thread) {
    const sels = thread?.anchor?.selector || [];
    for (const s of sels) {
      if (s && s.type === "TextQuoteSelector" && s.exact) {
        return {
          exact: s.exact,
          prefix: typeof s.prefix === "string" ? s.prefix : "",
          suffix: typeof s.suffix === "string" ? s.suffix : ""
        };
      }
    }
    return null;
  }
  function quoteOf(thread) {
    const tq = textQuoteOf(thread);
    return tq ? tq.exact : "";
  }
  function isPageAnchored(thread) {
    return !quoteOf(thread);
  }
  function resolveAnchor(tq, idx) {
    const none = { range: null, confidence: "none", quote: tq.exact };
    if (tq.exact.length < 3 || !idx.nodes.length)
      return none;
    let hit = locateNeedle(idx.text, tq.exact);
    let confidence = null;
    if (hit) {
      if ((tq.prefix || tq.suffix) && idx.text.indexOf(tq.exact, hit.idx + 1) !== -1) {
        const ctx = locateNeedle(idx.text, tq.prefix + tq.exact + tq.suffix);
        if (ctx)
          hit = { idx: ctx.idx + tq.prefix.length, len: tq.exact.length, exact: hit.exact };
      }
      confidence = hit.exact ? "exact" : "normalized";
    } else if (tq.exact.length <= FUZZY_MAX_QUOTE_LEN) {
      hit = fuzzyLocate(idx.text, tq.exact);
      if (hit)
        confidence = "fuzzy";
    }
    if (!hit)
      return none;
    const located = rangeFromOffsets(idx.nodes, hit.idx, hit.len);
    return located ? { range: located, confidence, quote: tq.exact } : none;
  }
  var cache = null;
  function invalidateAnchors() {
    cache = null;
  }
  function allThreads() {
    return STATE.threads.concat(STATE.pending);
  }
  function ensureCache() {
    if (cache)
      return cache;
    const out = {};
    let idx = null;
    for (const t of allThreads()) {
      const tq = textQuoteOf(t);
      if (!tq) {
        out[t.thread_id] = { range: null, confidence: "none", quote: "" };
        continue;
      }
      if (!idx)
        idx = buildBodyIndex();
      out[t.thread_id] = resolveAnchor(tq, idx);
    }
    cache = out;
    return out;
  }
  function anchorStateFor(threadId) {
    const c = ensureCache();
    if (Object.hasOwn(c, threadId))
      return c[threadId];
    return { range: null, confidence: "none", quote: "" };
  }
  function isOrphaned(thread) {
    return !!quoteOf(thread) && anchorStateFor(thread.thread_id).confidence === "none";
  }
  function isRangeVisible(range) {
    if (!range)
      return false;
    let rect;
    try {
      rect = range.getBoundingClientRect();
    } catch (_) {
      return false;
    }
    if (!rect || rect.width === 0 && rect.height === 0)
      return false;
    let n = range.commonAncestorContainer;
    while (n && n.nodeType !== 1)
      n = n.parentNode;
    while (n && n.nodeType === 1) {
      if (n === document.documentElement)
        return true;
      if (n.hasAttribute("hidden") || n.getAttribute("aria-hidden") === "true")
        return false;
      let cs = null;
      try {
        cs = window.getComputedStyle(n);
      } catch (_) {
        cs = null;
      }
      if (cs) {
        if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") {
          return false;
        }
        if (parseFloat(cs.opacity) === 0)
          return false;
        if (cs.contentVisibility === "hidden")
          return false;
        if (cs.overflow !== "visible" && cs.overflow !== "") {
          const cb = n.getBoundingClientRect();
          if (cb && (cb.width > 0 || cb.height > 0) && (rect.right <= cb.left || rect.left >= cb.right || rect.bottom <= cb.top || rect.top >= cb.bottom)) {
            return false;
          }
        }
      }
      n = n.parentNode;
    }
    return true;
  }
  function sortByPosition(threads) {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const keyed = threads.map((t) => {
      const st = anchorStateFor(t.thread_id);
      let top = Number.POSITIVE_INFINITY;
      if (st.range) {
        try {
          top = st.range.getBoundingClientRect().top + scrollY;
        } catch (_) {
          top = Number.POSITIVE_INFINITY;
        }
      }
      return { t, top };
    });
    keyed.sort((a, b) => {
      if (a.top !== b.top)
        return a.top - b.top;
      return (a.t.created_at || 0) - (b.t.created_at || 0);
    });
    return keyed.map((k) => k.t);
  }
  function buildTextQuoteAnchor(range) {
    const sel = { type: "TextQuoteSelector", exact: range.toString() };
    try {
      const s = range.startContainer;
      if (s && s.nodeType === Node.TEXT_NODE) {
        const prefix = (s.textContent || "").slice(Math.max(0, range.startOffset - 32), range.startOffset);
        if (prefix)
          sel.prefix = prefix;
      }
      const e = range.endContainer;
      if (e && e.nodeType === Node.TEXT_NODE) {
        const suffix = (e.textContent || "").slice(range.endOffset, range.endOffset + 32);
        if (suffix)
          sel.suffix = suffix;
      }
    } catch (_) {}
    return { source: location.origin + (location.pathname || "/"), selector: [sel] };
  }
  function buildPageAnchor() {
    return {
      source: location.origin + (location.pathname || "/"),
      selector: [{ type: "FlypodIdSelector", flypodId: "page" }]
    };
  }

  // widget-src/parts/35-data.js
  function loadConfig() {
    return api("config").then((cfg) => {
      STATE.cfg = cfg;
      return cfg;
    });
  }
  function dedupeRoots(threads) {
    for (const t of threads) {
      if (!t?.root_comment || !t.comments)
        continue;
      const i = t.comments.findIndex((c) => c && c.comment_id === t.root_comment.comment_id);
      if (i >= 0)
        t.comments[i] = t.root_comment;
    }
    return threads;
  }
  function loadThreads() {
    return api(`threads?page=${encodeURIComponent(pagePath())}`).then((payload) => {
      STATE.threads = dedupeRoots(payload?.threads || []);
      STATE.loadError = null;
    }).catch((e) => {
      if (e && e.code === "passcode_required" && STATE.cfg)
        STATE.cfg.passcode_required = true;
      STATE.loadError = e?.message || "Couldn't load comments.";
    }).then(() => {
      invalidateAnchors();
      requestRender();
      return STATE.threads;
    });
  }
  function loadPending() {
    if (!canModerate()) {
      STATE.pending = [];
      return Promise.resolve(STATE.pending);
    }
    return api(`threads?page=${encodeURIComponent(pagePath())}&status=pending`).then((payload) => {
      STATE.pending = dedupeRoots(payload?.threads || []);
    }).catch(() => {
      STATE.pending = [];
    }).then(() => {
      invalidateAnchors();
      requestRender();
      return STATE.pending;
    });
  }
  function refresh() {
    return loadThreads().then(() => loadPending());
  }
  var minting = null;
  function ensurePseudonym() {
    if (STATE.pseudonym)
      return Promise.resolve(STATE.pseudonym);
    if (minting)
      return minting;
    minting = api("cookie", { method: "POST" }).then((j) => {
      STATE.pseudonym = j?.pseudonym || null;
      minting = null;
      requestRender();
      return STATE.pseudonym;
    }).catch((e) => {
      minting = null;
      throw e;
    });
    return minting;
  }

  // widget-src/parts/30-highlights.js
  var nodesByThread = {};
  var draftNodes = [];
  var flashId = null;
  var hoverId = null;
  var flashTimer = null;
  function placeRects(nodes, range, className, threadId) {
    let rects;
    try {
      rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    } catch (_) {
      rects = [];
    }
    while (nodes.length > rects.length) {
      const extra = nodes.pop();
      if (extra.parentNode)
        extra.parentNode.removeChild(extra);
    }
    while (nodes.length < rects.length) {
      const fresh = document.createElement("div");
      root.appendChild(fresh);
      nodes.push(fresh);
    }
    for (let i = 0;i < rects.length; i++) {
      const r = rects[i];
      const n = nodes[i];
      if (n.className !== className)
        n.className = className;
      if (threadId)
        n.setAttribute("data-thread-id", threadId);
      n.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    }
  }
  function removeThread(id) {
    const nodes = nodesByThread[id];
    if (!nodes)
      return;
    for (const n of nodes)
      if (n.parentNode)
        n.parentNode.removeChild(n);
    delete nodesByThread[id];
  }
  function paintHighlights() {
    const seen = {};
    for (const t of STATE.threads.concat(STATE.pending)) {
      const st = anchorStateFor(t.thread_id);
      if (!st.range || !isRangeVisible(st.range))
        continue;
      seen[t.thread_id] = true;
      let cls = "fp-hl";
      if (STATE.activeId === t.thread_id || flashId === t.thread_id)
        cls += " is-active";
      else if (hoverId === t.thread_id)
        cls += " is-hover";
      if (t.status === "resolved")
        cls += " is-resolved";
      const nodes = nodesByThread[t.thread_id] || (nodesByThread[t.thread_id] = []);
      placeRects(nodes, st.range, cls, t.thread_id);
    }
    for (const id in nodesByThread)
      if (!seen[id])
        removeThread(id);
    if (STATE.draft?.range) {
      placeRects(draftNodes, STATE.draft.range, "fp-hl is-draft", null);
    } else if (draftNodes.length) {
      for (const n of draftNodes)
        if (n.parentNode)
          n.parentNode.removeChild(n);
      draftNodes = [];
    }
  }
  function setHoverThread(id) {
    if (hoverId === id)
      return;
    hoverId = id;
    paintHighlights();
  }
  function threadAtPoint(x, y) {
    for (const id in nodesByThread) {
      for (const n of nodesByThread[id]) {
        const b = n.getBoundingClientRect();
        if (b.width && b.height && x >= b.left && x <= b.right && y >= b.top && y <= b.bottom) {
          return id;
        }
      }
    }
    return null;
  }
  function scrollerFor(node) {
    let n = node;
    while (n && n.nodeType !== 1)
      n = n.parentNode;
    while (n && n !== document.body && n !== document.documentElement) {
      let cs = null;
      try {
        cs = window.getComputedStyle(n);
      } catch (_) {
        cs = null;
      }
      if (cs) {
        const oy = cs.overflowY;
        if ((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1)
          return n;
      }
      n = n.parentNode;
    }
    return null;
  }
  function scrollToThread(id) {
    const st = anchorStateFor(id);
    if (!st.range)
      return false;
    const rect = st.range.getBoundingClientRect();
    const scroller = scrollerFor(st.range.commonAncestorContainer);
    let top = 0;
    let height = vh();
    if (scroller) {
      const sb = scroller.getBoundingClientRect();
      top = sb.top;
      height = sb.height;
    }
    const mid = rect.top + rect.height / 2;
    const margin = Math.min(120, height * 0.18);
    if (mid <= top + margin || mid >= top + height - margin) {
      const delta = mid - (top + height / 2);
      if (scroller) {
        scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: "smooth" });
      } else {
        window.scrollTo({ top: (window.scrollY || 0) + delta, behavior: "smooth" });
      }
    }
    flashId = id;
    if (flashTimer)
      clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flashId = null;
      flashTimer = null;
      paintHighlights();
    }, 1400);
    paintHighlights();
    return true;
  }

  // widget-src/parts/05-text.js
  function safeUrl(raw) {
    const lower = raw.toLowerCase();
    return lower.startsWith("http://") || lower.startsWith("https://") ? raw : null;
  }
  function splitUrls(text) {
    const parts = [];
    const re = /https?:\/\/[^\s]+/gi;
    let last = 0;
    let m = re.exec(text);
    while (m) {
      let url = m[0];
      while (url.length && /[.,);:!?]$/.test(url))
        url = url.slice(0, -1);
      if (m.index > last)
        parts.push({ text: text.slice(last, m.index) });
      parts.push({ url });
      last = m.index + url.length;
      re.lastIndex = last;
      m = re.exec(text);
    }
    if (last < text.length)
      parts.push({ text: text.slice(last) });
    return parts;
  }
  function inlineNodes(text, out) {
    const TICK = "`";
    let i = 0;
    let buf = "";
    const flush = () => {
      if (buf)
        out.push(document.createTextNode(buf));
      buf = "";
    };
    while (i < text.length) {
      const ch = text.charAt(i);
      let marker = null;
      let tag = null;
      if (ch === TICK) {
        marker = TICK;
        tag = "code";
      } else if (ch === "*" && text.charAt(i + 1) === "*") {
        marker = "**";
        tag = "strong";
      } else if (ch === "*") {
        marker = "*";
        tag = "em";
      }
      if (!marker) {
        buf += ch;
        i++;
        continue;
      }
      const close = text.indexOf(marker, i + marker.length);
      const inner = close < 0 ? "" : text.slice(i + marker.length, close);
      if (!inner) {
        buf += ch;
        i++;
        continue;
      }
      flush();
      if (tag === "code") {
        out.push(el("code", { class: "fp-code", text: inner }));
      } else {
        const node = el(tag, {});
        const kids = [];
        inlineNodes(inner, kids);
        for (const k of kids)
          node.appendChild(k);
        out.push(node);
      }
      i = close + marker.length;
    }
    flush();
  }
  function renderRichText(parent, body) {
    parent.textContent = "";
    for (const seg of splitUrls(body || "")) {
      if (seg.url) {
        const href = safeUrl(seg.url);
        parent.appendChild(href ? el("a", {
          class: "fp-link",
          href,
          target: "_blank",
          rel: "noopener noreferrer nofollow ugc",
          text: seg.url
        }) : document.createTextNode(seg.url));
        continue;
      }
      const nodes = [];
      inlineNodes(seg.text, nodes);
      for (const n of nodes)
        parent.appendChild(n);
    }
    return parent;
  }
  function normalizePseudonym(raw) {
    let out = "";
    for (const ch of raw || "") {
      let c;
      if (/[A-Z]/.test(ch))
        c = ch.toLowerCase();
      else if (/[a-z0-9]/.test(ch))
        c = ch;
      else if (ch === " " || ch === "_" || ch === "-" || ch === "." || ch === " ")
        c = "-";
      else
        continue;
      if (c === "-" && (out.length === 0 || out.endsWith("-")))
        continue;
      out += c;
      if (out.length >= 32)
        break;
    }
    return out;
  }
  function pseudonymProblem(name) {
    if (!name)
      return "Pick a name — letters, numbers and hyphens.";
    if (name.length < 3)
      return "At least 3 characters.";
    if (name.endsWith("-"))
      return "Can't end with a hyphen.";
    return null;
  }

  // widget-src/parts/15-icons.js
  var ICON = {
    bubble: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    check: "M20 6 9 17l-5-5",
    reopen: "M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8M3 3v5h5",
    more: ["M12 5h.01", "M12 12h.01", "M12 19h.01"],
    x: ["M18 6 6 18", "M6 6l12 12"],
    warn: [
      "M12 9v4",
      "M12 17h.01",
      "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"
    ],
    chevron: "M6 9l6 6 6-6",
    pencil: ["M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z", "M15 5l4 4"],
    lock: ["M5 11h14v10H5z", "M8 11V7a4 4 0 0 1 8 0v4"]
  };

  // widget-src/parts/45-panel.js
  var IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "");
  var built = false;
  var chrome;
  var fab;
  var fabCount;
  var panel;
  var titleCount;
  var idSlot;
  var renameSlot;
  var body;
  var foot;
  var footNote;
  var noticeEl;
  var live;
  var cards = new Map;
  var composers = new Map;
  var gateNode = null;
  var renameNode = null;
  function chromeEl() {
    return chrome;
  }
  function mount() {
    if (built)
      return;
    built = true;
    root.appendChild(el("style", { text: CSS }));
    live = el("div", { class: "fp-vh", "aria-live": "polite" });
    root.appendChild(live);
    fabCount = el("span", { class: "fp-fab-count" });
    fab = el("button", { class: "fp-fab", type: "button", "aria-label": "Open comments", onclick: () => openPanel() }, [svg(ICON.bubble, 16), "Comments", fabCount]);
    titleCount = el("span", { class: "fp-count" });
    idSlot = el("div", { class: "fp-row" });
    const head = el("div", { class: "fp-head" }, [
      el("span", { class: "fp-title" }, ["Comments", titleCount]),
      el("span", { class: "fp-grow" }),
      idSlot,
      el("button", { class: "fp-icon-btn", type: "button", "aria-label": "Close", onclick: () => closePanel() }, [svg(ICON.x, 16)])
    ]);
    renameSlot = el("div");
    body = el("div", { class: "fp-body" });
    footNote = el("button", { class: "fp-btn fp-btn-ghost fp-btn-sm", type: "button", onclick: () => startPageNote() }, [svg(ICON.bubble, 14), "Add a note on this page"]);
    foot = el("div", { class: "fp-foot" }, [
      footNote,
      el("span", { class: "fp-foot-hint", text: "or select text on the page" })
    ]);
    noticeEl = el("div", { class: "fp-notice", hidden: true });
    panel = el("aside", {
      class: "fp-panel",
      role: "dialog",
      "aria-label": "Comments",
      "aria-modal": "false",
      tabindex: "-1"
    }, [head, renameSlot, body, foot, noticeEl]);
    chrome = el("div", { class: "fp-chrome" }, [fab, panel]);
    root.appendChild(chrome);
    setRenderer(render);
  }
  function render() {
    if (!built)
      mount();
    const open = STATE.open;
    chrome.classList.toggle("is-open", open);
    chrome.classList.toggle("is-narrow", isNarrow());
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    fab.setAttribute("aria-hidden", open ? "true" : "false");
    fab.tabIndex = open ? -1 : 0;
    const n = openThreads().length;
    fabCount.textContent = String(n);
    fabCount.hidden = n === 0;
    fab.setAttribute("aria-label", n ? `Open comments, ${n} open` : "Open comments");
    titleCount.textContent = n ? String(n) : "";
    withFocusKept(() => {
      renderHead();
      patchChildren(body, bodyNodes());
      evictUnusedComposers();
    });
    renderFoot();
    if (STATE.notice) {
      noticeEl.textContent = STATE.notice.text;
      noticeEl.hidden = false;
      if (live.textContent !== STATE.notice.text)
        live.textContent = STATE.notice.text;
    } else {
      noticeEl.hidden = true;
    }
    syncChrome();
    paintHighlights();
  }
  function syncChrome() {
    const vv = window.visualViewport;
    if (!vv)
      return;
    const differs = Math.abs(vv.width - window.innerWidth) > 1 || Math.abs(vv.height - window.innerHeight) > 1 || vv.offsetLeft > 0 || vv.offsetTop > 0;
    const css = differs ? `left:${vv.offsetLeft}px;top:${vv.offsetTop}px;width:${vv.width}px;height:${vv.height}px;` : "";
    if (chrome.style.cssText !== css)
      chrome.style.cssText = css;
  }
  function renderHead() {
    const name = STATE.pseudonym;
    const wantId = name && !STATE.renaming ? "id" : "none";
    if (idSlot.getAttribute("data-shows") !== wantId) {
      idSlot.textContent = "";
      idSlot.setAttribute("data-shows", wantId);
      if (wantId === "id") {
        idSlot.appendChild(el("button", {
          class: "fp-id-btn",
          type: "button",
          title: "Change your name on this site",
          onclick: () => startRename()
        }, [avatar(name), el("span", { text: name })]));
      }
    } else if (wantId === "id") {
      const label = idSlot.querySelector(".fp-id-btn span");
      if (label && label.textContent !== name) {
        idSlot.textContent = "";
        idSlot.setAttribute("data-shows", "");
        renderHead();
        return;
      }
    }
    patchChildren(renameSlot, STATE.renaming ? [renameRow()] : []);
  }
  function renameRow() {
    if (!renameNode) {
      let submit = function() {
        const next = normalizePseudonym(nameInput.value);
        const problem = pseudonymProblem(next);
        if (problem) {
          nameHint.textContent = problem;
          nameHint.classList.add("is-err");
          return;
        }
        submitRename(next);
      };
      const nameHint = el("div", { class: "fp-rename-hint" });
      const nameInput = el("input", {
        class: "fp-rename-input",
        type: "text",
        maxlength: "32",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": "Your name on this site",
        "data-fp-focus": "rename",
        oninput: () => {
          const next = normalizePseudonym(nameInput.value);
          if (next !== nameInput.value)
            nameInput.value = next;
          nameHint.textContent = pseudonymProblem(next) || "Lowercase letters, numbers and hyphens.";
          nameHint.classList.toggle("is-err", !!pseudonymProblem(next));
        },
        onkeydown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            cancelRename();
          }
        }
      });
      const nameRow = el("div", { class: "fp-rename" }, [
        nameInput,
        el("button", { class: "fp-btn fp-btn-sm fp-btn-primary", type: "button", onclick: submit }, [
          "Save"
        ]),
        el("button", { class: "fp-btn fp-btn-sm fp-btn-ghost", type: "button", onclick: () => cancelRename() }, ["Cancel"])
      ]);
      renameNode = {
        wrap: el("div", {}, [nameRow, nameHint]),
        input: nameInput,
        hint: nameHint,
        row: nameRow
      };
    }
    const rn = renameNode;
    if (!rn.row.isConnected) {
      rn.input.value = STATE.pseudonym || "";
      rn.hint.textContent = "Lowercase letters, numbers and hyphens. Applies to all your comments here.";
      rn.hint.classList.remove("is-err");
    }
    if (STATE.errors.rename) {
      rn.hint.textContent = STATE.errors.rename;
      rn.hint.classList.add("is-err");
    }
    rn.row.querySelector(".fp-btn-primary").disabled = isBusy("rename");
    return renameNode.wrap;
  }
  function renderFoot() {
    const gated = !!STATE.cfg?.passcode_required;
    const pageDraft = !!(STATE.draft && !STATE.draft.range);
    foot.hidden = gated;
    footNote.hidden = pageDraft;
  }
  function bodyNodes() {
    const nodes = [];
    if (STATE.cfg?.passcode_required) {
      nodes.push(gate());
      return nodes;
    }
    if (STATE.loadError && !STATE.threads.length) {
      nodes.push(el("div", { class: "fp-error" }, [
        el("div", { text: "Couldn't load comments. Check your connection and try again." }),
        el("button", { class: "fp-btn fp-btn-sm", type: "button", onclick: () => refresh() }, [
          "Try again"
        ])
      ]));
      return nodes;
    }
    if (STATE.draft)
      nodes.push(newComposer());
    if (canModerate() && STATE.pending.length) {
      nodes.push(el("div", { class: "fp-section is-warn", text: "Awaiting your approval" }));
      for (const t of sortByPosition(STATE.pending))
        nodes.push(card(t, true));
    }
    const queued = new Set(STATE.pending.map((t) => t.thread_id));
    const list = sortByPosition(STATE.threads.filter((t) => !queued.has(t.thread_id)));
    const open = list.filter((t) => !isResolved(t));
    const resolved = list.filter(isResolved);
    if (!open.length && !resolved.length && !STATE.draft && !STATE.pending.length) {
      nodes.push(el("div", { class: "fp-empty" }, [
        el("strong", { text: "No comments yet" }),
        "Select any text on the page to comment on it."
      ]));
    }
    for (const t of open)
      nodes.push(card(t, false));
    if (resolved.length) {
      nodes.push(el("button", {
        class: "fp-toggle-resolved",
        type: "button",
        "aria-expanded": STATE.showResolved ? "true" : "false",
        onclick: () => toggleResolvedVisible()
      }, [`${STATE.showResolved ? "Hide" : "Show"} ${resolved.length} resolved`]));
      if (STATE.showResolved)
        for (const t of resolved)
          nodes.push(card(t, false));
    }
    return nodes;
  }
  function gate() {
    if (!gateNode) {
      const input = el("input", {
        class: "fp-gate-input",
        type: "password",
        autocomplete: "off",
        autocapitalize: "off",
        spellcheck: "false",
        "aria-label": "Passcode",
        "data-fp-focus": "gate"
      });
      const err = el("div", { class: "fp-err", role: "alert" });
      const unlockBtn = el("button", { class: "fp-btn fp-btn-primary", type: "submit" }, ["Unlock"]);
      const form = el("form", {
        class: "fp-gate",
        onsubmit: (e) => {
          e.preventDefault();
          submitPasscode(input.value);
        }
      }, [
        svg(ICON.lock, 28),
        el("h3", { text: "Passcode required" }),
        el("p", {
          text: "Comments on this site are protected. Enter the passcode to read and post."
        }),
        input,
        err,
        unlockBtn
      ]);
      gateNode = { form, input, err, btn: unlockBtn };
    }
    gateNode.err.textContent = STATE.passcodeError || "";
    gateNode.err.hidden = !STATE.passcodeError;
    gateNode.input.setAttribute("aria-invalid", STATE.passcodeError ? "true" : "false");
    gateNode.btn.disabled = isBusy("gate");
    gateNode.btn.textContent = isBusy("gate") ? "Checking…" : "Unlock";
    return gateNode.form;
  }
  function composer(key, opts) {
    let c = composers.get(key);
    if (c && opts.version !== c.version) {
      composers.delete(key);
      c = null;
    }
    if (!c) {
      const ta = el("textarea", {
        class: "fp-textarea",
        rows: opts.rows || "2",
        placeholder: opts.placeholder || "",
        "aria-label": opts.placeholder || "Comment",
        "data-fp-focus": `composer:${key}`,
        oninput: () => {
          autogrow(ta);
          if (!opts.noDraft)
            saveDraft(key, ta.value);
          c.submit.disabled = isBusy(key) || !ta.value.trim();
        },
        onkeydown: (e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            if (!ta.value.trim() && c.opts.onCancel)
              c.opts.onCancel();
            else
              ta.blur();
          }
        }
      });
      ta.value = opts.initial != null ? opts.initial : readDraft(key);
      const submit = () => {
        const text = ta.value.trim();
        if (!text || isBusy(key))
          return;
        c.opts.onSubmit(text).then((ok) => {
          if (ok && !c.opts.keepText) {
            ta.value = "";
            autogrow(ta);
          }
        });
      };
      const submitBtn = el("button", { class: "fp-btn fp-btn-sm fp-btn-primary", type: "button", onclick: submit }, [opts.submitLabel]);
      const err = el("div", { class: "fp-err", role: "alert", hidden: true });
      const actions = el("div", { class: "fp-composer-actions" }, [
        submitBtn,
        opts.cancelLabel ? el("button", {
          class: "fp-btn fp-btn-sm fp-btn-ghost",
          type: "button",
          onclick: () => c.opts.onCancel?.()
        }, [opts.cancelLabel]) : null,
        el("span", { class: "fp-grow" }),
        el("span", {
          class: "fp-kbd",
          title: `${IS_MAC ? "Cmd" : "Ctrl"} + Enter to send`,
          text: IS_MAC ? "⌘↵" : "Ctrl↵"
        })
      ]);
      const node = el("div", { class: `fp-composer${opts.className ? ` ${opts.className}` : ""}` }, [
        opts.header || null,
        ta,
        err,
        actions
      ]);
      c = { node, ta, submit: submitBtn, err, opts, version: opts.version, used: true };
      composers.set(key, c);
    }
    c.opts = opts;
    c.used = true;
    const busy = isBusy(key);
    c.submit.disabled = busy || !c.ta.value.trim();
    c.submit.textContent = busy ? opts.busyLabel || "Sending…" : opts.submitLabel;
    const error = STATE.errors[key] || "";
    c.err.textContent = error;
    c.err.hidden = !error;
    return c.node;
  }
  function evictUnusedComposers() {
    for (const [key, c] of composers) {
      if (!c.used)
        composers.delete(key);
      else
        c.used = false;
    }
  }
  function autogrow(ta) {
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight + 2, vh() * 0.4)}px`;
  }
  function newComposer() {
    const d = STATE.draft;
    const header = el("div", {}, [
      el("div", { class: "fp-composer-label" }, [
        svg(ICON.bubble, 14),
        el("span", { class: "fp-grow", text: d.range ? "New comment" : "Note on this page" }),
        el("button", {
          class: "fp-icon-btn",
          type: "button",
          "aria-label": "Discard",
          title: "Discard (Esc)",
          onclick: () => cancelDraft()
        }, [svg(ICON.x, 14)])
      ]),
      d.quote ? el("div", { class: "fp-quote", text: d.quote }) : null
    ]);
    return composer("new", {
      version: d,
      className: "is-new",
      header,
      placeholder: d.range ? "Comment on the selected text…" : "Write a note about this page…",
      submitLabel: "Post",
      busyLabel: "Posting…",
      onSubmit: (text) => submitNewThread(text),
      onCancel: () => cancelDraft()
    });
  }
  function cardSig(t, inQueue) {
    const active = STATE.activeId === t.thread_id;
    const turns = turnsOf(t);
    const edited = turns.map((c) => `${c.comment_id}:${c.edited_at || 0}:${c.body.length}`).join(",");
    const editing = active && STATE.editingId && turns.some((c) => c.comment_id === STATE.editingId);
    return [
      t.updated_at,
      t.comment_count,
      t.status,
      t.visibility || "",
      active ? 1 : 0,
      inQueue ? 1 : 0,
      anchorStateFor(t.thread_id).confidence,
      isBusy(t.thread_id) ? 1 : 0,
      STATE.menuFor === t.thread_id ? 1 : 0,
      STATE.confirmDeleteId === t.thread_id ? 1 : 0,
      editing ? `${STATE.editingId}:${isBusy(`edit:${STATE.editingId}`) ? 1 : 0}` : "",
      STATE.pseudonym || "",
      canModerate() ? 1 : 0,
      STATE.errors[t.thread_id] || "",
      editing ? STATE.errors[`edit:${STATE.editingId}`] || "" : "",
      edited,
      turns.map((c) => authorName(c)).join("|")
    ].join("\x01");
  }
  function card(t, inQueue) {
    const sig = cardSig(t, inQueue);
    const cached = cards.get(t.thread_id);
    if (cached && cached.sig === sig)
      return cached.node;
    const node = buildCard(t, inQueue);
    cards.set(t.thread_id, { node, sig });
    return node;
  }
  function chip(text, mod) {
    return el("span", { class: `fp-chip ${mod}`, text });
  }
  function buildCard(t, inQueue) {
    const id = t.thread_id;
    const rootC = rootOf(t);
    const turns = turnsOf(t);
    const active = STATE.activeId === id;
    const resolved = isResolved(t);
    const queued = isPendingApproval(t);
    const orphan = isOrphaned(t);
    const page = isPageAnchored(t);
    const located = !page && !orphan && !!anchorStateFor(id).range;
    const name = authorName(rootC);
    let cls = "fp-card";
    if (active)
      cls += " is-open";
    if (resolved)
      cls += " is-resolved";
    if (queued)
      cls += " is-pending";
    const head = el("button", {
      class: "fp-card-head",
      type: "button",
      "aria-expanded": active ? "true" : "false",
      onclick: () => toggleThread(id)
    }, [
      avatar(name),
      el("span", { class: "fp-author", text: name }),
      isMine(rootC) ? chip("You", "is-you") : null,
      el("span", { class: "fp-meta" }, [
        resolved ? chip("Resolved", "is-resolved") : null,
        queued && !inQueue ? chip("Awaiting approval", "is-pending") : null,
        orphan ? chip("Text changed", "is-orphan") : null,
        timeEl(rootC.created_at || t.created_at || Date.now())
      ])
    ]);
    let quote = null;
    if (page) {
      quote = el("div", { class: "fp-quote is-page", text: "On this page" });
    } else if (located) {
      quote = el("button", {
        class: `fp-quote${resolved ? " is-resolved" : ""}`,
        type: "button",
        title: "Show on the page",
        onclick: () => {
          scrollToThread(id);
        },
        text: quoteOf(t)
      });
    } else {
      quote = el("div", {
        class: "fp-quote is-orphan",
        title: "This text is no longer on the page",
        text: quoteOf(t)
      });
    }
    const main = el("div", { class: "fp-card-main" }, [
      quote,
      turnBody(rootC, t),
      !active && turns.length > 1 ? el("div", {
        class: "fp-reply-count",
        text: `${turns.length - 1} ${turns.length === 2 ? "reply" : "replies"}`
      }) : null
    ]);
    const kids = [head, main];
    if (active) {
      if (turns.length > 1) {
        kids.push(el("div", { class: "fp-replies" }, turns.slice(1).map((c) => turn(c, t))));
      }
      if (inQueue) {
        kids.push(el("div", { class: "fp-mod-actions" }, [
          el("button", {
            class: "fp-btn fp-btn-sm fp-btn-primary",
            type: "button",
            disabled: isBusy(id),
            onclick: () => approveThread(id)
          }, [svg(ICON.check, 14), "Approve"]),
          el("button", {
            class: "fp-btn fp-btn-sm",
            type: "button",
            disabled: isBusy(id),
            onclick: () => rejectThread(id)
          }, ["Reject"])
        ]));
      }
      kids.push(actionsRow(t, rootC, inQueue));
      if (STATE.confirmDeleteId === id) {
        kids.push(el("div", { class: "fp-confirm" }, [
          "Delete this thread?",
          el("span", { class: "fp-grow" }),
          el("button", {
            class: "fp-btn fp-btn-sm fp-btn-danger",
            type: "button",
            disabled: isBusy(id),
            onclick: () => deleteThread(id)
          }, ["Delete"]),
          el("button", {
            class: "fp-btn fp-btn-sm fp-btn-ghost",
            type: "button",
            onclick: () => {
              STATE.confirmDeleteId = null;
              requestRender();
            }
          }, ["Cancel"])
        ]));
      }
      if (!queued || inQueue) {
        kids.push(composer(id, {
          rows: "1",
          placeholder: "Reply…",
          submitLabel: "Reply",
          onSubmit: (text) => submitReply(id, text),
          onCancel: () => closeThread()
        }));
      }
    }
    return el("article", {
      class: cls,
      "data-thread-id": id,
      onclick: (e) => {
        if (active)
          return;
        if (e.target?.closest?.("button,a,textarea,input"))
          return;
        toggleThread(id);
      },
      onmouseenter: () => setHoverThread(id),
      onmouseleave: () => setHoverThread(null)
    }, kids);
  }
  function actionsRow(t, rootC, inQueue) {
    const id = t.thread_id;
    const resolved = isResolved(t);
    const mine = isMine(rootC);
    const menuOpen = STATE.menuFor === id;
    return el("div", { class: "fp-actions" }, [
      !isPendingApproval(t) && !inQueue ? el("button", {
        class: "fp-btn fp-btn-sm",
        type: "button",
        disabled: isBusy(id),
        onclick: () => setThreadStatus(id, resolved ? "open" : "resolved")
      }, [svg(resolved ? ICON.reopen : ICON.check, 14), resolved ? "Reopen" : "Resolve"]) : null,
      canEdit(rootC) && STATE.editingId !== rootC.comment_id ? el("button", {
        class: "fp-btn fp-btn-sm fp-btn-ghost",
        type: "button",
        onclick: () => startEdit(rootC.comment_id)
      }, [svg(ICON.pencil, 14), "Edit"]) : null,
      el("div", { class: "fp-menu-wrap" }, [
        el("button", {
          class: "fp-icon-btn",
          type: "button",
          "aria-label": "More actions",
          "aria-haspopup": "menu",
          "aria-expanded": menuOpen ? "true" : "false",
          onclick: () => toggleMenu(id)
        }, [svg(ICON.more, 16)]),
        menuOpen ? el("div", { class: "fp-menu", role: "menu" }, [
          menuItem("Copy link", () => copyLink(id)),
          mine || canModerate() ? menuItem("Delete", () => {
            STATE.menuFor = null;
            STATE.confirmDeleteId = id;
            requestRender();
          }, true) : null,
          !mine ? menuItem("Report", () => reportThread(id)) : null
        ]) : null
      ])
    ]);
  }
  function menuItem(label, onClick, danger) {
    return el("button", {
      class: `fp-menu-item${danger ? " is-danger" : ""}`,
      type: "button",
      role: "menuitem",
      onclick: onClick
    }, [label]);
  }
  function turnBody(c, t) {
    if (STATE.activeId === t.thread_id && STATE.editingId === c.comment_id) {
      return composer(`edit:${c.comment_id}`, {
        initial: c.body,
        noDraft: true,
        keepText: true,
        placeholder: "Edit your comment…",
        submitLabel: "Save",
        busyLabel: "Saving…",
        cancelLabel: "Cancel",
        onSubmit: (text) => submitEdit(c.comment_id, text),
        onCancel: () => cancelEdit()
      });
    }
    return renderRichText(el("div", { class: "fp-turn-body" }), c.body);
  }
  function turn(c, t) {
    const name = authorName(c);
    const editable = canEdit(c) && STATE.editingId !== c.comment_id;
    return el("div", { class: "fp-turn" }, [
      el("div", { class: "fp-turn-head" }, [
        el("span", {
          class: "fp-av is-sm",
          style: `--h:${hue(name)}`,
          "aria-hidden": "true",
          text: name.charAt(0).toUpperCase()
        }),
        el("span", { class: "fp-author", text: name }),
        isMine(c) ? chip("You", "is-you") : null,
        el("span", { class: "fp-meta" }, [
          c.edited_at ? el("span", { class: "fp-edited", text: "edited" }) : null,
          editable ? el("button", { class: "fp-edit-btn", type: "button", onclick: () => startEdit(c.comment_id) }, ["Edit"]) : null,
          timeEl(c.created_at || Date.now())
        ])
      ]),
      turnBody(c, t)
    ]);
  }
  function hue(name) {
    let h = 0;
    for (let i = 0;i < name.length; i++)
      h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }
  function patchChildren(parent, desired) {
    for (let i = 0;i < desired.length; i++) {
      const want = desired[i];
      const have = parent.childNodes[i] || null;
      if (have !== want)
        parent.insertBefore(want, have);
    }
    while (parent.childNodes.length > desired.length)
      parent.removeChild(parent.lastChild);
  }
  function withFocusKept(fn) {
    const before = root.activeElement;
    const key = before?.getAttribute ? before.getAttribute("data-fp-focus") : null;
    let sel = null;
    if (key && typeof before.selectionStart === "number") {
      sel = [before.selectionStart, before.selectionEnd];
    }
    fn();
    if (!key || root.activeElement === before)
      return;
    const next = root.querySelector(`[data-fp-focus="${key}"]`);
    if (!next)
      return;
    try {
      next.focus({ preventScroll: true });
      if (sel && next.setSelectionRange)
        next.setSelectionRange(sel[0], sel[1]);
    } catch (_) {}
  }
  function focusPanel() {
    if (STATE.draft) {
      focusComposer("new");
      return;
    }
    try {
      panel.focus({ preventScroll: true });
    } catch (_) {}
  }
  function returnFocus() {
    try {
      fab.focus({ preventScroll: true });
    } catch (_) {}
  }
  function focusComposer(key) {
    const sel = key === "gate" || key === "rename" ? `[data-fp-focus="${key}"]` : `[data-fp-focus="composer:${key}"]`;
    const node = root.querySelector(sel);
    if (!node)
      return;
    try {
      node.focus({ preventScroll: true });
      if (node.tagName === "TEXTAREA") {
        const end = node.value.length;
        node.setSelectionRange(end, end);
        autogrow(node);
      }
    } catch (_) {}
  }
  function scrollCardIntoView(id) {
    const c = cards.get(id);
    if (!c?.node.isConnected)
      return;
    const r = c.node.getBoundingClientRect();
    const b = body.getBoundingClientRect();
    if (r.top < b.top || r.top > b.bottom - 80) {
      body.scrollTop += r.top - b.top - 8;
    }
  }

  // widget-src/parts/40-actions.js
  var EDIT_WINDOW_MS = 15 * 60 * 1000;
  var enc = encodeURIComponent;
  function setHash(id) {
    try {
      const base = location.pathname + location.search;
      history.replaceState(null, "", id ? `${base}#c-${enc(id)}` : base);
    } catch (_) {}
  }
  function fail(key, e) {
    if (e && e.code === "passcode_required" && STATE.cfg) {
      STATE.cfg.passcode_required = true;
      STATE.passcodeError = "That passcode is no longer valid. Enter the current one to continue.";
    }
    let message = e?.message || "Something went wrong. Try again.";
    if (e && e.code === "no_pseudonym") {
      STATE.pseudonym = null;
      message = "Couldn't save your identity for this site. Allow cookies for it, then try again.";
    }
    STATE.errors[key] = message;
    requestRender();
  }
  function openPanel() {
    if (STATE.open)
      return;
    STATE.open = true;
    STATE.menuFor = null;
    requestRender(() => focusPanel());
    if (!STATE.cfg?.passcode_required) {
      refresh();
      ensurePseudonym().catch(() => {});
    }
  }
  function closePanel() {
    if (!STATE.open)
      return;
    STATE.open = false;
    STATE.menuFor = null;
    STATE.confirmDeleteId = null;
    STATE.renaming = false;
    if (STATE.draft && !readDraft("new")) {
      STATE.draft = null;
      paintHighlights();
    }
    requestRender(() => returnFocus());
  }
  function openThread(id, opts) {
    opts = opts || {};
    const t = threadById(id);
    if (!t)
      return;
    STATE.activeId = id;
    STATE.menuFor = null;
    STATE.confirmDeleteId = null;
    STATE.editingId = null;
    if (STATE.draft && !readDraft("new"))
      STATE.draft = null;
    if (t.status === "resolved")
      STATE.showResolved = true;
    setHash(id);
    if (!STATE.open) {
      STATE.open = true;
      if (!STATE.cfg?.passcode_required) {
        refresh();
        ensurePseudonym().catch(() => {});
      }
    }
    requestRender(() => {
      scrollCardIntoView(id);
      if (opts.focus !== false)
        focusComposer(id);
    });
    if (opts.scroll !== false)
      scrollToThread(id);
    else
      paintHighlights();
  }
  function closeThread() {
    STATE.activeId = null;
    STATE.menuFor = null;
    STATE.confirmDeleteId = null;
    STATE.editingId = null;
    setHash(null);
    requestRender();
  }
  function toggleThread(id) {
    if (STATE.activeId === id)
      closeThread();
    else
      openThread(id);
  }
  function openThreadFromHash() {
    const m = /^#c-(.+)$/.exec(location.hash || "");
    if (!m)
      return false;
    let id = m[1];
    try {
      id = decodeURIComponent(id);
    } catch (_) {}
    if (!threadById(id))
      return false;
    openThread(id, { focus: false });
    return true;
  }
  function toggleMenu(id) {
    STATE.menuFor = STATE.menuFor === id ? null : id;
    requestRender();
  }
  function toggleResolvedVisible() {
    STATE.showResolved = !STATE.showResolved;
    if (!STATE.showResolved && STATE.activeId) {
      const t = threadById(STATE.activeId);
      if (t && t.status === "resolved")
        STATE.activeId = null;
    }
    requestRender();
  }
  function startDraft(range) {
    const quote = range.toString();
    STATE.draft = { anchor: buildTextQuoteAnchor(range), range: range.cloneRange(), quote };
    STATE.activeId = null;
    STATE.menuFor = null;
    delete STATE.errors.new;
    const sel = window.getSelection?.();
    if (sel)
      sel.removeAllRanges();
    if (!STATE.open) {
      STATE.open = true;
      if (!STATE.cfg?.passcode_required)
        refresh();
    }
    paintHighlights();
    requestRender(() => focusComposer("new"));
  }
  function startPageNote() {
    STATE.draft = { anchor: buildPageAnchor(), range: null, quote: "" };
    STATE.activeId = null;
    STATE.menuFor = null;
    delete STATE.errors.new;
    STATE.open = true;
    paintHighlights();
    requestRender(() => focusComposer("new"));
  }
  function cancelDraft() {
    STATE.draft = null;
    saveDraft("new", "");
    delete STATE.errors.new;
    paintHighlights();
    requestRender();
  }
  function submitNewThread(text) {
    text = (text || "").trim();
    if (!text || !STATE.draft || isBusy("new"))
      return Promise.resolve(false);
    const anchor = STATE.draft.anchor;
    setBusy("new", true);
    delete STATE.errors.new;
    requestRender();
    return ensurePseudonym().then(() => api("threads", { method: "POST", body: { page_path: pagePath(), anchor, body: text } })).then((created) => {
      setBusy("new", false);
      STATE.draft = null;
      saveDraft("new", "");
      if (created?.thread_id) {
        STATE.threads.push(created);
        invalidateAnchors();
        STATE.activeId = created.thread_id;
        setHash(created.thread_id);
        requestRender(() => scrollCardIntoView(created.thread_id));
      }
      notice(created && created.visibility === "pending" ? "Posted — it will show once the owner approves it" : "Comment posted");
      paintHighlights();
      return refresh().then(() => true);
    }).catch((e) => {
      setBusy("new", false);
      fail("new", e);
      return false;
    });
  }
  function submitReply(threadId, text) {
    text = (text || "").trim();
    if (!text || isBusy(threadId))
      return Promise.resolve(false);
    setBusy(threadId, true);
    delete STATE.errors[threadId];
    requestRender();
    return ensurePseudonym().then(() => api(`threads/${enc(threadId)}/replies`, { method: "POST", body: { body: text } })).then((created) => {
      setBusy(threadId, false);
      saveDraft(threadId, "");
      const t = threadById(threadId);
      if (t && created?.comment_id) {
        t.comments = (t.comments || []).concat([created]);
        t.comment_count = t.comments.length;
        t.updated_at = created.created_at || Date.now();
      }
      requestRender();
      return refresh().then(() => true);
    }).catch((e) => {
      setBusy(threadId, false);
      fail(threadId, e);
      return false;
    });
  }
  function setThreadStatus(id, status) {
    if (isBusy(id))
      return;
    setBusy(id, true);
    requestRender();
    api(`threads/${enc(id)}/${status === "resolved" ? "resolve" : "reopen"}`, { method: "POST" }).then(() => {
      setBusy(id, false);
      const t = threadById(id);
      if (t)
        t.status = status;
      if (status === "resolved") {
        STATE.activeId = null;
        setHash(null);
        notice("Resolved");
      } else {
        STATE.showResolved = true;
        notice("Reopened");
      }
      paintHighlights();
      requestRender();
    }).catch((e) => {
      setBusy(id, false);
      notice(e?.message || "Couldn't update the thread");
    });
  }
  function deleteThread(id) {
    if (isBusy(id))
      return;
    setBusy(id, true);
    requestRender();
    api(`threads/${enc(id)}`, { method: "DELETE" }).then(() => {
      setBusy(id, false);
      STATE.threads = STATE.threads.filter((t) => t.thread_id !== id);
      STATE.pending = STATE.pending.filter((t) => t.thread_id !== id);
      STATE.confirmDeleteId = null;
      if (STATE.activeId === id) {
        STATE.activeId = null;
        setHash(null);
      }
      invalidateAnchors();
      paintHighlights();
      notice("Comment deleted");
    }).catch((e) => {
      setBusy(id, false);
      STATE.confirmDeleteId = null;
      notice(e?.message || "Couldn't delete the thread");
    });
  }
  function reportThread(id) {
    STATE.menuFor = null;
    requestRender();
    api(`threads/${enc(id)}/report`, { method: "POST", body: { reason: "" } }).then(() => notice("Reported. Thanks for letting us know.")).catch((e) => notice(e?.message || "Couldn't send the report"));
  }
  function approveThread(id) {
    if (isBusy(id))
      return;
    setBusy(id, true);
    requestRender();
    api(`threads/${enc(id)}/approve`, { method: "POST" }).then(() => {
      setBusy(id, false);
      notice("Approved");
      return refresh();
    }).catch((e) => {
      setBusy(id, false);
      notice(e?.message || "Couldn't approve the thread");
    });
  }
  function rejectThread(id) {
    if (isBusy(id))
      return;
    setBusy(id, true);
    requestRender();
    api(`threads/${enc(id)}/reject`, { method: "POST" }).then(() => {
      setBusy(id, false);
      STATE.pending = STATE.pending.filter((t) => t.thread_id !== id);
      STATE.threads = STATE.threads.filter((t) => t.thread_id !== id);
      if (STATE.activeId === id)
        STATE.activeId = null;
      invalidateAnchors();
      paintHighlights();
      notice("Rejected");
    }).catch((e) => {
      setBusy(id, false);
      notice(e?.message || "Couldn't reject the thread");
    });
  }
  function canEdit(comment) {
    if (!comment)
      return false;
    if (canModerate())
      return true;
    return isMine(comment) && Date.now() - (comment.created_at || 0) < EDIT_WINDOW_MS;
  }
  function startEdit(commentId) {
    STATE.editingId = commentId;
    STATE.menuFor = null;
    delete STATE.errors[`edit:${commentId}`];
    requestRender(() => focusComposer(`edit:${commentId}`));
  }
  function cancelEdit() {
    STATE.editingId = null;
    requestRender();
  }
  function submitEdit(commentId, text) {
    text = (text || "").trim();
    const key = `edit:${commentId}`;
    if (!text || isBusy(key))
      return Promise.resolve(false);
    setBusy(key, true);
    delete STATE.errors[key];
    requestRender();
    return api(`comments/${enc(commentId)}`, { method: "PATCH", body: { body: text } }).then((updated) => {
      setBusy(key, false);
      for (const t of STATE.threads.concat(STATE.pending)) {
        for (const c of t.comments || []) {
          if (c.comment_id === commentId) {
            c.body = updated?.body || text;
            c.edited_at = updated?.edited_at || Date.now();
          }
        }
        const rootC = rootOf(t);
        if (rootC && rootC.comment_id === commentId) {
          rootC.body = updated?.body || text;
          rootC.edited_at = updated?.edited_at || Date.now();
        }
      }
      STATE.editingId = null;
      notice("Saved");
      return true;
    }).catch((e) => {
      setBusy(key, false);
      if (e && e.status === 423)
        e.message = "The 15-minute edit window has closed.";
      fail(key, e);
      return false;
    });
  }
  function startRename() {
    STATE.renaming = true;
    delete STATE.errors.rename;
    requestRender(() => focusComposer("rename"));
  }
  function cancelRename() {
    STATE.renaming = false;
    delete STATE.errors.rename;
    requestRender();
  }
  function submitRename(name) {
    if (isBusy("rename"))
      return Promise.resolve(false);
    setBusy("rename", true);
    requestRender();
    return ensurePseudonym().then(() => api("pseudonym", { method: "POST", body: { pseudonym: name } })).then((j) => {
      setBusy("rename", false);
      const next = j?.pseudonym || name;
      for (const t of STATE.threads.concat(STATE.pending)) {
        for (const c of t.comments || []) {
          if (c.author && c.author.display_name === STATE.pseudonym)
            c.author.display_name = next;
        }
        const rootC = rootOf(t);
        if (rootC?.author && rootC.author.display_name === STATE.pseudonym) {
          rootC.author.display_name = next;
        }
      }
      STATE.pseudonym = next;
      STATE.renaming = false;
      notice(`You're commenting as ${next}`);
      return refresh().then(() => true);
    }).catch((e) => {
      setBusy("rename", false);
      fail("rename", e);
      return false;
    });
  }
  function copyLink(id) {
    STATE.menuFor = null;
    requestRender();
    const url = `${location.origin}${location.pathname}${location.search}#c-${enc(id)}`;
    const done = () => notice("Link copied");
    const failed = () => notice("Couldn't copy the link");
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(done, failed);
      } else
        failed();
    } catch (_) {
      failed();
    }
  }
  function submitPasscode(code) {
    code = (code || "").trim();
    if (!code) {
      STATE.passcodeError = "Enter the passcode first.";
      requestRender();
      return Promise.resolve(false);
    }
    if (isBusy("gate"))
      return Promise.resolve(false);
    setBusy("gate", true);
    requestRender();
    return api("passcode", { method: "POST", body: { passcode: code } }).then(() => {
      setBusy("gate", false);
      STATE.passcodeError = null;
      if (STATE.cfg)
        STATE.cfg.passcode_required = false;
      requestRender();
      return refresh().then(() => {
        openThreadFromHash();
        return true;
      });
    }).catch(() => {
      setBusy("gate", false);
      STATE.passcodeError = "That passcode didn't work. Check it and try again.";
      requestRender(() => focusComposer("gate"));
      return false;
    });
  }

  // widget-src/parts/50-selection.js
  var btn = null;
  var range = null;
  var armed = false;
  function ensure() {
    if (btn)
      return btn;
    btn = el("button", {
      class: "fp-sel-btn",
      type: "button",
      "aria-label": "Comment on the selected text",
      onmousedown: (e) => {
        e.preventDefault();
        armed = true;
      },
      onclick: () => commit()
    }, [svg(ICON.bubble, 14), "Comment"]);
    return btn;
  }
  function isSelectionButtonVisible() {
    return !!btn?.isConnected;
  }
  function isSelectionArmed() {
    return armed;
  }
  function disarmSelection() {
    armed = false;
  }
  function hideSelectionButton() {
    if (btn?.parentNode)
      btn.parentNode.removeChild(btn);
    range = null;
  }
  function showSelectionButton() {
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      hideSelectionButton();
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2 || text.length > 600) {
      hideSelectionButton();
      return;
    }
    const r = sel.getRangeAt(0);
    let touchesWidget = host.contains(r.commonAncestorContainer);
    try {
      touchesWidget = touchesWidget || r.intersectsNode(host);
    } catch (_) {}
    if (touchesWidget) {
      hideSelectionButton();
      return;
    }
    const rect = r.getBoundingClientRect();
    if (!rect?.width) {
      hideSelectionButton();
      return;
    }
    range = r.cloneRange();
    place(rect);
  }
  function place(rect) {
    const layer = chromeEl();
    if (!layer)
      return;
    const b = ensure();
    if (!b.isConnected)
      layer.appendChild(b);
    if (isNarrow()) {
      b.classList.add("is-docked");
      b.style.cssText = "";
      return;
    }
    b.classList.remove("is-docked");
    const cb = layer.getBoundingClientRect();
    const h = 30;
    let top = rect.top - h - 10;
    if (top < 8)
      top = rect.bottom + 10;
    const rightLimit = vw() - (STATE.open ? 380 : 0) - 70;
    let left = rect.left + rect.width / 2;
    if (left > rightLimit)
      left = rightLimit;
    if (left < 70)
      left = 70;
    b.style.cssText = `top:${top - cb.top}px;left:${left - cb.left}px;`;
  }
  function repositionSelectionButton() {
    if (!range || !isSelectionButtonVisible())
      return;
    place(range.getBoundingClientRect());
  }
  function commit() {
    const r = range;
    hideSelectionButton();
    armed = false;
    if (r)
      startDraft(r);
  }

  // widget-src/parts/60-events.js
  function pathHasClass(path, cls) {
    for (const n of path)
      if (n?.classList?.contains(cls))
        return true;
    return false;
  }
  function onEscape() {
    if (STATE.menuFor) {
      STATE.menuFor = null;
      requestRender();
      return true;
    }
    if (STATE.confirmDeleteId) {
      STATE.confirmDeleteId = null;
      requestRender();
      return true;
    }
    if (STATE.editingId) {
      cancelEdit();
      return true;
    }
    if (STATE.renaming) {
      cancelRename();
      return true;
    }
    if (isSelectionButtonVisible()) {
      hideSelectionButton();
      return true;
    }
    if (STATE.draft && !readDraft("new")) {
      cancelDraft();
      return true;
    }
    if (STATE.activeId) {
      closeThread();
      return true;
    }
    if (STATE.open) {
      closePanel();
      return true;
    }
    return false;
  }
  var rafPending = false;
  function scheduleReposition() {
    if (rafPending)
      return;
    rafPending = true;
    (window.requestAnimationFrame || ((f) => setTimeout(f, 16)))(() => {
      rafPending = false;
      paintHighlights();
      repositionSelectionButton();
    });
  }
  var CATCH_UP_MS = 15000;
  var lastCatchUp = 0;
  function catchUp() {
    if (!STATE.cfg?.enabled || STATE.cfg.passcode_required)
      return;
    const now = Date.now();
    if (now - lastCatchUp < CATCH_UP_MS)
      return;
    lastCatchUp = now;
    refresh();
  }
  function wireEvents() {
    let mouseDown = false;
    let selTimer = null;
    document.addEventListener("selectionchange", () => {
      if (mouseDown)
        return;
      if (selTimer)
        clearTimeout(selTimer);
      selTimer = setTimeout(showSelectionButton, 250);
    });
    document.addEventListener("mousedown", (e) => {
      mouseDown = true;
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      if (STATE.menuFor && !pathHasClass(path, "fp-menu-wrap")) {
        STATE.menuFor = null;
        requestRender();
      }
    }, true);
    document.addEventListener("mousedown", () => {
      if (isSelectionButtonVisible() && !isSelectionArmed())
        hideSelectionButton();
      disarmSelection();
    });
    document.addEventListener("mouseup", () => {
      mouseDown = false;
      setTimeout(showSelectionButton, 0);
    }, true);
    document.addEventListener("click", (e) => {
      const path = typeof e.composedPath === "function" ? e.composedPath() : [];
      if (path.indexOf(host) >= 0)
        return;
      const t = e.target;
      if (t?.closest?.("a,button,input,textarea,select,label,[contenteditable]")) {
        return;
      }
      const sel = window.getSelection?.();
      if (sel && !sel.isCollapsed && String(sel).trim().length > 1)
        return;
      const id = threadAtPoint(e.clientX, e.clientY);
      if (id)
        openThread(id, { scroll: false });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape")
        return;
      if (onEscape())
        e.preventDefault();
    });
    window.addEventListener("hashchange", () => {
      openThreadFromHash();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden)
        catchUp();
    });
    window.addEventListener("focus", catchUp);
    window.addEventListener("scroll", scheduleReposition, { passive: true, capture: true });
    window.addEventListener("resize", () => {
      requestRender();
      scheduleReposition();
    });
    if (window.visualViewport?.addEventListener) {
      const onVV = () => {
        requestRender();
        scheduleReposition();
      };
      window.visualViewport.addEventListener("resize", onVV);
      window.visualViewport.addEventListener("scroll", onVV);
    }
    if (typeof MutationObserver === "function") {
      let contentTimer = null;
      const content = new MutationObserver(() => {
        if (contentTimer)
          return;
        contentTimer = setTimeout(() => {
          contentTimer = null;
          invalidateAnchors();
          requestRender();
        }, 250);
      });
      let visTimer = null;
      const visibility = new MutationObserver(() => {
        if (visTimer)
          return;
        visTimer = setTimeout(() => {
          visTimer = null;
          requestRender();
        }, 120);
      });
      try {
        content.observe(document.body, { childList: true, subtree: true, characterData: true });
        visibility.observe(document.body, {
          attributes: true,
          subtree: true,
          attributeFilter: ["class", "style", "hidden", "aria-hidden", "open", "aria-selected"]
        });
      } catch (_) {}
    }
  }

  // widget-src/parts/99-boot.js
  function warn(err) {
    try {
      if (window.__flypodCommentsWarned)
        return;
      window.__flypodCommentsWarned = true;
      if (window.console?.warn) {
        window.console.warn(`[flypod comments] widget failed to start: ${err?.message || String(err)} — the page is unaffected; comments will not appear.`);
      }
    } catch (_) {}
  }
  function boot() {
    try {
      wireEvents();
      loadConfig().then((cfg) => {
        if (!cfg?.enabled)
          return;
        document.body.appendChild(host);
        mount();
        render();
        if (cfg.passcode_required)
          return;
        return refresh().then(() => {
          render();
          openThreadFromHash();
        });
      }).catch(warn);
    } catch (e) {
      warn(e);
    }
  }
  if (READY)
    boot();
})();
