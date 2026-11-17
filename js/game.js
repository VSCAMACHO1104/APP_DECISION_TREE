// Reglas del juego compartidas por la consola y los concursantes.

import { CONFIG } from "./config.js";
import { QUESTIONS } from "./questions.js";

export const TOTAL = QUESTIONS.length;
export const qKey = (i) => "e" + (i + 1);
export const GRACE_MS = 1500; // tolerancia de red al cierre del tiempo

export function defaultGame() {
  return { phase: "lobby", time: CONFIG.defaultQuestionTime };
}

// Puntos: solo si es correcta. Base + bono lineal según la rapidez.
export function scoreAnswer(answer, q, game) {
  if (!answer || answer.t == null || !game?.startedAt) return { c: answer?.c ?? null, ok: false, ms: null, p: 0 };
  const ms = Math.max(0, answer.t - game.startedAt);
  const ok = answer.c === q.correct && ms <= game.durationMs + GRACE_MS;
  const speed = Math.max(0, 1 - Math.min(ms, game.durationMs) / game.durationMs);
  const bonus = ok ? Math.round(CONFIG.maxSpeedBonus * speed) : 0;
  return { c: answer.c, ok, ms, p: ok ? CONFIG.basePoints + bonus : 0, b: bonus };
}

// Recalcula totales y racha a partir del detalle por evaluación.
export function summarize(qmap = {}, uptoIndex = TOTAL - 1) {
  let total = 0,
    correct = 0,
    msSum = 0,
    answered = 0,
    streak = 0;
  for (let i = 0; i < TOTAL; i++) {
    const e = qmap[qKey(i)];
    if (!e) continue;
    total += e.p || 0;
    if (e.c) answered++;
    if (e.ok) {
      correct++;
      msSum += e.ms || 0;
    }
  }
  for (let i = uptoIndex; i >= 0; i--) {
    const e = qmap[qKey(i)];
    if (!e) continue;
    if (e.ok) streak++;
    else break;
  }
  return { total, correct, msSum, answered, streak };
}

const cmp = (a, b) =>
  b.total - a.total || b.correct - a.correct || a.msSum - b.msSum || a.display.localeCompare(b.display, "es");

// Ranking ordenado. Incluye posición anterior para animar el tablero.
export function ranking(players = {}, scores = {}, currentKey = null) {
  const list = Object.entries(players || {}).map(([pid, p]) => {
    const s = (scores || {})[pid] || {};
    const qmap = s.q || {};
    const sum = summarize(qmap);
    const last = currentKey ? qmap[currentKey] : null;
    return {
      pid,
      name: p.name,
      last: p.last,
      display: `${p.name} ${p.last}`.trim(),
      online: p.online !== false,
      joinedAt: p.joinedAt || 0,
      ...sum,
      gain: last?.p || 0,
      lastEntry: last || null,
      prevTotal: sum.total - (last?.p || 0),
      qmap,
    };
  });
  list.sort(cmp);
  list.forEach((r, i) => (r.rank = i));
  const prev = [...list].sort((a, b) => b.prevTotal - a.prevTotal || cmp(a, b));
  prev.forEach((r, i) => (r.prevRank = i));
  return list;
}

const AV = ["#e75a24", "#525252", "#8f8681", "#070000"];
export function avatarColor(pid) {
  let h = 0;
  for (const ch of String(pid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AV[h % AV.length];
}
