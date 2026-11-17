// Vista del concursante (pensada para celular).

import { CONFIG } from "./config.js";
import { QUESTIONS, LETTERS } from "./questions.js";
import { TS } from "./store.js";
import { MINI } from "./scenes.js";
import { sfx, confetti, countUp } from "./fx.js";
import { TOTAL, qKey, ranking, avatarColor } from "./game.js";
import { $, $$, esc, slugify, titleCase, initials, toast, modal, ICONS, badge, splitOption, brandHeader, fmtMs } from "./ui.js";

export function runPlayer(app, store) {
  const sessStore = store.mode === "local" ? sessionStorage : localStorage;
  const SKEY = "traa_player_v1";
  const readSess = () => {
    try {
      return JSON.parse(sessStore.getItem(SKEY));
    } catch {
      return null;
    }
  };
  const writeSess = (v) => (v ? sessStore.setItem(SKEY, JSON.stringify(v)) : sessStore.removeItem(SKEY));

  let S = null; // estado de la sesión activa
  let unsubs = [];
  let timerInt = 0;

  // -------------------------- Ingreso --------------------------
  async function showLogin(msg) {
    cleanup();
    const sess = readSess();
    let resumeRec = null;
    if (sess?.pid) {
      try {
        resumeRec = await store.get(`players/${sess.pid}`);
      } catch {}
    }
    app.innerHTML = `
      <div class="login">
        ${bgTree()}
        ${brandHeader({ right: `<span class="mode-badge ${store.mode === "firebase" ? "live" : ""}">${store.mode === "firebase" ? "En vivo" : "Demo"}</span>` })}
        <main class="login-main">
          <section class="login-hero">
            <div class="academia-card"><img src="assets/logo-academia.png" alt="Academia de Ventas TRAA"></div>
            <h1>Árbol de decisión <span>Conceptos clave</span></h1>
            <p>Repaso estratégico del Módulo 1 y fundamentos de Inteligencia Emocional y Sinergia Organizacional.</p>
            <div class="rules-mini">
              <span class="chip chip-dark">10 evaluaciones</span>
              <span class="chip chip-orange">${CONFIG.basePoints} pts por acierto</span>
              <span class="chip">+${CONFIG.maxSpeedBonus} por velocidad</span>
            </div>
          </section>
          <section class="login-card">
            <h2>¡Entra a la dinámica!</h2>
            <p class="hint">Solo necesitas tu nombre y tu primer apellido.</p>
            ${
              resumeRec && sess
                ? `<div class="resume"><span class="avatar" style="--c:${avatarColor(sess.pid)}">${esc(initials(sess.name + " " + sess.last))}</span>
                   <div><strong>${esc(sess.name)} ${esc(sess.last)}</strong><small>Tu sesión sigue activa</small></div>
                   <button class="btn btn-primary" id="resumeBtn">Continuar</button></div>`
                : ""
            }
            <form id="loginForm" autocomplete="off" novalidate>
              <div class="field"><label for="fn">Nombre</label><input id="fn" name="fn" maxlength="30" placeholder="Ej. María" value="${esc(sess?.name || "")}" required></div>
              <div class="field"><label for="ln">Primer apellido</label><input id="ln" name="ln" maxlength="30" placeholder="Ej. Rodríguez" value="${esc(sess?.last || "")}" required></div>
              <div class="form-error" id="err" role="alert">${esc(msg || "")}</div>
              <button class="btn btn-primary btn-lg btn-block" type="submit">Entrar ${ICONS.play}</button>
            </form>
            ${store.mode === "local" ? `<div class="demo-note">Modo demostración: los datos viven en este navegador. Abre otra pestaña para simular más concursantes.</div>` : ""}
            <div class="login-foot"><a class="link" href="#admin">Acceso administrador</a></div>
          </section>
        </main>
      </div>`;
    $("#resumeBtn")?.addEventListener("click", () => join(sess.name, sess.last, true));
    $("#loginForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const fn = $("#fn").value.trim();
      const ln = $("#ln").value.trim();
      const re = /^[\p{L}][\p{L}'´`.\- ]{1,29}$/u;
      if (!re.test(fn)) return showErr("Escribe tu nombre (mínimo 2 letras).", "#fn");
      if (!re.test(ln)) return showErr("Escribe tu primer apellido (mínimo 2 letras).", "#ln");
      join(fn, ln, false);
    });
    if (!sess) $("#fn")?.focus();
  }

  function showErr(m, sel) {
    $("#err").textContent = m;
    $(sel)?.focus();
  }

  async function join(fn, ln, isResume) {
    const btn = $("#loginForm button[type=submit]");
    if (btn) btn.disabled = true;
    try {
      const name = titleCase(fn);
      const last = titleCase(ln);
      const pid = slugify(`${name} ${last}`);
      if (!pid) throw new Error("Nombre inválido");
      const uid = await store.signInPlayer();
      const rec = await store.get(`players/${pid}`);
      if (rec && rec.uid !== uid && rec.online && !isResume) {
        const ok = await modal({
          title: "Ese nombre ya está conectado",
          body: `Ya hay un concursante activo como <b>${esc(name)} ${esc(last)}</b>.<br><br>Si eres tú desde otro dispositivo, continúa. Si no, agrega tu segundo apellido o una inicial para diferenciarte.`,
          actions: [
            { label: "Cambiar nombre", value: false },
            { label: "Soy yo, continuar", value: true, primary: true },
          ],
        });
        if (!ok) {
          if (btn) btn.disabled = false;
          $("#ln")?.focus();
          return;
        }
      }
      await store.update(`players/${pid}`, { name, last, uid, online: true, joinedAt: rec?.joinedAt ?? TS });
      writeSess({ pid, name, last });
      sfx.play("join");
      enter(pid, name, last);
    } catch (e) {
      console.error(e);
      if (btn) btn.disabled = false;
      const m = $("#err");
      if (m) m.textContent = "No se pudo ingresar. Revisa tu conexión e intenta de nuevo.";
    }
  }

  // -------------------------- Sesión --------------------------
  function enter(pid, name, last) {
    cleanup();
    S = { pid, name, last, game: null, me: null, seenMe: false, players: {}, scores: {}, myAnswer: null, ansKey: null, viewKey: "", localPick: null };
    app.innerHTML = `
      <div class="pv">
        ${brandHeader({
          sub: "Academia de Ventas",
          right: `<div class="pv-me"><span class="avatar" style="--c:${avatarColor(pid)}">${esc(initials(name + " " + last))}</span>
                    <span class="pv-score" id="myScore">0 pts</span></div>
                  <button class="icon-btn" id="sndBtn" aria-label="Sonido">${sfx.muted ? ICONS.mute : ICONS.sound}</button>
                  <button class="icon-btn" id="outBtn" aria-label="Salir">${ICONS.logout}</button>`,
        })}
        <main class="pv-main" id="pvMain"></main>
      </div>`;
    $("#sndBtn").onclick = () => {
      const m = sfx.toggle();
      $("#sndBtn").innerHTML = m ? ICONS.mute : ICONS.sound;
    };
    $("#outBtn").onclick = async () => {
      const ok = await modal({
        title: "¿Salir de la dinámica?",
        body: "Tus puntos se conservan. Podrás volver a entrar con el mismo nombre y apellido.",
        actions: [
          { label: "Cancelar", value: false },
          { label: "Salir", value: true, primary: true },
        ],
      });
      if (!ok) return;
      try {
        await store.update(`players/${pid}`, { online: false });
      } catch {}
      writeSess(null);
      showLogin();
    };

    unsubs.push(store.startPresence(pid));
    unsubs.push(
      store.on("game", (g) => {
        S.game = g || { phase: "lobby" };
        watchAnswer();
        render();
      })
    );
    unsubs.push(
      store.on(`players/${pid}`, (p) => {
        if (p) {
          S.seenMe = true;
          S.me = p;
        } else if (S.seenMe) {
          writeSess(null);
          showLogin("Tu sesión fue cerrada por el facilitador. Vuelve a ingresar.");
          toast("Tu sesión fue cerrada por el facilitador.");
        }
      })
    );
    unsubs.push(
      store.on("players", (ps) => {
        S.players = ps || {};
        const n = $("#pcount");
        if (n) n.textContent = onlineCount();
      })
    );
    unsubs.push(
      store.on("scores", (sc) => {
        S.scores = sc || {};
        const mine = S.scores[pid];
        const tot = Object.values(mine?.q || {}).reduce((a, e) => a + (e.p || 0), 0);
        $("#myScore").textContent = tot.toLocaleString("es") + " pts";
        render(true);
      })
    );
    timerInt = setInterval(tickTimer, 200);
  }

  function watchAnswer() {
    const key = S.game?.qKey || null;
    if (key === S.ansKey) return;
    S.ansKey = key;
    S.myAnswer = null;
    S.localPick = null;
    S.ansUnsub?.();
    if (!key) return;
    S.ansUnsub = store.on(`answers/${key}/${S.pid}`, (a) => {
      S.myAnswer = a;
      if (a && S.game?.phase === "question") lockUI(a.c);
    });
  }

  function cleanup() {
    unsubs.forEach((u) => {
      try {
        u && u();
      } catch {}
    });
    unsubs = [];
    S?.ansUnsub?.();
    clearInterval(timerInt);
    S = null;
  }

  const onlineCount = () => Object.values(S.players || {}).filter((p) => p.online !== false).length;

  // -------------------------- Render --------------------------
  function render(scoresChanged = false) {
    if (!S) return;
    const g = S.game || { phase: "lobby" };
    const q = g.qIndex != null ? QUESTIONS[g.qIndex] : null;
    const mine = S.scores?.[S.pid]?.q?.[g.qKey] || null;
    let key = g.phase + ":" + (g.qIndex ?? "");
    if (g.phase === "reveal") key += ":" + JSON.stringify(mine);
    if (g.phase === "leaderboard" || g.phase === "final") key += ":" + JSON.stringify(S.scores?.[S.pid] || {}) + Object.keys(S.scores || {}).length;
    if (key === S.viewKey) return;
    if (scoresChanged && !["reveal", "leaderboard", "final"].includes(g.phase)) return;
    const prevPhase = S.viewKey.split(":")[0];
    S.viewKey = key;
    const main = $("#pvMain");
    if (!main) return;

    if (g.phase === "intro" && q) {
      main.innerHTML = `
        <div class="pv-center">
          <span class="pv-kicker">Evaluación ${q.id} de ${TOTAL} · ${esc(q.themeName)}</span>
          <div class="mini-ico">${MINI[q.theme]}</div>
          <h1 class="pv-concept">${esc(q.concept)}</h1>
          ${q.sub ? `<p class="muted">${esc(q.sub)}</p>` : ""}
          <p>Prepárate: lee las 3 ramas y elige la única correcta.</p>
          <div class="count-ring" id="introRing"><span>${CONFIG.introSeconds}</span></div>
        </div>`;
      sfx.play("whoosh");
    } else if (g.phase === "question" && q) {
      const answered = S.myAnswer?.c || S.localPick;
      main.innerHTML = `
        <div class="pq-head"><div class="mini-ico">${MINI[q.theme]}</div>
          <div><span class="pv-kicker">Evaluación ${q.id} de ${TOTAL}</span><h2>${esc(q.concept)}</h2></div></div>
        <div class="timer-row" id="tRow"><div class="timer-bar"><i id="tBar"></i></div><span class="secs" id="tSecs"></span></div>
        <div class="p-opts" id="pOpts">
          ${LETTERS.map((L, i) => {
            const [term, desc] = splitOption(q.options[L]);
            return `<button class="p-opt" data-l="${L}" style="--i:${i}">${badge(L)}<span>${term ? `<b>${esc(term)}</b>` : ""}${esc(desc)}</span></button>`;
          }).join("")}
        </div>
        <div id="lockMsg"></div>`;
      $$(".p-opt", main).forEach((b) => (b.onclick = () => pick(b.dataset.l)));
      if (answered) lockUI(answered);
      if (prevPhase !== "question") sfx.play("go");
      tickTimer();
    } else if (g.phase === "reveal" && q) {
      main.innerHTML = revealHTML(q, mine);
      if (mine) {
        if (mine.ok) {
          sfx.play("correct");
          confetti({ count: 90, y: 0.3 });
          countUp($("#ptsNum"), mine.p, 1100);
        } else sfx.play("wrong");
      }
    } else if (g.phase === "leaderboard") {
      main.innerHTML = boardHTML(false);
      sfx.play("rank");
    } else if (g.phase === "final") {
      main.innerHTML = boardHTML(true);
      const me = ranking(S.players, S.scores).find((r) => r.pid === S.pid);
      if (me && me.rank < 3) {
        confetti({ count: 160 });
        sfx.play("fanfare");
      } else sfx.play("rank");
      countUp($("#finalPts"), me?.total || 0, 1400);
    } else {
      main.innerHTML = lobbyHTML();
    }
  }

  function lobbyHTML() {
    return `
      <div class="pv-center">
        <div class="wait-orb"><span class="avatar" style="--c:${avatarColor(S.pid)}">${esc(initials(S.name + " " + S.last))}</span></div>
        <span class="pv-kicker">Ya estás dentro</span>
        <h1>¡Hola, ${esc(S.name)}!</h1>
        <p>Espera a que el facilitador lance la siguiente evaluación <span class="dots"><i></i><i></i><i></i></span></p>
        <div class="pv-card rules-list">
          <div><span>Respuesta correcta</span><b>${CONFIG.basePoints} pts</b></div>
          <div><span>Bono por velocidad</span><b>hasta +${CONFIG.maxSpeedBonus}</b></div>
          <div><span>Respuesta incorrecta</span><b>0 pts</b></div>
        </div>
        <div class="academia-banner"><img src="assets/logo-academia.png" alt="Academia de Ventas"><div><strong>Academia de Ventas</strong><span>Módulo 2 · ${TOTAL} evaluaciones</span></div></div>
        <p class="muted"><b id="pcount">${onlineCount()}</b> concursantes conectados</p>
      </div>`;
  }

  function revealHTML(q, mine) {
    const [term, desc] = splitOption(q.options[q.correct]);
    const correctBox = `<div class="correct-ans">${badge(q.correct)}<span>${term ? `<b>${esc(term)}:</b> ` : ""}${esc(desc)}</span></div>`;
    const explain = `<p class="explain"><b>Decisión correcta (Rama ${q.correct}):</b> ${esc(q.explanation)}</p>`;
    if (!mine) {
      return `<div class="pv-center"><div class="result none"><div class="result-ico">${ICONS.clock}</div><h2>Calculando puntos…</h2></div>${correctBox}${explain}</div>`;
    }
    const streak = S.scores?.[S.pid] ? streakOf() : 0;
    if (mine.ok) {
      return `<div class="pv-center"><div class="result ok">
          <div class="result-ico">${ICONS.check}</div>
          <h1>¡Correcto!</h1>
          <div class="pts">+<span id="ptsNum">0</span></div>
          <div class="pts-break"><span class="chip chip-dark">Base ${CONFIG.basePoints}</span><span class="chip chip-orange">Velocidad +${mine.b ?? mine.p - CONFIG.basePoints}</span><span class="chip">${ICONS.clock} ${fmtMs(mine.ms)}</span></div>
          ${streak > 1 ? `<span class="streak">${ICONS.flame} ¡Racha de ${streak} aciertos!</span>` : ""}
        </div>${explain}</div>`;
    }
    const none = !mine.c;
    return `<div class="pv-center"><div class="result ${none ? "none" : "bad"}">
        <div class="result-ico">${none ? ICONS.clock : ICONS.cross}</div>
        <h1>${none ? "¡Se acabó el tiempo!" : "Incorrecto"}</h1>
        <p>${none ? "No alcanzaste a responder." : `Elegiste la rama ${mine.c}. La correcta era:`}</p>
      </div>${correctBox}${explain}</div>`;
  }

  function streakOf() {
    const qmap = S.scores[S.pid]?.q || {};
    let s = 0;
    for (let i = S.game.qIndex; i >= 0; i--) {
      const e = qmap[qKey(i)];
      if (e?.ok) s++;
      else break;
    }
    return s;
  }

  function boardHTML(final) {
    const list = ranking(S.players, S.scores, S.game?.qKey);
    const me = list.find((r) => r.pid === S.pid);
    const top = list.slice(0, 5);
    if (me && !top.includes(me)) top.push(me);
    const rows = top
      .map((r) => `<div class="${r.pid === S.pid ? "me" : ""}"><b>${r.rank + 1}</b><span>${esc(r.display)}</span><b>${r.total.toLocaleString("es")}</b></div>`)
      .join("");
    const avg = me && me.correct ? fmtMs(me.msSum / me.correct) : "—";
    if (final) {
      return `<div class="pv-center">
          <span class="pv-kicker">Resultados finales</span>
          <h1>${me && me.rank < 3 ? "¡Estás en el podio!" : "¡Terminaste!"}</h1>
          <div class="rank-big">#${me ? me.rank + 1 : "–"}<small> de ${list.length}</small></div>
          <div class="stats3"><div><b id="finalPts">0</b><span>Puntos</span></div><div><b>${me?.correct ?? 0}/${TOTAL}</b><span>Correctas</span></div><div><b>${avg}</b><span>Prom. acierto</span></div></div>
          <div class="mini-board">${rows}</div>
          <div class="academia-banner"><img src="assets/logo-academia.png" alt="Academia de Ventas"><div><strong>¡Gracias por participar!</strong><span>Academia de Ventas TRAA · Módulo 2</span></div></div>
        </div>`;
    }
    return `<div class="pv-center">
        <span class="pv-kicker">Ranking · después de la evaluación ${(S.game?.qIndex ?? 0) + 1} de ${TOTAL}</span>
        <div class="rank-big">#${me ? me.rank + 1 : "–"}<small> de ${list.length}</small></div>
        <p>${me ? `${me.total.toLocaleString("es")} pts · ${me.correct} correctas` : ""}</p>
        ${me && me.prevRank > me.rank ? `<span class="streak">▲ Subiste ${me.prevRank - me.rank} ${me.prevRank - me.rank === 1 ? "lugar" : "lugares"}</span>` : ""}
        <div class="mini-board">${rows}</div>
      </div>`;
  }

  // -------------------------- Respuesta --------------------------
  async function pick(L) {
    const g = S.game;
    if (!g || g.phase !== "question" || S.myAnswer || S.localPick) return;
    if (timeLeft() <= 0) return;
    S.localPick = L;
    lockUI(L);
    sfx.play("lock");
    if (navigator.vibrate) navigator.vibrate(30);
    const ok = await store.createOnce(`answers/${g.qKey}/${S.pid}`, { c: L, t: TS });
    if (!ok && !S.myAnswer) {
      toast("No se pudo registrar tu respuesta (tiempo agotado).");
    }
  }

  function lockUI(L) {
    const box = $("#pOpts");
    if (!box) return;
    box.classList.add("locked");
    $$(".p-opt", box).forEach((b) => {
      b.classList.toggle("sel", b.dataset.l === L);
      b.disabled = true;
    });
    const lm = $("#lockMsg");
    if (lm) lm.innerHTML = `<div class="locked-msg">${ICONS.check} Respuesta ${L} registrada · espera el resultado <span class="dots"><i></i><i></i><i></i></span></div>`;
  }

  function timeLeft() {
    const g = S?.game;
    if (!g?.startedAt || !g.durationMs) return g?.durationMs || 0;
    return g.startedAt + g.durationMs - store.now();
  }

  function tickTimer() {
    if (!S?.game) return;
    const g = S.game;
    if (g.phase === "intro") {
      const ring = $("#introRing");
      if (!ring || !g.introAt) return;
      const left = Math.max(0, g.introAt + CONFIG.introSeconds * 1000 - store.now());
      ring.style.setProperty("--p", (left / (CONFIG.introSeconds * 1000)).toFixed(3));
      ring.querySelector("span").textContent = Math.ceil(left / 1000);
    } else if (g.phase === "question") {
      const bar = $("#tBar");
      if (!bar) return;
      const left = Math.max(0, timeLeft());
      const k = g.durationMs ? left / g.durationMs : 1;
      bar.style.transform = `scaleX(${k.toFixed(3)})`;
      const secs = Math.ceil(left / 1000);
      const el = $("#tSecs");
      if (el.textContent !== String(secs)) {
        el.textContent = secs;
        if (secs <= 5 && secs > 0 && !S.myAnswer && !S.localPick) sfx.play("tick");
      }
      $("#tRow").classList.toggle("hurry", secs <= 5);
      if (left <= 0 && !S.myAnswer && !S.localPick) {
        const box = $("#pOpts");
        if (box && !box.classList.contains("locked")) {
          box.classList.add("locked");
          $$(".p-opt", box).forEach((b) => (b.disabled = true));
          $("#lockMsg").innerHTML = `<div class="locked-msg">${ICONS.clock} ¡Tiempo! Espera el resultado…</div>`;
        }
      }
    }
  }

  // -------------------------- Inicio --------------------------
  (async () => {
    const sess = readSess();
    if (sess?.pid) {
      try {
        const uid = await store.signInPlayer();
        const rec = await store.get(`players/${sess.pid}`);
        if (rec && rec.uid === uid) {
          await store.update(`players/${sess.pid}`, { online: true });
          return enter(sess.pid, rec.name, rec.last);
        }
      } catch (e) {
        console.warn(e);
      }
    }
    showLogin();
  })();
}

function bgTree() {
  return `<svg class="login-bg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <path pathLength="1" d="M -50 400 C 150 400, 200 400, 300 400"/>
    <path pathLength="1" d="M 300 400 C 420 400, 440 180, 620 180"/>
    <path pathLength="1" class="o" d="M 300 400 C 420 400, 460 400, 620 400"/>
    <path pathLength="1" d="M 300 400 C 420 400, 440 620, 620 620"/>
    <path pathLength="1" d="M 620 180 C 720 180, 760 90, 900 90 M 620 180 C 720 180, 760 260, 900 260"/>
    <path pathLength="1" class="o" d="M 620 400 C 740 400, 780 340, 1250 340"/>
    <path pathLength="1" d="M 620 620 C 720 620, 760 540, 900 540 M 620 620 C 720 620, 760 710, 900 710"/>
    <circle cx="300" cy="400" r="16"/><circle cx="620" cy="180" r="12"/><circle cx="620" cy="400" r="12"/><circle cx="620" cy="620" r="12"/>
  </svg>`;
}
