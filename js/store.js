// Capa de datos en tiempo real.
//  - FirebaseStore: varios dispositivos conectados (modo en vivo).
//  - LocalStore:    sin servidor, datos en localStorage (modo demostración,
//                   sincroniza pestañas del mismo navegador).
// Ambas exponen la misma API para que el resto de la app no dependa del modo.

import { CONFIG } from "./config.js";

const ROOT = "traa";
const FB_VERSION = "10.12.2";
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;

export const TS = { ".sv": "timestamp" }; // marca de tiempo del servidor

export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const split = (p) => (p ? p.split("/").filter(Boolean) : []);

function getAt(obj, path) {
  let cur = obj;
  for (const k of split(path)) {
    if (cur == null || typeof cur !== "object") return null;
    cur = cur[k];
  }
  return cur === undefined ? null : cur;
}

function resolveTS(v, now) {
  if (v && typeof v === "object") {
    if (v[".sv"] === "timestamp") return now;
    const out = Array.isArray(v) ? [] : {};
    for (const k of Object.keys(v)) out[k] = resolveTS(v[k], now);
    return out;
  }
  return v;
}

function prune(obj) {
  if (!obj || typeof obj !== "object") return obj;
  for (const k of Object.keys(obj)) {
    const v = prune(obj[k]);
    if (v === null || v === undefined || (typeof v === "object" && !Object.keys(v).length)) delete obj[k];
    else obj[k] = v;
  }
  return obj;
}

function setAt(obj, path, value) {
  const keys = split(path);
  if (!keys.length) return value ?? {};
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== "object") cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (value === null || value === undefined) delete cur[last];
  else cur[last] = value;
  return obj;
}

// ---------------------------------------------------------------------
class LocalStore {
  constructor() {
    this.mode = "local";
    this.key = "traa_demo_db_v1";
    this.listeners = new Set();
    window.addEventListener("storage", (e) => {
      if (e.key === this.key) this._emit();
    });
  }
  async init() {}
  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch {
      return {};
    }
  }
  _save(db) {
    localStorage.setItem(this.key, JSON.stringify(prune(db) || {}));
    this._emit();
  }
  _emit() {
    const db = this._read();
    for (const l of this.listeners) {
      const v = getAt(db, l.path);
      const s = JSON.stringify(v);
      if (s !== l.last) {
        l.last = s;
        l.cb(v);
      }
    }
  }
  on(path, cb) {
    const l = { path, cb, last: undefined };
    this.listeners.add(l);
    queueMicrotask(() => {
      if (!this.listeners.has(l) || l.last !== undefined) return;
      const v = getAt(this._read(), path);
      l.last = JSON.stringify(v);
      cb(v);
    });
    return () => this.listeners.delete(l);
  }
  async get(path) {
    return getAt(this._read(), path);
  }
  async set(path, value) {
    this._save(setAt(this._read(), path, resolveTS(value, Date.now())));
  }
  async update(path, obj) {
    const db = this._read();
    const now = Date.now();
    for (const [k, v] of Object.entries(obj)) setAt(db, [path, k].filter(Boolean).join("/"), resolveTS(v, now));
    this._save(db);
  }
  async remove(path) {
    this._save(setAt(this._read(), path, null));
  }
  // Escribe solo si no existe todavía (respuestas únicas)
  async createOnce(path, value) {
    const db = this._read();
    if (getAt(db, path) != null) return false;
    this._save(setAt(db, path, resolveTS(value, Date.now())));
    return true;
  }
  now() {
    return Date.now();
  }
  async signInPlayer() {
    let uid = sessionStorage.getItem("traa_uid");
    if (!uid) {
      uid = "u" + Math.random().toString(36).slice(2, 12);
      sessionStorage.setItem("traa_uid", uid);
    }
    return uid;
  }
  async adminLogin(password) {
    const ok = (await sha256(password)) === CONFIG.demoAdminPasswordHash;
    if (ok) sessionStorage.setItem("traa_admin", "1");
    return ok ? { ok } : { ok, error: "Contraseña incorrecta." };
  }
  isAdmin() {
    return sessionStorage.getItem("traa_admin") === "1";
  }
  async logoutAdmin() {
    sessionStorage.removeItem("traa_admin");
  }
  startPresence(pid) {
    const mark = (v) => {
      const db = this._read();
      if (getAt(db, `players/${pid}`)) this._save(setAt(db, `players/${pid}/online`, v));
    };
    mark(true);
    const off = () => mark(false);
    window.addEventListener("pagehide", off);
    return () => {
      window.removeEventListener("pagehide", off);
    };
  }
}

