// =====================================================================
//  ESCENARIOS ANIMADOS — uno distinto por cada evaluación.
//  Cada escena es un lienzo 16:9 (coordenadas 1600×900) con:
//   - decorado SVG animado propio del concepto,
//   - nodo central (concepto) y tres ramas A/B/C,
//   - una animación de revelado que "cuenta" la respuesta correcta.
// =====================================================================

import { esc, badge, splitOption, ICONS } from "./ui.js";
import { LETTERS } from "./questions.js";

const P = (x, y, w, h) =>
  `left:${(x / 16).toFixed(3)}%;top:${(y / 9).toFixed(3)}%;width:${(w / 16).toFixed(3)}%;height:${(h / 9).toFixed(3)}%`;
const ROW3 = [
  [60, 520, 470, 350],
  [565, 520, 470, 350],
  [1070, 520, 470, 350],
];
const SVG = (inner, cls = "") => `<svg class="decor ${cls}" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg>`;

function rootNode(q, box, cls = "") {
  return `<div class="root ${cls}" style="${P(...box)}">
      <span class="root-k">Árbol de decisión #${q.id} · <span class="nw">${esc(q.themeName)}</span></span>
      <h2 class="root-t">${esc(q.concept)}</h2>
      ${q.sub ? `<span class="root-s">${esc(q.sub)}</span>` : ""}
    </div>`;
}

function optCard(q, L, box, i, { extra = "", termHTML = null } = {}) {
  const [term, desc] = splitOption(q.options[L]);
  const termBlock = termHTML ?? (term ? `<b class="opt-term">${esc(term)}</b>` : "");
  return `<div class="opt opt--${L}" data-l="${L}" style="${P(...box)};--i:${i}">
      ${extra}
      ${badge(L)}
      <div class="opt-body">${termBlock}<span class="opt-text">${esc(desc)}</span></div>
      <div class="opt-dist"><i></i><span>0</span></div>
      <span class="opt-check">${ICONS.check}</span>
    </div>`;
}

const cards = (q, boxes, opts = {}) => LETTERS.map((L, i) => optCard(q, L, boxes[i], i, typeof opts === "function" ? opts(L, i) : opts)).join("");

// ------------------------- piezas SVG reutilizables -------------------------
const TRUCK = `
  <g class="truck">
    <rect x="-84" y="-60" width="106" height="54" rx="6" fill="#dcdcdc" stroke="#070000" stroke-width="3"/>
    <text x="-31" y="-25" font-size="21" font-weight="900" font-style="italic" fill="#e75a24" text-anchor="middle" font-family="Montserrat, sans-serif">TRAA</text>
    <path d="M27 -48 h27 l19 19 v23 h-46z" fill="#e75a24" stroke="#070000" stroke-width="3" stroke-linejoin="round"/>
    <path d="M52 -43 l14 14 h-14z" fill="#ffffff"/>
    <rect x="-88" y="-7" width="164" height="9" rx="3" fill="#525252"/>
    <g class="wheels" fill="#070000" stroke="#8f8681" stroke-width="4">
      <circle cx="-64" cy="7" r="11"/><circle cx="-36" cy="7" r="11"/><circle cx="52" cy="7" r="11"/>
    </g>
  </g>`;

function wavePath(x0, x1, y, amp, period) {
  let d = `M ${x0} ${y}`;
  for (let x = x0; x < x1; x += period) d += ` q ${period / 4} ${-amp} ${period / 2} 0 t ${period / 2} 0`;
  return d;
}

function gearPath(r, teeth, depth = 18) {
  const ro = r + depth / 2;
  const ri = r - depth / 2;
  const step = (Math.PI * 2) / teeth;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [ri, a],
      [ro, a + step * 0.18],
      [ro, a + step * 0.5],
      [ri, a + step * 0.68],
    ];
    pts.forEach(([rr, aa], k) => {
      const x = (rr * Math.cos(aa)).toFixed(1);
      const y = (rr * Math.sin(aa)).toFixed(1);
      d += (i === 0 && k === 0 ? "M" : "L") + x + " " + y + " ";
    });
  }
  return d + "Z";
}

