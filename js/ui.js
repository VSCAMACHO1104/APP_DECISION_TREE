// Utilidades de interfaz compartidas.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function slugify(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function titleCase(s) {
  return String(s)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
}

export function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function toast(msg, kind = "") {
  let box = $(".toasts");
  if (!box) {
    box = document.createElement("div");
    box.className = "toasts";
    document.body.appendChild(box);
  }
  const t = document.createElement("div");
  t.className = "toast " + kind;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.classList.add("out"), 2800);
  setTimeout(() => t.remove(), 3300);
}

export function modal({ title, body = "", actions = [{ label: "Aceptar", value: true, primary: true }] }) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "modal-wrap";
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">
          ${actions
            .map((a, i) => `<button class="btn ${a.primary ? "btn-primary" : a.danger ? "btn-danger" : "btn-ghost"}" data-i="${i}">${esc(a.label)}</button>`)
            .join("")}
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const close = (v) => {
      wrap.classList.add("out");
      setTimeout(() => wrap.remove(), 200);
      resolve(v);
    };
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-i]");
      if (b) close(actions[+b.dataset.i].value);
      else if (e.target === wrap) close(null);
    });
    wrap.querySelector(".btn-primary, .btn")?.focus();
  });
}

export const ICONS = {
  sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  full: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  users: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5" fill="currentColor"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0z" fill="currentColor"/><circle cx="17" cy="9" r="2.6" fill="currentColor" opacity=".6"/><path d="M15.5 14.2A5.5 5.5 0 0 1 22 19.5h-4.6" fill="currentColor" opacity=".6"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cross: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M10 14h4v3h-4zM8 20h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 0 2 1 3 2 3-1-3 .5-6 .5-9z" fill="currentColor"/></svg>`,
  play: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l9 7-9 7zM16 5h3v14h-3z" fill="currentColor"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>`,
  podium: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 8h6v13H9zM2 13h7v8H2zM15 11h7v10h-7z" fill="currentColor"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  download: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" fill="currentColor"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  monitor: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  hide: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15l8-6 8 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

export const SHAPES = {
  A: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3l7.5 13h-15z" fill="currentColor"/></svg>`,
  B: `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2l8 8-8 8-8-8z" fill="currentColor"/></svg>`,
  C: `<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7.5" fill="currentColor"/></svg>`,
};

export function badge(L, extra = "") {
  return `<span class="badge badge--${L} ${extra}"><b>${L}</b><i>${SHAPES[L]}</i></span>`;
}

// Separa "Término: descripción" (si aplica)
export function splitOption(text) {
  const i = text.indexOf(":");
  if (i > 0 && i < 70) return [text.slice(0, i).trim(), text.slice(i + 1).trim()];
  return [null, text];
}

export function brandHeader({ right = "", sub = "Academia de Ventas · Módulo 2" } = {}) {
  return `
  <header class="brandbar">
    <div class="brandbar-left">
      <img class="brand-logo" src="assets/logo-traa.png" alt="TRAA Repuestos — 40 años">
      <div class="brand-text"><strong>Árbol de Decisión</strong><span>${esc(sub)}</span></div>
    </div>
    <div class="brandbar-right">${right}</div>
  </header>`;
}

export function fmtMs(ms) {
  return (ms / 1000).toFixed(1).replace(".", ",") + " s";
}