// ---------------------------------------------------------------------
class FirebaseStore {
  constructor(cfg) {
    this.mode = "firebase";
    this.cfg = cfg;
    this.offset = 0;
    this.user = null;
  }
  async init() {
    const [appM, authM, dbM] = await Promise.all([
      import(`${FB_BASE}/firebase-app.js`),
      import(`${FB_BASE}/firebase-auth.js`),
      import(`${FB_BASE}/firebase-database.js`),
    ]);
    this.A = authM;
    this.D = dbM;
    this.app = appM.initializeApp(this.cfg);
    this.auth = authM.getAuth(this.app);
    this.db = dbM.getDatabase(this.app);
    if (CONFIG.emulator) {
      const { host, authPort, dbPort } = CONFIG.emulator;
      authM.connectAuthEmulator(this.auth, `http://${host}:${authPort}`, { disableWarnings: true });
      dbM.connectDatabaseEmulator(this.db, host, dbPort);
    }
    dbM.onValue(dbM.ref(this.db, ".info/serverTimeOffset"), (s) => (this.offset = s.val() || 0));
    await new Promise((res) => {
      const un = authM.onAuthStateChanged(this.auth, (u) => {
        this.user = u;
        un();
        res();
      });
    });
    authM.onAuthStateChanged(this.auth, (u) => (this.user = u));
  }
  _ref(path) {
    return this.D.ref(this.db, [ROOT, path].filter(Boolean).join("/"));
  }
  on(path, cb) {
    return this.D.onValue(
      this._ref(path),
      (s) => cb(s.val()),
      (err) => console.warn("Lectura denegada:", path, err?.message)
    );
  }
  async get(path) {
    return (await this.D.get(this._ref(path))).val();
  }
  set(path, value) {
    return this.D.set(this._ref(path), value);
  }
  update(path, obj) {
    return this.D.update(this._ref(path), obj);
  }
  remove(path) {
    return this.D.remove(this._ref(path));
  }
  async createOnce(path, value) {
    try {
      await this.D.set(this._ref(path), value);
      return true;
    } catch (e) {
      console.warn(e);
      return false;
    }
  }
  now() {
    return Date.now() + this.offset;
  }
  async signInPlayer() {
    if (!this.auth.currentUser) await this.A.signInAnonymously(this.auth);
    this.user = this.auth.currentUser;
    return this.user.uid;
  }
  async adminLogin(password) {
    if (!CONFIG.adminEmail) return { ok: false, error: "Falta configurar adminEmail en js/config.js." };
    try {
      const cred = await this.A.signInWithEmailAndPassword(this.auth, CONFIG.adminEmail, password);
      this.user = cred.user;
      return { ok: true };
    } catch (e) {
      const code = e?.code || "";
      const msg =
        code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")
          ? "Contraseña incorrecta."
          : code.includes("too-many-requests")
          ? "Demasiados intentos. Espera un momento."
          : code.includes("unauthorized-domain")
          ? "Este dominio no está autorizado en Firebase Authentication."
          : "No se pudo iniciar sesión (" + code + ").";
      return { ok: false, error: msg };
    }
  }
  isAdmin() {
    const u = this.auth?.currentUser;
    return !!(u && u.email && CONFIG.adminEmail && u.email.toLowerCase() === CONFIG.adminEmail.toLowerCase());
  }
  async logoutAdmin() {
    await this.A.signOut(this.auth);
  }
  startPresence(pid) {
    const D = this.D;
    const onlineRef = this._ref(`players/${pid}/online`);
    const un = D.onValue(D.ref(this.db, ".info/connected"), async (s) => {
      if (s.val() !== true) return;
      try {
        await D.onDisconnect(onlineRef).set(false);
        await D.set(onlineRef, true);
      } catch (e) {
        /* jugador retirado o sesión tomada desde otro dispositivo */
      }
    });
    return () => {
      un();
      D.onDisconnect(onlineRef).cancel().catch(() => {});
    };
  }
}

export function createStore() {
  return CONFIG.firebase ? new FirebaseStore(CONFIG.firebase) : new LocalStore();
}
