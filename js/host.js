// Consola del administrador (proyector) y pantalla de solo visualización.

import { CONFIG } from "./config.js";
import { QUESTIONS, LETTERS } from "./questions.js";
import { TS } from "./store.js";
import { mountScene, setScenePhase, setDistribution, fitScene } from "./scenes.js";
import { sfx, confetti, confettiRain, countUp } from "./fx.js";
import { TOTAL, qKey, scoreAnswer, summarize, ranking, avatarColor, defaultGame } from "./game.js";
import { $, $$, esc, initials, toast, modal, ICONS, badge, brandHeader, fmtMs } from "./ui.js";

export function runHost(app, store, { mode }) {
  const isAdmin = mode === "admin";

  if (isAdmin && !store.isAdmin()) return adminLogin();
  start();

  // ---------------------------------------------------------------
  function adminLogin() {
    app.innerHTML = `
      <div class="login">
        ${brandHeader({ sub: "Consola del facilitador", right: `<a class="link" href="#">Ir a concursantes</a>` })}
        <main class="login-main" style="grid-template-columns:minmax(0,1fr) minmax(0,420px)">
          <section class="login-hero">
            <div class="academia-card"><img src="assets/logo-academia.png" alt="Academia de Ventas TRAA"></div>
            <h1>Consola <span>del facilitador</span></h1>
            <p>Controla las 10 evaluaciones, proyecta las escenas animadas y sigue el ranking en tiempo real.</p>
          </section>
          <section class="login-card">
            <h2>Administrador</h2>
            <p class="hint">Ingresa tu contraseña para continuar.</p>
            <form id="admForm">
              <div class="field"><label for="pw">Contraseña</label><input id="pw" type="password" autocomplete="current-password" required></div>
              <div class="form-error" id="err" role="alert"></div>
              <button class="btn btn-primary btn-lg btn-block" type="submit">Entrar a la consola</button>
            </form>
            ${
              store.mode === "local"
                ? `<div class="demo-note">Modo demostración. Contraseña por defecto: <b>TRAA2026</b> (cámbiala en <code>js/config.js</code>).</div>`
                : ""
            }
          </section>
        </main>
      </div>`;
    $("#pw").focus();
    $("#admForm").onsubmit = async (e) => {
      e.preventDefault();
      const b = $("#admForm button");
      b.disabled = true;
      const r = await store.adminLogin($("#pw").value);
      b.disabled = false;
      if (r.ok) start();
      else {
        $("#err").textContent = r.error || "Contraseña incorrecta.";
        $("#pw").select();
      }
    };
  }

  // ---------------------------------------------------------------
  async function start() {
    const S = {
      game: null,
      players: {},
      scores: {},
      answers: {},
      ansKey: null,
      ansUnsub: null,
      viewKey: "",
      scene: null,
      busy: false,
      lastSec: null,
      knownChips: new Set(),
      revealScheduled: false,
      panelOpen: false,
    };

    app.innerHTML = `
      <div class="host ${isAdmin ? "" : "screen"}" id="host">
        ${brandHeader({
          sub: isAdmin ? "Consola del facilitador" : "Pantalla de proyección",
          right: `
            <span class="mode-badge ${store.mode === "firebase" ? "live" : ""}">${store.mode === "firebase" ? "En vivo" : "Demo local"}</span>
            ${isAdmin ? `<button class="chip" id="pBtn" title="Participantes (P)">${ICONS.users}<span id="pCount">0</span></button>` : ""}
            <button class="icon-btn" id="sndBtn" title="Sonido">${sfx.muted ? ICONS.mute : ICONS.sound}</button>
            <button class="icon-btn" id="fsBtn" title="Pantalla completa (F)">${ICONS.full}</button>
            ${isAdmin ? `<button class="icon-btn" id="hideBtn" title="Ocultar controles (H)">${ICONS.hide}</button>` : ""}
            ${isAdmin ? `<button class="icon-btn" id="outBtn" title="Cerrar sesión">${ICONS.logout}</button>` : ""}`,
        })}
        <div class="host-main">
          <div class="stage" id="stage"></div>
          <div class="strip" id="strip"></div>
          ${isAdmin ? `<aside class="ppanel" id="ppanel" aria-label="Participantes"><header><h3>Participantes</h3><button class="icon-btn" id="pClose" aria-label="Cerrar">${ICONS.cross}</button></header><ul id="plist"></ul></aside>` : ""}
        </div>
        ${isAdmin ? `<footer class="dock" id="dock"></footer>` : ""}
      </div>`;

    $("#sndBtn").onclick = () => ($("#sndBtn").innerHTML = sfx.toggle() ? ICONS.mute : ICONS.sound);
    $("#fsBtn").onclick = toggleFS;
    if (isAdmin) {
      $("#hideBtn").onclick = toggleDock;
      $("#pBtn").onclick = togglePanel;
      $("#pClose").onclick = togglePanel;
      $("#outBtn").onclick = async () => {
        await store.logoutAdmin();
        location.hash = "";
      };
    }

    // ---------------- Suscripciones ----------------
    if (!isAdmin && store.mode === "firebase") {
      try {
        await store.signInPlayer();
      } catch (e) {
        console.error(e);
      }
    }
    store.on("game", async (g) => {
      if (!g && isAdmin) {
        await store.set("game", defaultGame());
        return;
      }
      const prev = S.game;
      S.game = g || defaultGame();
      if (!prev || prev.phase !== S.game.phase || prev.qIndex !== S.game.qIndex || prev.startedAt !== S.game.startedAt) {
        S.busy = false;
        S.revealScheduled = false;
      }
      watchAnswers();
      render();
    });
    store.on("players", (p) => {
      S.players = p || {};
      onPlayers();
    });
    store.on("scores", (s) => {
      S.scores = s || {};
      if (S.game?.phase === "lobby") renderStrip();
      if (!isAdmin && S.game?.phase === "reveal" && S.scene) setDistribution(S.scene, counts());
      renderPanel();
      renderDockState();
    });

    function watchAnswers() {
      const key = S.game?.qKey || null;
      if (key === S.ansKey) return;
      S.ansUnsub?.();
      S.ansKey = key;
      S.answers = {};
      if (!key) return;
      // La pantalla de proyección no lee respuestas individuales (reglas de
      // seguridad); usa el contador que publica la consola y los puntajes.
      if (!isAdmin) return;
      S.ansUnsub = store.on(`answers/${key}`, (a) => {
        const before = Object.keys(S.answers).length;
        S.answers = a || {};
        if (Object.keys(S.answers).length > before && S.game?.phase === "question") {
          sfx.play("click");
          clearTimeout(S._pub);
          S._pub = setTimeout(() => {
            if (S.game?.phase === "question" && S.game.answered !== answeredCount()) store.update("game", { answered: answeredCount() }).catch(() => {});
          }, 250);
        }
        updateAnswered();
        renderPanel();
        if (S.game?.phase === "reveal" && S.scene) setDistribution(S.scene, counts());
      });
    }

    const counts = () => {
      const c = { A: 0, B: 0, C: 0 };
      if (isAdmin) Object.values(S.answers || {}).forEach((a) => a?.c in c && c[a.c]++);
      else Object.values(S.scores || {}).forEach((s) => {
        const e = s?.q?.[S.game?.qKey];
        if (e?.c in c) c[e.c]++;
      });
      return c;
    };
    const activeCount = () => Object.values(S.players).filter((p) => p.online !== false).length;
    const answeredCount = () =>
      isAdmin ? Object.keys(S.answers || {}).filter((pid) => S.players[pid]).length : S.game?.answered || 0;
    const doneKeys = () => {
      const set = new Set();
      Object.values(S.scores || {}).forEach((s) => Object.keys(s?.q || {}).forEach((k) => set.add(k)));
      return set;
    };

    // ---------------- Render principal ----------------
    function render() {
      const g = S.game;
      const phase = g.phase;
      const q = g.qIndex != null ? QUESTIONS[g.qIndex] : null;
      const sceneKey = q ? "scene:" + g.qIndex + ":" + (g.introAt || "") : "";
      let key;
      if (["intro", "question", "reveal"].includes(phase) && q) key = sceneKey;
      else if (phase === "leaderboard") key = "board:" + g.qIndex;
      else if (phase === "final") key = "final";
      else key = "lobby";

      const stage = $("#stage");
      if (key !== S.viewKey) {
        S.viewKey = key;
        S.scene = null;
        S.knownChips = new Set();
        if (key.startsWith("scene:")) {
          S.scene = mountScene(stage, q);
        } else if (key === "lobby") {
          stage.innerHTML = lobbyHTML();
          drawQR();
          onPlayers();
        } else if (key.startsWith("board:")) {
          renderBoard(stage);
        } else if (key === "final") {
          renderFinal(stage);
        }
      }
      if (S.scene) {
        const prevPhase = S.scene.phase;
        setScenePhase(S.scene, phase);
        if (prevPhase !== phase) {
          if (phase === "intro") {
            sfx.play("intro");
            sfx.play("whoosh");
          } else if (phase === "question") sfx.play("go");
          else if (phase === "reveal") {
            sfx.play("reveal");
            setDistribution(S.scene, counts());
            setTimeout(() => confetti({ count: 80, y: 0.55 }), 1400);
          }
        }
      }
      renderStrip();
      renderDock();
      renderPanel();
    }

    // ---------------- Lobby ----------------
    function joinURL() {
      return location.href.split("#")[0];
    }
    function lobbyHTML() {
      const done = doneKeys().size;
      return `
        <div class="lobby">
          <section class="lobby-left">
            <img class="acad" src="assets/logo-academia.png" alt="Academia de Ventas TRAA">
            <h2>Árbol de decisión <span>· Módulo 2</span></h2>
            <div class="join-row">
              <div class="qr" id="qr" aria-label="Código QR para unirse"></div>
              <div class="join-steps">
                <ol>
                  <li>Escanea el código o abre:<br><span class="url">${esc(joinURL())}</span></li>
                  <li>Escribe tu <b>nombre</b> y <b>primer apellido</b>.</li>
                  <li>¡Responde rápido y bien!</li>
                </ol>
              </div>
            </div>
          </section>
          <section class="lobby-right">
            <div class="lobby-count"><b id="lobbyN">0</b><span>concursantes<br>conectados<small>${done ? `${done} de ${TOTAL} evaluaciones jugadas` : "Esperando para comenzar"}</small></span></div>
            <div class="pchips" id="pchips"></div>
            <div class="lobby-rules">
              <span class="chip">Correcta <b>${CONFIG.basePoints} pts</b></span>
              <span class="chip">Velocidad <b>hasta +${CONFIG.maxSpeedBonus}</b></span>
              <span class="chip">Incorrecta <b>0 pts</b></span>
            </div>
          </section>
        </div>`;
    }
    function drawQR() {
      const box = $("#qr");
      if (!box) return;
      try {
        const qr = window.qrcode(0, "M");
        qr.addData(joinURL());
        qr.make();
        box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch {
        box.style.display = "none";
      }
    }

    function onPlayers() {
      if (isAdmin) $("#pCount").textContent = activeCount();
      renderPanel();
      updateAnswered();
      const chips = $("#pchips");
      if (S.viewKey === "lobby" && chips) {
        $("#lobbyN").textContent = activeCount();
        const list = Object.entries(S.players).sort((a, b) => (a[1].joinedAt || 0) - (b[1].joinedAt || 0));
        const ids = new Set(list.map(([pid]) => pid));
        $$(".pchip", chips).forEach((c) => {
          if (!ids.has(c.dataset.pid)) {
            c.remove();
            S.knownChips.delete(c.dataset.pid);
          }
        });
        const initial = !S.knownChips.has("__init");
        let added = false;
        for (const [pid, p] of list) {
          let c = chips.querySelector(`[data-pid="${CSS.escape(pid)}"]`);
          if (!c) {
            c = document.createElement("span");
            c.className = "pchip";
            c.dataset.pid = pid;
            c.innerHTML = `<span class="avatar" style="--c:${avatarColor(pid)}">${esc(initials(p.name + " " + p.last))}</span>${esc(p.name)} ${esc(p.last)}`;
            chips.appendChild(c);
            if (!initial) added = true;
            S.knownChips.add(pid);
          }
          c.classList.toggle("off", p.online === false);
        }
        if (!list.length) chips.innerHTML = `<div class="empty-lobby">${ICONS.users} Aún no hay concursantes. ¡Invita a todos a escanear el código!</div>`;
        else chips.querySelector(".empty-lobby")?.remove();
        if (added) sfx.play("join");
        S.knownChips.add("__init");
      }
    }

    // ---------------- Franja inferior ----------------
    function renderStrip() {
      const g = S.game;
      const q = g.qIndex != null ? QUESTIONS[g.qIndex] : null;
      const strip = $("#strip");
      let html = "";
      switch (g.phase) {
        case "intro":
          html = `<div><div class="strip-label">Evaluación ${q.id} de ${TOTAL}</div><div class="strip-big">${esc(q.themeName)}</div></div>
            <div class="strip-module">${esc(q.module)}</div><div style="flex:1"></div>
            <div class="answered"><span class="strip-label">Las ramas aparecen en</span><b id="introSecs">${CONFIG.introSeconds}</b></div>`;
          break;
        case "question":
          html = `<div><div class="strip-label">Evaluación ${q.id} de ${TOTAL}</div><div class="strip-module">${esc(q.module)}</div></div>
            <div class="timer" id="timer"><span class="secs" id="tSecs">${Math.round(g.durationMs / 1000)}</span><div class="timer-bar"><i id="tBar"></i></div></div>
            <div class="answered"><b id="ansN">0</b><span>/ <span id="ansT">0</span> respondieron</span></div>`;
          break;
        case "reveal": {
          const c = counts();
          const tot = c.A + c.B + c.C;
          html = `<div class="explain-strip">${badge(q.correct)}<div><b>Decisión correcta (Rama ${q.correct}) · ${esc(q.fullTitle)}:</b> ${esc(q.explanation)}</div></div>
            <div class="answered"><b>${c[q.correct]}</b><span>/ ${Math.max(tot, activeCount())} acertaron</span></div>`;
          break;
        }
        case "leaderboard":
          html = `<div><div class="strip-label">Ranking parcial</div><div class="strip-big">Después de la evaluación ${q ? q.id : ""} de ${TOTAL}</div></div><div style="flex:1"></div>
            ${g.qIndex < TOTAL - 1 ? `<div><div class="strip-label">Siguiente</div><div class="strip-big">${esc(QUESTIONS[g.qIndex + 1].concept)}</div></div>` : `<div class="strip-big">¡Última evaluación completada!</div>`}`;
          break;
        case "final":
          html = `<div><div class="strip-label">Resultados finales</div><div class="strip-big">Academia de Ventas TRAA · Árbol de decisión — Módulo 2</div></div><div style="flex:1"></div><div class="strip-big">¡Gracias por participar!</div>`;
          break;
        default: {
          const done = doneKeys().size;
          html = `<div><div class="strip-label">Sala de espera</div><div class="strip-big">${done ? `${done} de ${TOTAL} evaluaciones jugadas` : "La dinámica está por comenzar"}</div></div><div style="flex:1"></div>
            <div class="strip-module">Cada evaluación: 1 concepto · 3 ramas · solo 1 es correcta · ${g.time || CONFIG.defaultQuestionTime} s para responder</div>`;
        }
      }
      strip.innerHTML = html;
      S.lastSec = null;
      updateAnswered();
      tick();
    }

    function updateAnswered() {
      const n = $("#ansN");
      if (n) {
        n.textContent = answeredCount();
        $("#ansT").textContent = Math.max(activeCount(), answeredCount());
      }
    }

    // ---------------- Ranking ----------------
    function renderBoard(stage) {
      const g = S.game;
      const list = ranking(S.players, S.scores, g.qKey);
      const max = Math.max(1, ...list.map((r) => r.total));
      const top = list.slice(0, 10);
      stage.innerHTML = `
        <div class="board">
          <div class="board-head"><h2>Ranking <span>· ${g.qIndex + 1} de ${TOTAL}</span></h2><span class="chip chip-orange">${ICONS.users} ${list.length} concursantes</span></div>
          <div class="board-rows" id="rows">
            ${top
              .map((r) => {
                const d = r.prevRank - r.rank;
                return `<div class="brow" data-rank="${r.rank}" data-prev="${r.prevRank}" style="top:${Math.min(r.prevRank, 10) * 10}%;opacity:${r.prevRank > 9 ? 0 : 1}">
                  <span class="pos">${r.rank + 1}</span>
                  <span class="avatar" style="--c:${avatarColor(r.pid)}">${esc(initials(r.display))}</span>
                  <span class="nm">${esc(r.display)}</span>
                  <span class="bar"><i style="width:${(r.prevTotal / max) * 100}%" data-w="${(r.total / max) * 100}"></i></span>
                  <span class="gain">${r.gain ? "+" + r.gain : ""}</span>
                  <span class="delta ${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "▲" + d : d < 0 ? "▼" + -d : "–"}</span>
                  <span class="tot" data-to="${r.total}" data-from="${r.prevTotal}">${r.prevTotal.toLocaleString("es")}</span>
                </div>`;
              })
              .join("")}
            ${!top.length ? `<div class="center-msg"><p>Aún no hay puntajes.</p></div>` : ""}
          </div>
        </div>`;
      sfx.play("rank");
      setTimeout(() => {
        $$(".brow", stage).forEach((row) => {
          row.style.top = +row.dataset.rank * 10 + "%";
          row.style.opacity = 1;
          const bar = row.querySelector(".bar i");
          bar.style.width = bar.dataset.w + "%";
          const t = row.querySelector(".tot");
          countUp(t, +t.dataset.to, 1400, +t.dataset.from);
        });
      }, 700);
    }

    // ---------------- Final ----------------
    function renderFinal(stage) {
      const list = ranking(S.players, S.scores);
      const [p1, p2, p3] = list;
      const pod = (r, cls, n) =>
        r
          ? `<div class="pod ${cls}"><div class="who"><span class="avatar" style="--c:${avatarColor(r.pid)}">${esc(initials(r.display))}</span><strong>${esc(r.display)}</strong><span class="pts">${r.total.toLocaleString("es")} pts</span></div><div class="block">${n}</div></div>`
          : `<div class="pod ${cls}"><div class="block">${n}</div></div>`;
      stage.innerHTML = `
        <div class="final">
          <div class="final-left">
            <div class="final-title"><div class="acad-badge"><img src="assets/logo-academia.png" alt="Academia de Ventas"></div><h2>¡Felicitaciones! <span>Podio final</span></h2></div>
            <div class="podium">${pod(p2, "p2", 2)}${pod(p1, "p1", 1)}${pod(p3, "p3", 3)}</div>
          </div>
          <div class="final-right">
            <h3>Clasificación general</h3>
            ${list
              .slice(0, 12)
              .map(
                (r, i) =>
                  `<div class="frow" style="--i:${i}"><span class="pos">${r.rank + 1}</span><span class="nm">${esc(r.display)}</span><span>${r.correct}/${TOTAL}</span><b>${r.total.toLocaleString("es")}</b></div>`
              )
              .join("")}
            ${list.length > 12 ? `<div class="frow" style="--i:12"><span class="nm">… y ${list.length - 12} más</span></div>` : ""}
            ${!list.length ? `<p>Sin participantes.</p>` : ""}
          </div>
        </div>`;
      setTimeout(() => {
        sfx.play("fanfare");
        confetti({ count: 200, y: 0.4 });
        confettiRain(4000);
      }, 1800);
    }

    // ---------------- Dock (controles del administrador) ----------------
    function renderDock() {
      if (!isAdmin) return;
      const g = S.game;
      const dock = $("#dock");
      const last = g.qIndex === TOTAL - 1;
      const nextIdx = nextUnplayed();
      let main = "";
      switch (g.phase) {
        case "intro":
          main = `<button class="btn btn-primary" data-a="skip">${ICONS.play} Mostrar ramas ya</button><button class="btn btn-ghost" data-a="lobby">${ICONS.home} Cancelar</button>`;
          break;
        case "question":
          main = `<button class="btn btn-primary" data-a="reveal">${ICONS.eye} Revelar respuesta</button><button class="btn btn-ghost" data-a="plus">+10 s</button>`;
          break;
        case "reveal":
          main = `<button class="btn btn-primary" data-a="board">${ICONS.podium} Ver ranking</button>
            <button class="btn btn-dark" data-a="${last ? "final" : "next"}">${last ? ICONS.trophy + " Resultados finales" : ICONS.next + " Siguiente evaluación"}</button>`;
          break;
        case "leaderboard":
          main = last
            ? `<button class="btn btn-primary" data-a="final">${ICONS.trophy} Resultados finales</button>`
            : `<button class="btn btn-primary" data-a="next">${ICONS.next} Evaluación ${g.qIndex + 2}: ${esc(QUESTIONS[g.qIndex + 1].concept)}</button>`;
          main += `<button class="btn btn-ghost" data-a="lobby">${ICONS.home} Sala de espera</button>`;
          break;
        case "final":
          main = `<button class="btn btn-primary" data-a="csv">${ICONS.download} Exportar resultados</button><button class="btn btn-ghost" data-a="lobby">${ICONS.home} Sala de espera</button>`;
          break;
        default:
          main = `<button class="btn btn-primary" data-a="launch" data-i="${nextIdx}">${ICONS.play} ${nextIdx === 0 && !doneKeys().size ? "Comenzar" : "Lanzar"} evaluación ${nextIdx + 1}</button>
            <label>Tiempo <select id="timeSel">${[15, 20, 30, 45, 60, 90].map((s) => `<option value="${s}" ${s === (g.time || CONFIG.defaultQuestionTime) ? "selected" : ""}>${s} s</option>`).join("")}</select></label>
            ${doneKeys().size >= TOTAL ? `<button class="btn btn-dark" data-a="final">${ICONS.trophy} Resultados finales</button>` : ""}`;
      }
      dock.innerHTML = `
        ${main}
        <span class="spacer"></span>
        <div class="qchips" id="qchips" aria-label="Ir a evaluación">${QUESTIONS.map((q, i) => `<button class="qchip" data-a="launch" data-i="${i}" title="Evaluación ${i + 1}: ${esc(q.concept)}">${i + 1}</button>`).join("")}</div>
        <button class="btn btn-ghost" data-a="csv" title="Exportar CSV">${ICONS.download}</button>
        <button class="btn btn-ghost" data-a="reset" title="Reiniciar">${ICONS.reset}</button>
        <a class="btn btn-ghost" href="#pantalla" target="_blank" rel="noopener" title="Abrir pantalla de proyección en otra ventana">${ICONS.monitor}</a>
        <span class="kbd">Espacio: avanzar · H: ocultar · F: pantalla completa</span>`;
      $("#timeSel")?.addEventListener("change", (e) => store.update("game", { time: +e.target.value }));
      renderDockState();
    }

    function renderDockState() {
      if (!isAdmin) return;
      const done = doneKeys();
      $$(".qchip").forEach((b) => {
        const i = +b.dataset.i;
        b.classList.toggle("done", done.has(qKey(i)));
        b.classList.toggle("cur", S.game?.qIndex === i && S.game?.phase !== "lobby");
      });
    }

    function nextUnplayed() {
      const done = doneKeys();
      for (let i = 0; i < TOTAL; i++) if (!done.has(qKey(i))) return i;
      return 0;
    }

    if (isAdmin) {
      $("#dock").addEventListener("click", async (e) => {
        const b = e.target.closest("[data-a]");
        if (!b) return;
        const a = b.dataset.a;
        if (a === "launch") {
          const i = +b.dataset.i;
          const g = S.game;
          if (["intro", "question"].includes(g.phase)) {
            const ok = await modal({
              title: "¿Cambiar de evaluación?",
              body: "La evaluación en curso se cancelará.",
              actions: [
                { label: "Cancelar", value: false },
                { label: "Cambiar", value: true, primary: true },
              ],
            });
            if (!ok) return;
          }
          if (doneKeys().has(qKey(i))) {
            const ok = await modal({
              title: `Repetir evaluación ${i + 1}`,
              body: "Esta evaluación ya se jugó. Si la repites, se reemplazarán los puntos obtenidos en ella.",
              actions: [
                { label: "Cancelar", value: false },
                { label: "Repetir", value: true, primary: true },
              ],
            });
            if (!ok) return;
          }
          launch(i);
        } else if (a === "skip") startQuestion();
        else if (a === "reveal") doReveal();
        else if (a === "plus") store.update("game", { durationMs: S.game.durationMs + 10000 });
        else if (a === "board") store.update("game", { phase: "leaderboard" });
        else if (a === "next") launch(S.game.qIndex + 1);
        else if (a === "final") store.update("game", { phase: "final" });
        else if (a === "lobby") store.update("game", { phase: "lobby" });
        else if (a === "csv") exportCSV();
        else if (a === "reset") resetDialog();
      });

      document.addEventListener("keydown", (e) => {
        if (e.target.closest("input, select, textarea") || $(".modal-wrap")) return;
        const k = e.key.toLowerCase();
        if (k === "h") toggleDock();
        else if (k === "f") toggleFS();
        else if (k === "p") togglePanel();
        else if (k === " " || k === "enter" || k === "arrowright") {
          e.preventDefault();
          const btn = $("#dock .btn-primary");
          btn?.click();
        }
      });
    }

    // ---------------- Acciones del juego ----------------
    async function launch(i) {
      if (i < 0 || i >= TOTAL) return;
      const key = qKey(i);
      const updates = {
        [`answers/${key}`]: null,
        "game/phase": "intro",
        "game/qIndex": i,
        "game/qKey": key,
        "game/introAt": TS,
        "game/startedAt": null,
        "game/revealAt": null,
        "game/durationMs": (S.game?.time || CONFIG.defaultQuestionTime) * 1000,
        "game/answered": 0,
      };
      for (const [pid, s] of Object.entries(S.scores || {})) {
        if (s?.q?.[key]) {
          const qmap = { ...s.q };
          delete qmap[key];
          updates[`scores/${pid}`] = { q: qmap, ...summarize(qmap) };
        }
      }
      try {
        await store.update("", updates);
      } catch (e) {
        permissionError(e);
      }
    }

    async function startQuestion() {
      if (S.busy || S.game.phase !== "intro") return;
      S.busy = true;
      try {
        await store.update("game", { phase: "question", startedAt: TS });
      } catch (e) {
        S.busy = false;
        permissionError(e);
      }
    }

    async function doReveal() {
      const g = S.game;
      if (S.busy || g.phase !== "question") return;
      S.busy = true;
      const q = QUESTIONS[g.qIndex];
      const key = g.qKey;
      // lectura fresca de respuestas para no perder las de último segundo
      let answers = S.answers;
      try {
        answers = (await store.get(`answers/${key}`)) || S.answers || {};
      } catch {}
      const updates = {};
      for (const pid of Object.keys(S.players)) {
        const entry = scoreAnswer(answers[pid], q, g);
        const qmap = { ...(S.scores?.[pid]?.q || {}), [key]: entry };
        updates[`scores/${pid}`] = { q: qmap, ...summarize(qmap, g.qIndex) };
      }
      updates["game/phase"] = "reveal";
      updates["game/revealAt"] = TS;
      try {
        await store.update("", updates);
      } catch (e) {
        S.busy = false;
        permissionError(e);
      }
    }

    async function resetDialog() {
      const v = await modal({
        title: "Reiniciar la dinámica",
        body: "<b>Reiniciar puntajes:</b> borra respuestas y puntos, conserva a los concursantes conectados.<br><br><b>Borrar todo:</b> también elimina a los concursantes (deberán ingresar de nuevo).",
        actions: [
          { label: "Cancelar", value: null },
          { label: "Borrar todo", value: "all", danger: true },
          { label: "Reiniciar puntajes", value: "scores", primary: true },
        ],
      });
      if (!v) return;
      const updates = { answers: null, scores: null, "game/phase": "lobby", "game/qIndex": null, "game/qKey": null, "game/startedAt": null, "game/introAt": null };
      if (v === "all") updates.players = null;
      try {
        await store.update("", updates);
        toast(v === "all" ? "Se borró toda la información." : "Puntajes reiniciados.");
      } catch (e) {
        permissionError(e);
      }
    }

    async function removePlayer(pid) {
      const p = S.players[pid];
      const ok = await modal({
        title: "Retirar concursante",
        body: `¿Retirar a <b>${esc(p?.name)} ${esc(p?.last)}</b>? Se borrarán sus respuestas y puntos.`,
        actions: [
          { label: "Cancelar", value: false },
          { label: "Retirar", value: true, primary: true },
        ],
      });
      if (!ok) return;
      const updates = { [`players/${pid}`]: null, [`scores/${pid}`]: null };
      for (let i = 0; i < TOTAL; i++) updates[`answers/${qKey(i)}/${pid}`] = null;
      try {
        await store.update("", updates);
      } catch (e) {
        permissionError(e);
      }
    }

    function permissionError(e) {
      console.error(e);
      toast("No se pudo guardar. Revisa la conexión o los permisos de administrador.");
    }

    function exportCSV() {
      const list = ranking(S.players, S.scores);
      const head = ["Posición", "Nombre", "Apellido", "Puntaje total", "Correctas", "Tiempo promedio de acierto (s)", ...QUESTIONS.map((q) => `E${q.id} ${q.concept}`)];
      const rows = list.map((r) => [
        r.rank + 1,
        r.name,
        r.last,
        r.total,
        r.correct,
        r.correct ? (r.msSum / r.correct / 1000).toFixed(2).replace(".", ",") : "",
        ...QUESTIONS.map((q, i) => {
          const e = r.qmap[qKey(i)];
          return e ? `${e.p}${e.c ? ` (${e.c})` : " (sin resp.)"}` : "";
        }),
      ]);
      const csv = "﻿" + [head, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      a.download = `TRAA_ArbolDecision_Resultados_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 500);
    }

    // ---------------- Panel de participantes ----------------
    function renderPanel() {
      if (!isAdmin) return;
      const ul = $("#plist");
      if (!ul) return;
      const list = ranking(S.players, S.scores);
      const inQ = ["question", "reveal"].includes(S.game?.phase);
      ul.innerHTML = list.length
        ? list
            .map(
              (r) => `<li>
            <span class="st ${r.online ? "on" : ""}" title="${r.online ? "Conectado" : "Desconectado"}"></span>
            <span class="avatar" style="--c:${avatarColor(r.pid)}">${esc(initials(r.display))}</span>
            <span class="nm">${esc(r.display)}<small>${r.total.toLocaleString("es")} pts · ${r.correct} correctas</small></span>
            ${inQ && S.answers[r.pid] ? `<span class="ans">${S.game.phase === "reveal" ? S.answers[r.pid].c : "✓"}</span>` : ""}
            <button data-rm="${esc(r.pid)}" title="Retirar">${ICONS.trash}</button></li>`
            )
            .join("")
        : `<li class="empty">Sin concursantes todavía.</li>`;
      $$("[data-rm]", ul).forEach((b) => (b.onclick = () => removePlayer(b.dataset.rm)));
    }

    function togglePanel() {
      S.panelOpen = !S.panelOpen;
      $("#ppanel").classList.toggle("open", S.panelOpen);
    }
    function toggleDock() {
      $("#host").classList.toggle("dock-hidden");
      setTimeout(() => S.scene && fitScene(S.scene), 50);
      if ($("#host").classList.contains("dock-hidden")) toast("Controles ocultos · presiona H para mostrarlos");
    }

    // ---------------- Reloj ----------------
    function tick() {
      const g = S.game;
      if (!g) return;
      const now = store.now();
      if (g.phase === "intro") {
        const left = (g.introAt || now) + CONFIG.introSeconds * 1000 - now;
        const el = $("#introSecs");
        if (el) el.textContent = Math.max(0, Math.ceil(left / 1000));
        if (isAdmin && g.introAt && left <= 0) startQuestion();
      } else if (g.phase === "question") {
        const left = g.startedAt ? g.startedAt + g.durationMs - now : g.durationMs;
        const k = Math.max(0, Math.min(1, left / g.durationMs));
        const bar = $("#tBar");
        if (bar) bar.style.transform = `scaleX(${k.toFixed(3)})`;
        const secs = Math.max(0, Math.ceil(left / 1000));
        const el = $("#tSecs");
        if (el && S.lastSec !== secs) {
          el.textContent = secs;
          if (secs <= 5 && secs > 0 && S.lastSec != null) sfx.play("tick");
          S.lastSec = secs;
        }
        $("#timer")?.classList.toggle("hurry", secs <= 5);
        if (isAdmin && g.startedAt) {
          const active = activeCount();
          const all = active > 0 && answeredCount() >= active;
          if (left <= -400) doReveal();
          else if (all && !S.revealScheduled) {
            S.revealScheduled = true;
            setTimeout(() => {
              if (S.game.phase === "question" && answeredCount() >= activeCount()) doReveal();
              else S.revealScheduled = false;
            }, 900);
          }
        }
      }
    }
    setInterval(tick, 200);
    window.addEventListener("resize", () => {
      clearTimeout(S._rz);
      S._rz = setTimeout(() => S.scene && fitScene(S.scene), 150);
    });
  }

  function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
}