function arc(cx, cy, r, a0, a1) {
  const p = (a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function bullwhipFrames() {
  const frames = [];
  for (let f = 0; f <= 4; f++) {
    const ph = (f / 4) * Math.PI * 2;
    let d = "";
    for (let x = 120; x <= 1500; x += 12) {
      const k = (x - 120) / 1380;
      const amp = 6 + Math.pow(k, 1.6) * 118;
      const y = 340 + amp * Math.sin(k * Math.PI * 2 * 5.5 - ph);
      d += (x === 120 ? "M" : "L") + x + " " + y.toFixed(1) + " ";
    }
    frames.push(d.trim());
  }
  return frames;
}

// =============================== ESCENAS ===============================
const THEMES = {};

// 1) CPK — Ruta de Flota: el camión debe tomar la salida correcta.
THEMES.ruta = {
  html(q) {
    const ends = { A: 200, B: 450, C: 700 };
    const road = (L) => `M 150 770 C 470 770, 560 ${ends[L]}, 925 ${ends[L]}`;
    const svg = SVG(`
      <g class="stars">${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 137) % 1600}" cy="${(i * 71) % 300 + 20}" r="${(i % 3) + 1}" style="--d:${(i % 7) * 0.4}s"/>`).join("")}</g>
      <rect x="112" y="380" width="16" height="390" fill="#525252"/><rect x="392" y="380" width="16" height="390" fill="#525252"/>
      <path d="M -40 770 L 160 770" class="road-edge"/><path d="M -40 770 L 160 770" class="road-base"/>
      ${LETTERS.map((L) => `<path id="road-${L}" d="${road(L)}" class="road-edge"/>`).join("")}
      ${LETTERS.map((L) => `<path d="${road(L)}" class="road-base"/>`).join("")}
      <path d="M -40 770 L 160 770" class="road-line"/>
      ${LETTERS.map((L) => `<path d="${road(L)}" class="road-line road-line--${L}"/>`).join("")}
      <g class="truck-idle"><g transform="translate(150 770)">${TRUCK}</g></g>
      <g class="truck-move">${TRUCK}
        ${LETTERS.map((L) => `<animateMotion id="mv-${L}" dur="2.6s" begin="indefinite" fill="freeze" rotate="auto" calcMode="spline" keyPoints="0;0.9" keyTimes="0;1" keySplines=".45 0 .25 1"><mpath href="#road-${L}"/></animateMotion>`).join("")}
      </g>`);
    return `${svg}${rootNode(q, [40, 170, 440, 230], "root--sign")}${cards(q, [
      [925, 105, 640, 190],
      [925, 355, 640, 190],
      [925, 605, 640, 190],
    ])}`;
  },
  reveal(el, q) {
    el.querySelector(`#mv-${q.correct}`)?.beginElement?.();
  },
};

// 2) TCO — El Iceberg del Costo: el precio es solo la punta.
THEMES.iceberg = {
  html(q) {
    const svg = SVG(`
      <g class="cloud cloud-1"><ellipse cx="0" cy="0" rx="90" ry="26"/><ellipse cx="-40" cy="-18" rx="50" ry="28"/><ellipse cx="35" cy="-22" rx="45" ry="30"/></g>
      <g class="cloud cloud-2"><ellipse cx="0" cy="0" rx="70" ry="20"/><ellipse cx="-25" cy="-14" rx="40" ry="22"/><ellipse cx="28" cy="-12" rx="36" ry="20"/></g>
      <g class="sea"><path d="${wavePath(-300, 1900, 330, 12, 120)} L 1900 900 L -300 900 Z" fill="url(#sea-g)"/></g>
      <defs><linearGradient id="sea-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#525252"/><stop offset="1" stop-color="#070000"/></linearGradient></defs>
      <path class="ice-under" d="M 175 330 L 95 470 L 70 610 L 150 760 L 330 870 L 545 820 L 640 640 L 610 470 L 560 330 Z"/>
      <g class="ice-labels">
        <text x="345" y="455">Vida útil</text><text x="330" y="560">Durabilidad</text>
        <text x="360" y="665">Tiempo de paro</text><text x="345" y="770">Mantenimiento</text>
      </g>
      <path class="ice-tip" d="M 200 332 L 285 205 L 330 185 L 380 110 L 440 180 L 480 215 L 540 332 Z"/>
      <path d="M 380 110 L 352 238 L 285 205 L 330 185 Z" fill="#dcdcdc"/>
      <path d="M 380 110 L 440 180 L 410 260 L 352 238 Z" fill="#ffffff" opacity=".7"/>
      <text class="tip-label" x="370" y="305">Precio inicial</text>
      <g class="bubbles">${Array.from({ length: 14 }, (_, i) => `<circle cx="${640 + ((i * 97) % 940)}" cy="${880}" r="${4 + (i % 4) * 2}" style="--d:${(i * 0.53) % 5}s;--s:${4 + (i % 5)}s"/>`).join("")}</g>`);
    const depths = ["−20 m", "−60 m", "−120 m"];
    return `${svg}${rootNode(q, [690, 50, 860, 210], "root--light")}${cards(
      q,
      [
        [690, 362, 870, 158],
        [690, 537, 870, 158],
        [690, 712, 870, 158],
      ],
      (L, i) => ({ extra: `<span class="depth">${depths[i]}</span>` })
    )}`;
  },
};

// 3) Paradoja de la Recuperación — la curva de lealtad.
THEMES.recuperacion = {
  html(q) {
    const svg = SVG(`
      <g class="grid">${[180, 260, 340, 420].map((y) => `<path d="M 140 ${y} H 1500"/>`).join("")}</g>
      <path d="M 140 140 V 480 H 1500" class="axis"/>
      <text class="axis-t" x="110" y="310" transform="rotate(-90 110 310)">Lealtad del cliente</text>
      <text class="axis-t" x="1500" y="508" text-anchor="end">Tiempo</text>
      <path d="M 140 330 H 1500" class="baseline"/>
      <text class="base-t" x="1495" y="318" text-anchor="end">Sin incidentes</text>
      <path id="rec-p1" pathLength="1" class="curve curve-1" d="M 140 330 L 480 330 C 560 330, 580 455, 650 455"/>
      <path id="rec-p2" pathLength="1" class="curve curve-2" d="M 650 455 C 740 455, 780 300, 900 240 S 1200 150, 1480 140"/>
      <circle cx="650" cy="455" r="13" class="dip"/>
      <text class="dip-t" x="690" y="462">Falla / queja</text>
      <text class="qmark" x="800" y="420">?</text>
      <g class="peak"><circle cx="1480" cy="140" r="22"/><path d="M1480 118 l6 15 16 1 -12 10 4 16 -14-9 -14 9 4-16 -12-10 16-1z"/></g>
      <text class="peak-t" x="1450" y="200" text-anchor="end">Lealtad superior</text>
      <circle r="15" class="runner"><animateMotion id="rec-run" dur="2.2s" begin="indefinite" fill="freeze" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines=".4 0 .2 1"><mpath href="#rec-p2"/></animateMotion></circle>`);
    return `${svg}${rootNode(q, [200, 12, 1200, 112], "root--center")}${cards(q, ROW3)}`;
  },
  reveal(el) {
    el.querySelector("#rec-run")?.beginElement?.();
  },
};

// 4) Efecto Látigo — del chasquido a la onda en la cadena de suministro.
THEMES.latigo = {
  html(q) {
    const fr = bullwhipFrames();
    const nodes = [
      [220, "Cliente final", "±5%"],
      [620, "Mostrador", "±15%"],
      [1020, "Bodega", "±40%"],
      [1420, "Proveedor", "±90%"],
    ];
    const icon = [
      `<circle cx="0" cy="-14" r="11"/><path d="M-18 20 a18 18 0 0 1 36 0z"/>`,
      `<path d="M-24 -18 h48 l-5 12 h-38z M-20 -4 h40 v24 h-40z"/>`,
      `<path d="M-22 0 h20 v20 h-20z M2 0 h20 v20 h-20z M-10 -22 h20 v20 h-20z"/>`,
      `<path d="M-24 20 v-24 l14 -10 v10 l14 -10 v10 l14 -10 v34z M14 -26 h8 v14 h-8z"/>`,
    ];
    const whip = [
      "M 1440 360 C 1250 260, 1050 260, 900 330 C 760 395, 600 380, 480 300 C 420 260, 360 250, 300 270",
      "M 1440 360 C 1260 420, 1060 440, 900 380 C 760 330, 640 230, 500 240 C 420 245, 360 290, 310 320",
      "M 1440 360 C 1250 300, 1080 330, 920 280 C 780 236, 640 300, 500 320 C 430 330, 370 300, 300 240",
    ];
    const svg = SVG(`
      <g class="whip">
        <path class="lash" d="${whip[0]}"><animate attributeName="d" dur="1.6s" repeatCount="indefinite" values="${whip[0]};${whip[1]};${whip[2]};${whip[0]}" calcMode="spline" keySplines=".5 0 .5 1;.5 0 .5 1;.5 0 .5 1"/></path>
        <g transform="rotate(25 1440 360)"><rect x="1430" y="346" width="150" height="28" rx="13" fill="#e75a24"/><rect x="1430" y="346" width="34" height="28" rx="6" fill="#070000" opacity=".35"/></g>
        <path class="crack" d="M300 270 l18 -40 8 34 38 -18 -26 30 40 10 -42 6 22 34 -36 -22 -6 40 -10 -38 -34 22 22 -34 -40 -6 40 -12 -28 -28z"/>
      </g>
      <g class="chain">
        <path class="bw" d="${fr[0]}"><animate attributeName="d" dur="2.2s" repeatCount="indefinite" values="${fr.join(";")}"/></path>
        ${nodes
          .map(
            ([x, label, pct], i) => `<g transform="translate(${x} 340)"><g class="node" style="--i:${i}">
              <circle r="52"/><g class="node-ic">${icon[i]}</g>
              <text class="node-t" y="88">${label}</text><text class="node-p" y="-68">${pct}</text></g></g>`
          )
          .join("")}
        <text class="chain-t" x="820" y="492" text-anchor="middle">Pequeños cambios en la demanda → grandes distorsiones de inventario</text>
      </g>`);
    return `${svg}${rootNode(q, [40, 22, 640, 175])}${cards(q, ROW3)}`;
  },
};

// 5) Empatía Táctica — la mesa de negociación.
THEMES.empatia = {
  html(q) {
    const svg = SVG(`
      <g class="table"><rect x="50" y="768" width="540" height="22" rx="8" fill="#8f8681"/><rect x="90" y="790" width="14" height="80" fill="#525252"/><rect x="536" y="790" width="14" height="80" fill="#525252"/></g>
      <g class="person p-asesor"><path d="M 90 770 C 90 655, 250 655, 250 770 Z" fill="#e75a24"/><circle cx="170" cy="605" r="50" fill="#dcdcdc"/><circle cx="196" cy="598" r="5" fill="#070000"/><path d="M186 622 q10 6 20 0" stroke="#070000" stroke-width="4" fill="none" stroke-linecap="round"/><text x="170" y="735" text-anchor="middle" class="p-t">ASESOR</text></g>
      <g class="person p-cliente"><path d="M 390 770 C 390 655, 550 655, 550 770 Z" fill="#525252"/><circle cx="470" cy="605" r="50" fill="#dcdcdc"/><path d="M420 590 q50 -55 100 0 z" fill="#070000"/><rect x="406" y="584" width="40" height="10" rx="4" fill="#070000"/><circle cx="446" cy="606" r="5" fill="#070000"/><path class="mouth" d="M432 630 q-10 -6 -20 0" stroke="#070000" stroke-width="4" fill="none" stroke-linecap="round"/><text x="470" y="735" text-anchor="middle" class="p-t">CLIENTE</text></g>
      <path class="pulse" d="M 228 540 H 268 L 284 506 L 300 572 L 316 518 L 330 540 H 412"/>
      <g transform="translate(320 440)"><g class="heart"><path d="M0 18 C -40 -10, -30 -46, 0 -28 C 30 -46, 40 -10, 0 18 Z"/></g></g>
      <text class="trust" x="320" y="352" text-anchor="middle">CONFIANZA</text>
      <g class="floaters">${[0, 1, 2, 3, 4].map((i) => `<g transform="translate(${230 + i * 45} 520) scale(.5)"><path style="--i:${i}" d="M0 18 C -40 -10, -30 -46, 0 -28 C 30 -46, 40 -10, 0 18 Z"/></g>`).join("")}</g>`);
    return `${svg}${rootNode(q, [40, 30, 560, 260])}${cards(q, [
      [660, 40, 900, 250],
      [660, 325, 900, 250],
      [660, 610, 900, 250],
    ])}`;
  },
};

// 6) Método PAS — la tragamonedas de los acrónimos.
THEMES.pas = {
  html(q) {
    const reelWords = [0, 1, 2].map((r) => ["PAS"[r], q.reels.A[r], q.reels.B[r], q.reels.C[r]]);
    const strip = (r) => {
      const items = [...reelWords[r], ...reelWords[r], ...reelWords[r]];
      return items.map((w, i) => `<div class="${i % 4 === 0 ? "big" : ""}">${esc(w)}</div>`).join("");
    };
    const bulbs = Array.from({ length: 16 }, (_, i) => `<i style="--i:${i}"></i>`).join("");
    const machine = `
      <div class="slot" style="${P(420, 34, 760, 452)}">
        <div class="slot-top"><div class="bulbs">${bulbs}</div><span class="root-k">Árbol de decisión #${q.id} · ${esc(q.themeName)}</span><h2 class="root-t">${esc(q.concept)}</h2><div class="bulbs">${bulbs}</div></div>
        <div class="slot-window">${[0, 1, 2].map((r) => `<div class="reel"><div class="reel-strip" data-r="${r}">${strip(r)}</div></div>`).join("")}</div>
        <div class="slot-base"><span class="jackpot">¡JACKPOT!</span><span class="slot-msg">Gira · Decide · Gana</span></div>
        <div class="lever"><b></b><i></i></div>
      </div>`;
    const svg = SVG(`<g class="rays">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 800 260)" d="M 800 260 L 780 -400 L 820 -400 Z"/>`).join("")}</g>`);
    return `${svg}${machine}${cards(q, ROW3, (L) => ({
      termHTML: `<span class="chips">${q.reels[L].map((w) => `<em>${esc(w)}</em>`).join("")}</span>`,
    }))}`;
  },
  setReels(el, idx) {
    el.querySelectorAll(".reel-strip").forEach((s, r) => {
      s.classList.remove("spin");
      void s.offsetWidth;
      s.style.transitionDelay = r * 0.35 + "s";
      s.style.transform = `translateY(${(-(4 + idx) / 12) * 100}%)`;
    });
  },
  spin(el) {
    el.querySelectorAll(".reel-strip").forEach((s) => {
      s.style.transitionDelay = "0s";
      s.classList.add("spin");
    });
    el.querySelector(".lever")?.classList.remove("pull");
    void el.offsetWidth;
    el.querySelector(".lever")?.classList.add("pull");
  },
  phase(el, phase) {
    if (phase === "intro") {
      this.spin(el);
      clearTimeout(el._t);
      el._t = setTimeout(() => this.setReels(el, 0), 1300);
    } else if (phase === "question" && !el._landed) {
      this.setReels(el, 0);
    }
    el._landed = true;
  },
  reveal(el, q) {
    this.spin(el);
    clearTimeout(el._t);
    el._t = setTimeout(() => this.setReels(el, LETTERS.indexOf(q.correct) + 1), 1100);
  },
};

// 7) Reevaluación Cognitiva — de la montaña abrumadora a la escalera de micro-metas.
THEMES.reevaluacion = {
  html(q) {
    let stairs = "M 820 490";
    for (let i = 0; i < 11; i++) stairs += " h 32 v -35";
    const svg = SVG(`
      <g class="stars">${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 173) % 1600}" cy="${(i * 53) % 260 + 10}" r="${(i % 3) + 1}" style="--d:${(i % 6) * 0.5}s"/>`).join("")}</g>
      <path d="M 690 500 L 930 260 L 1030 340 L 1110 280 L 1600 420 L 1600 500 Z" fill="#525252" opacity=".55"/>
      <path class="mountain" d="M 760 500 L 1000 290 L 1080 330 L 1180 100 L 1290 230 L 1360 200 L 1590 500 Z"/>
      <path d="M 1180 100 L 1142 168 L 1166 156 L 1186 176 L 1206 152 L 1228 166 Z" fill="#dcdcdc"/>
      <path d="M 1180 102 V 28" stroke="#dcdcdc" stroke-width="5"/>
      <path class="flag" d="M 1182 30 L 1256 44 L 1182 62 Z"/>
      <text class="meta-t" x="1268" y="52">META MENSUAL</text>
      <path id="stairs" class="stairs" pathLength="1" d="${stairs}"/>
      <text class="stairs-t" x="930" y="300" transform="rotate(-47 930 300)">micro-metas diarias</text>
      <g class="climber-idle" transform="translate(800 490)"><circle cy="-38" r="12"/><path d="M -10 -24 h20 l4 24 h-28z"/></g>
      <g class="stress"><path d="M 760 420 l 10 -16 l 6 12 l 10 -18"/><path d="M 836 410 l 10 -14 l 6 12 l 10 -16"/><text x="790" y="398">!</text></g>
      <g class="climber"><circle cy="-38" r="12"/><path d="M -10 -24 h20 l4 24 h-28z"/><animateMotion id="climb" dur="3s" begin="indefinite" fill="freeze"><mpath href="#stairs"/></animateMotion></g>
      <g class="brain" transform="translate(330 380)">
        <circle class="ring" r="70"/><circle class="ring r2" r="70"/>
        <path d="M -8 -56 C -40 -66, -66 -40, -58 -14 C -76 0, -66 34, -40 38 C -32 58, -8 58, -8 44 Z M 8 -56 C 40 -66, 66 -40, 58 -14 C 76 0, 66 34, 40 38 C 32 58, 8 58, 8 44 Z"/>
        <path d="M -30 -30 q 12 8 0 22 M -40 10 q 16 0 18 14 M 30 -30 q -12 8 0 22 M 40 10 q -16 0 -18 14" class="folds"/>
      </g>`);
    return `${svg}${rootNode(q, [40, 30, 640, 200])}${cards(q, ROW3, { extra: `<span class="pedestal"></span>` })}`;
  },
  reveal(el) {
    setTimeout(() => el.querySelector("#climb")?.beginElement?.(), 900);
  },
};

// 8) Contención Emocional — el termómetro que baja de "Ira" a "Calma".
THEMES.contencion = {
  html(q) {
    const cx = 310,
      cy = 650,
      r = 180;
    const svg = SVG(`
      <g transform="translate(0 52)"><g class="cloud-say">
        <path d="M 150 300 q -40 -60 30 -80 q 30 -50 100 -20 q 60 -40 110 10 q 70 0 50 60 q 20 50 -60 60 h -170 q -80 -10 -60 -30 z" />
        <text class="say say-angry" x="310" y="290" text-anchor="middle">¡Mi camión está detenido!</text>
        <text class="say say-calm" x="310" y="290" text-anchor="middle">Gracias por escucharme</text>
      </g></g>
      <path d="${arc(cx, cy, r, 180, 240)}" class="zone z1"/>
      <path d="${arc(cx, cy, r, 240, 300)}" class="zone z2"/>
      <path d="${arc(cx, cy, r, 300, 360)}" class="zone z3"/>
      <text class="zone-t" x="${cx - 175}" y="${cy + 42}">Calma</text>
      <text class="zone-t" x="${cx}" y="${cy - r - 34}" text-anchor="middle">Molestia</text>
      <text class="zone-t" x="${cx + 175}" y="${cy + 42}" text-anchor="end">Ira</text>
      <g class="needle" style="transform-origin:${cx}px ${cy}px"><path d="M ${cx} ${cy - 10} L ${cx + 170} ${cy} L ${cx} ${cy + 10} Z"/></g>
      <circle cx="${cx}" cy="${cy}" r="22" class="hub"/>
      <text class="gauge-t" x="${cx}" y="${cy + 90}" text-anchor="middle">Tensión del cliente</text>
      <g transform="translate(${cx} ${cy - 76})"><g class="shield-big"><path d="M0 -50 L42 -34 V4 C42 34 20 50 0 58 C-20 50 -42 34 -42 4 V-34 Z"/></g></g>`);
    return `${svg}${rootNode(q, [40, 24, 580, 170], "root--sm")}${cards(
      q,
      [
        [660, 40, 900, 250],
        [660, 325, 900, 250],
        [660, 610, 900, 250],
      ],
      { extra: `<svg class="opt-shield" viewBox="-50 -60 100 125" aria-hidden="true"><path d="M0 -50 L42 -34 V4 C42 34 20 50 0 58 C-20 50 -42 34 -42 4 V-34 Z"/></svg>` }
    )}`;
  },
};

// 9) Pensamiento Sistémico — de silos aislados a engranajes alineados.
THEMES.sistemico = {
  html(q) {
    const gear = (cls, x, y, r, teeth, label, dx) => `
      <g class="gear-pos ${cls}" style="--dx:${dx}px" transform="translate(${x} ${y})">
        <g class="gear-rot"><path d="${gearPath(r, teeth)}"/><circle r="${r - 34}" class="gear-in"/>
          ${[0, 60, 120].map((a) => `<rect x="-6" y="${-(r - 36)}" width="12" height="${(r - 36) * 2}" rx="6" transform="rotate(${a})" class="spoke"/>`).join("")}</g>
        <circle r="${r - 52}" class="gear-hub"/><text class="gear-t" y="8">${label}</text>
      </g>`;
    const svg = SVG(`
      <g class="silos"><path d="M 615 210 V 470"/><path d="M 985 210 V 470"/><text x="615" y="200" text-anchor="middle">SILO</text><text x="985" y="200" text-anchor="middle">SILO</text></g>
      ${gear("g-ventas", 430, 340, 120, 12, "VENTAS", 143.5)}
      ${gear("g-bodega", 800, 300, 110, 11, "BODEGA", 0)}
      ${gear("g-mostrador", 1170, 340, 120, 12, "MOSTRADOR", -143.5)}
      <text class="sync-t" x="800" y="500" text-anchor="middle">Objetivos comunes · una sola cadena</text>`);
    return `${svg}${rootNode(q, [40, 22, 600, 175])}${cards(q, ROW3, {
      extra: `<svg class="opt-gear" viewBox="-70 -70 140 140" aria-hidden="true"><path d="${gearPath(55, 10, 16)}"/></svg>`,
    })}`;
  },
};

// 10) KAM — la llave maestra que abre la bóveda de las cuentas clave.
THEMES.kam = {
  html(q) {
    const cx = 800,
      cy = 268;
    const depts = ["Ventas", "Bodega", "Mostrador", "Compras", "Finanzas"];
    const KEY = `<g class="key-shape"><circle cx="-34" cy="0" r="22"/><circle cx="-34" cy="0" r="9" class="key-hole"/><rect x="-14" y="-7" width="70" height="14" rx="4"/><rect x="34" y="5" width="9" height="16"/><rect x="48" y="5" width="9" height="12"/></g>`;
    const svg = SVG(`
      <g class="vault">
        <circle cx="${cx}" cy="${cy}" r="215" class="v-frame"/>
        ${Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return `<circle cx="${(cx + 196 * Math.cos(a)).toFixed(1)}" cy="${(cy + 196 * Math.sin(a)).toFixed(1)}" r="7" class="v-bolt"/>`;
        }).join("")}
        <g class="v-inside">
          <circle cx="${cx}" cy="${cy}" r="176"/>
          ${depts
            .map((d, i) => {
              const a = -Math.PI / 2 + (i / depts.length) * Math.PI * 2;
              const x = cx + 112 * Math.cos(a);
              const y = cy + 112 * Math.sin(a);
              return `<g class="dept" style="--i:${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="40"/><text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle">${d}</text></g>`;
            })
            .join("")}
          <circle cx="${cx}" cy="${cy}" r="44" class="v-core"/><text x="${cx}" y="${cy - 4}" text-anchor="middle" class="v-core-t">CLIENTE</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" class="v-core-t">CLAVE</text>
        </g>
        <g class="v-door" style="transform-origin:${cx - 176}px ${cy}px">
          <circle cx="${cx}" cy="${cy}" r="176" class="v-door-c"/>
          <circle cx="${cx}" cy="${cy}" r="140" class="v-door-ring"/>
          <g class="v-wheel" style="transform-origin:${cx}px ${cy}px">
            ${[0, 60, 120].map((a) => `<rect x="${cx - 100}" y="${cy - 7}" width="200" height="14" rx="7" transform="rotate(${a} ${cx} ${cy})"/>`).join("")}
            <circle cx="${cx}" cy="${cy}" r="34"/>
          </g>
          <path d="M ${cx} ${cy - 16} a 12 12 0 0 1 8 21 l 5 25 h -26 l 5 -25 a 12 12 0 0 1 8 -21 z" class="v-keyhole"/>
          <text x="${cx}" y="${cy + 120}" text-anchor="middle" class="v-label">CUENTAS CLAVE</text>
        </g>
      </g>
      <g class="fly-key">${KEY}</g>
      <g class="kam-hint"><text x="1310" y="190" text-anchor="middle">3 llaves</text><text x="1310" y="240" text-anchor="middle">1 sola abre</text><text x="1310" y="290" text-anchor="middle">la bóveda</text></g>
      <g class="kam-win"><text x="1310" y="170" text-anchor="middle">Stock reservado</text><text x="1310" y="230" text-anchor="middle">Prioridad de picking</text><text x="1310" y="290" text-anchor="middle">Carril rápido</text></g>`);
    return `${svg}${rootNode(q, [40, 22, 520, 190])}${cards(q, ROW3, {
      extra: `<svg class="opt-key" viewBox="-60 -26 120 52" aria-hidden="true">${KEY}</svg>`,
    })}`;
  },
  reveal(el, q) {
    const key = el.querySelector(".fly-key");
    if (!key) return;
    const x0 = { A: 295, B: 800, C: 1305 }[q.correct];
    key.style.transition = "none";
    key.style.transform = `translate(${x0}px, 560px) rotate(-90deg)`;
    key.classList.add("on");
    void key.getBoundingClientRect();
    requestAnimationFrame(() => {
      key.style.transition = "";
      key.style.transform = `translate(780px, 268px) rotate(0deg)`;
    });
    setTimeout(() => key.classList.add("turn"), 1300);
    setTimeout(() => el.classList.add("vault-open"), 2000);
  },
};

// ======================== API de escenas ========================

export function mountScene(container, q) {
  const T = THEMES[q.theme];
  container.innerHTML = `<div class="scene scene--${q.theme}" data-theme="${q.theme}">${T.html(q)}</div>`;
  const el = container.firstElementChild;
  const sc = { el, q, T, phase: null };
  fitScene(sc);
  if (document.fonts?.ready) document.fonts.ready.then(() => fitScene(sc));
  return sc;
}

export function fitScene(sc) {
  if (!sc?.el?.isConnected) return;
  sc.el.querySelectorAll(".opt").forEach((o) => {
    const body = o.querySelector(".opt-body");
    o.style.fontSize = "";
    let fs = parseFloat(getComputedStyle(o).getPropertyValue("--fs")) || 1.3;
    o.style.fontSize = fs + "cqw";
    let guard = 0;
    while (body.scrollHeight > body.clientHeight + 1 && fs > 0.75 && guard++ < 40) {
      fs -= 0.05;
      o.style.fontSize = fs.toFixed(2) + "cqw";
    }
  });
}

export function setScenePhase(sc, phase) {
  if (!sc || sc.phase === phase) return;
  const el = sc.el;
  el.classList.remove("is-intro", "is-question", "is-reveal");
  el.classList.add("is-" + phase);
  if (phase !== "intro") el.classList.add("show-opts");
  sc.T.phase?.call(sc.T, el, phase, sc.q);
  if (phase === "reveal") {
    el.querySelectorAll(".opt").forEach((o) => o.classList.add(o.dataset.l === sc.q.correct ? "is-win" : "is-lose"));
    el.classList.add("win-" + sc.q.correct);
    sc.T.reveal?.call(sc.T, el, sc.q);
  }
  sc.phase = phase;
}

export function setDistribution(sc, counts) {
  if (!sc) return;
  const total = Math.max(1, counts.A + counts.B + counts.C);
  sc.el.querySelectorAll(".opt").forEach((o) => {
    const n = counts[o.dataset.l] || 0;
    o.querySelector(".opt-dist i").style.width = (n / total) * 100 + "%";
    o.querySelector(".opt-dist span").textContent = n === 1 ? "1 voto" : `${n} votos`;
  });
}

// Íconos animados para la vista del celular de cada concursante
export const MINI = {
  ruta: `<svg viewBox="-110 -80 220 110">${TRUCK}<path d="M-110 22 H110" stroke="#8f8681" stroke-width="4" stroke-dasharray="14 10" class="mini-road"/></svg>`,
  iceberg: `<svg viewBox="0 0 200 120"><path d="M40 70 L80 25 L100 12 L125 40 L160 70Z" fill="#fff"/><path d="${wavePath(-60, 260, 70, 5, 40)} L260 120 L-60 120Z" fill="#525252" class="mini-sea"/><path d="M50 72 L30 100 L90 118 L150 96 L150 72Z" fill="#dcdcdc" opacity=".25"/></svg>`,
  recuperacion: `<svg viewBox="0 0 200 110"><path d="M10 60 H60 C80 60 85 95 100 95 C120 95 130 50 150 35 S180 18 192 15" class="mini-line" pathLength="1"/><circle cx="100" cy="95" r="6" fill="#070000" stroke="#e75a24" stroke-width="3"/></svg>`,
  latigo: `<svg viewBox="0 0 200 110"><path d="M10 55 Q 30 50 50 55 T 90 55 T 130 50 T 170 40 T 195 25" class="mini-wave"/><path d="M10 55 Q 30 60 50 55 T 90 60 T 130 70 T 170 85 T 195 100" class="mini-wave w2"/></svg>`,
  empatia: `<svg viewBox="-60 -50 120 90"><path class="mini-heart" d="M0 30 C -60 -10, -45 -62, 0 -36 C 45 -62, 60 -10, 0 30 Z"/></svg>`,
  pas: `<svg viewBox="0 0 210 90"><g class="mini-reels">${["P", "A", "S"].map((l, i) => `<rect x="${8 + i * 68}" y="8" width="58" height="74" rx="8"/><text x="${37 + i * 68}" y="62" text-anchor="middle" style="--i:${i}">${l}</text>`).join("")}</g></svg>`,
  reevaluacion: `<svg viewBox="0 0 200 120"><path d="M10 110 h25 v-18 h25 v-18 h25 v-18 h25 v-18 h25 v-18 h25" class="mini-stairs" pathLength="1"/><path d="M160 20 V2" stroke="#dcdcdc" stroke-width="3"/><path d="M161 3 l22 6 -22 7z" fill="#e75a24"/></svg>`,
  contencion: `<svg viewBox="-110 -100 220 120"><path d="${arc(0, 0, 80, 180, 240)}" stroke="#8f8681" stroke-width="22" fill="none"/><path d="${arc(0, 0, 80, 240, 300)}" stroke="#e75a24" stroke-opacity=".5" stroke-width="22" fill="none"/><path d="${arc(0, 0, 80, 300, 360)}" stroke="#e75a24" stroke-width="22" fill="none"/><g class="mini-needle"><path d="M0 -6 L72 0 L0 6Z" fill="#fff"/></g><circle r="10" fill="#fff"/></svg>`,
  sistemico: `<svg viewBox="-110 -70 220 140"><g transform="translate(-42 0)"><path class="mini-gear g1" d="${gearPath(44, 10, 14)}"/></g><g transform="translate(46 -6)"><path class="mini-gear g2" d="${gearPath(40, 9, 14)}"/></g></svg>`,
  kam: `<svg viewBox="-70 -40 140 80"><g class="mini-key"><circle cx="-34" cy="0" r="20" fill="#e75a24"/><circle cx="-34" cy="0" r="8" fill="#070000"/><rect x="-16" y="-6" width="66" height="12" rx="4" fill="#e75a24"/><rect x="32" y="4" width="8" height="14" fill="#e75a24"/><rect x="45" y="4" width="8" height="10" fill="#e75a24"/></g></svg>`,
};
