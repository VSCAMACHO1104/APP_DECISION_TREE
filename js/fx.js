// Efectos: sonidos sintetizados (sin archivos), confeti y contadores animados.

const PALETTE = ["#e75a24", "#ffffff", "#dcdcdc", "#8f8681", "#525252", "#e75a24"];

// ---------------- Sonido ----------------
let ctx = null;
let muted = (() => {
  try {
    return localStorage.getItem("traa_muted") === "1";
  } catch {
    return false;
  }
})();

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}
["pointerdown", "keydown", "touchstart"].forEach((ev) => window.addEventListener(ev, () => ac(), { once: true, passive: true }));

function tone(freq, start, dur, { type = "sine", gain = 0.18, slide = 0 } = {}) {
  const a = ac();
  if (!a) return;
  const t0 = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function noise(start, dur, gain = 0.12) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 1800;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + start);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.08, { type: "triangle", gain: 0.12 }),
  join: () => {
    tone(523, 0, 0.12, { type: "triangle" });
    tone(784, 0.08, 0.16, { type: "triangle" });
  },
  whoosh: () => noise(0, 0.45, 0.15),
  intro: () => {
    [392, 523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.22, { type: "square", gain: 0.06 }));
  },
  go: () => {
    tone(880, 0, 0.12, { type: "square", gain: 0.08 });
    tone(1175, 0.12, 0.25, { type: "square", gain: 0.08 });
  },
  tick: () => tone(1200, 0, 0.05, { type: "square", gain: 0.05 }),
  lock: () => {
    tone(440, 0, 0.07, { type: "triangle" });
    tone(660, 0.06, 0.1, { type: "triangle" });
  },
  correct: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.28, { type: "triangle", gain: 0.16 }));
  },
  wrong: () => {
    tone(300, 0, 0.25, { type: "sawtooth", gain: 0.08, slide: -120 });
    tone(220, 0.2, 0.35, { type: "sawtooth", gain: 0.08, slide: -90 });
  },
  reveal: () => {
    noise(0, 0.3, 0.1);
    [659, 880].forEach((f, i) => tone(f, 0.15 + i * 0.12, 0.3, { type: "triangle", gain: 0.14 }));
  },
  rank: () => [440, 554, 659].forEach((f, i) => tone(f, i * 0.07, 0.2, { type: "triangle", gain: 0.1 })),
  fanfare: () => {
    const seq = [523, 523, 523, 659, 784, 659, 784, 1047];
    seq.forEach((f, i) => tone(f, i * 0.13, i === seq.length - 1 ? 0.8 : 0.16, { type: "square", gain: 0.07 }));
  },
};

export const sfx = {
  play(name) {
    if (muted) return;
    try {
      SOUNDS[name]?.();
    } catch {}
  },
  get muted() {
    return muted;
  },
  toggle() {
    muted = !muted;
    try {
      localStorage.setItem("traa_muted", muted ? "1" : "0");
    } catch {}
    return muted;
  },
};

// ---------------- Confeti ----------------
let canvas = null;
let parts = [];
let raf = 0;

export function confetti({ count = 140, x = 0.5, y = 0.35, spread = 1, power = 1 } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    document.body.appendChild(canvas);
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const cx = x * innerWidth;
  const cy = y * innerHeight;
  for (let i = 0; i < count; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
    const v = (6 + Math.random() * 9) * power;
    parts.push({
      x: cx,
      y: cy,
      vx: Math.cos(ang) * v,
      vy: Math.sin(ang) * v,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 12,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: PALETTE[(Math.random() * PALETTE.length) | 0],
      life: 0,
      max: 160 + Math.random() * 80,
    });
  }
  if (!raf) loop();
}

function loop() {
  const g = canvas.getContext("2d");
  const dpr = canvas.width / innerWidth;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life < p.max && p.y < innerHeight + 40);
  for (const p of parts) {
    p.life++;
    p.vy += 0.25;
    p.vx *= 0.99;
    p.vy *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    g.save();
    g.globalAlpha = Math.max(0, 1 - p.life / p.max);
    g.translate(p.x, p.y);
    g.rotate(p.r);
    g.fillStyle = p.c;
    g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.life * 0.1)));
    g.restore();
  }
  if (parts.length) raf = requestAnimationFrame(loop);
  else {
    raf = 0;
    g.clearRect(0, 0, innerWidth, innerHeight);
  }
}

export function confettiRain(ms = 3000) {
  const t0 = performance.now();
  const tick = () => {
    confetti({ count: 18, x: Math.random(), y: -0.05, spread: 0.4, power: 0.4 });
    if (performance.now() - t0 < ms) setTimeout(tick, 180);
  };
  tick();
}

// ---------------- Contador animado ----------------
export function countUp(el, to, ms = 1200, from = 0) {
  if (!el) return;
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e).toLocaleString("es");
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
