// Punto de entrada: decide qué vista mostrar según la URL.
//   index.html            → concursantes
//   index.html#admin      → consola del administrador
//   index.html#pantalla   → pantalla de proyección (solo visualización)
//   index.html#hash       → generar huella de contraseña (modo demo)

import { createStore, sha256 } from "./store.js";
import { runPlayer } from "./player.js";
import { runHost } from "./host.js";
import { esc } from "./ui.js";

const app = document.getElementById("app");
const route = location.hash.replace(/^#\/?/, "").toLowerCase();
window.addEventListener("hashchange", () => location.reload());

function bootScreen(msg = "Cargando dinámica") {
  app.innerHTML = `<div class="boot"><img src="assets/logo-traa.png" alt="TRAA Repuestos"><p>${esc(msg)}</p><div class="dots"><i></i><i></i><i></i></div></div>`;
}

function errorScreen(title, detail) {
  app.innerHTML = `<div class="tool"><div class="login-card"><h2>${esc(title)}</h2><p class="hint">${detail}</p><button class="btn btn-primary" onclick="location.reload()">Reintentar</button></div></div>`;
}

function hashTool() {
  app.innerHTML = `
    <div class="tool"><div class="login-card">
      <h2>Huella de contraseña</h2>
      <p class="hint">Para el modo demostración. Escribe la nueva contraseña del administrador y copia la huella en <b>js/config.js</b> → <code style="display:inline;padding:2px 6px">demoAdminPasswordHash</code>.</p>
      <div class="field"><label for="np">Nueva contraseña</label><input id="np" type="text" autocomplete="off"></div>
      <code id="out">—</code>
      <p style="margin-top:16px"><a class="link" href="#admin">Volver a la consola</a></p>
    </div></div>`;
  const inp = document.getElementById("np");
  inp.addEventListener("input", async () => {
    document.getElementById("out").textContent = inp.value ? await sha256(inp.value) : "—";
  });
  inp.focus();
}

async function boot() {
  bootScreen();
  if (route === "hash") return hashTool();
  const store = createStore();
  try {
    await store.init();
  } catch (e) {
    console.error(e);
    return errorScreen(
      "No se pudo conectar",
      "La app no logró conectarse con el servidor en vivo (Firebase). Revisa tu conexión a internet y la configuración en <b>js/config.js</b>."
    );
  }
  if (route === "admin") return runHost(app, store, { mode: "admin" });
  if (route === "pantalla") return runHost(app, store, { mode: "screen" });
  return runPlayer(app, store);
}

boot();
