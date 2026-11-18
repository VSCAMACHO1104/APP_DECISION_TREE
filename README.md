# Árbol de Decisión · Academia de Ventas TRAA (Módulo 2)

App web de dinámicas interactivas para el programa de ventas y desarrollo comercial de **TRAA Repuestos**.
El facilitador proyecta un **concepto clave** (nodo central) con **tres ramas (A, B, C)**; solo una define
correctamente el concepto. Los concursantes responden desde su celular y ganan puntos por acertar, con
bono por velocidad. Contenido tomado de `Arbol_Decision_Academia_Ventas_TRAA_Modulo2.docx`.

---

## Cómo se juega

| Rol | Cómo entra | Qué hace |
|---|---|---|
| **Concursante** | Abre el enlace (o escanea el QR) y escribe **nombre y primer apellido**. Sin contraseña. | Responde A, B o C en su celular y ve su resultado y su posición. |
| **Administrador** (facilitador) | `…/index.html#admin` con contraseña. | Lanza cada evaluación, controla el tiempo, revela respuestas, muestra el ranking y exporta resultados. |
| **Pantalla de proyección** (opcional) | `…/index.html#pantalla` | Muestra las escenas sin controles (útil si proyectas desde otra computadora). |

**Puntuación** (configurable en `js/config.js`):

- Respuesta correcta: **500 pts** + **bono por velocidad de hasta 500 pts** (baja de forma lineal con el tiempo).
- Respuesta incorrecta o sin responder: **0 pts**.
- Desempate: más aciertos y luego menor tiempo acumulado.

### Las 10 evaluaciones y su escenario animado

| # | Concepto | Escenario | Lo que pasa al revelar |
|---|---|---|---|
| 1 | CPK | Ruta de Flota | El camión TRAA toma la salida correcta. |
| 2 | TCO | El Iceberg del Costo | Aparece lo que hay bajo el agua: vida útil, durabilidad, tiempo de paro… |
| 3 | Paradoja de la Recuperación | La Curva de la Lealtad | La curva sale de la falla y sube por encima de la línea "sin incidentes". |
| 4 | Efecto Látigo | La Onda de la Cadena | Del chasquido del látigo a la onda que crece de Cliente → Proveedor. |
| 5 | Empatía Táctica | La Mesa de Negociación | Asesor y cliente se acercan; late el corazón de la confianza. |
| 6 | Método PAS | La Tragamonedas PAS | Los rodillos giran y caen en Problema · Agitación · Solución, con jackpot. |
| 7 | Reevaluación Cognitiva | La Escalera de Micro-metas | Se construye la escalera y el asesor sube hasta la meta mensual. |
| 8 | Contención Emocional | El Termómetro Emocional | La aguja baja de "Ira" a "Calma". |
| 9 | Pensamiento Sistémico | Los Engranajes de la Organización | Los "silos" desaparecen y Ventas, Bodega y Mostrador engranan. |
| 10 | KAM | La Llave Maestra | La llave correcta abre la bóveda de las cuentas clave. |

El concepto se muestra **sin pistas** durante la pregunta (por ejemplo, solo "CPK"); el título completo y la
justificación del documento aparecen al revelar la respuesta.

---

## 1) Publicar en GitHub Pages

1. En GitHub, abre el repositorio → **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. Selecciona la rama donde está la app (por ejemplo `main`, una vez fusionada) y la carpeta **`/ (root)`**. Guarda.
4. En uno o dos minutos la app queda en:
   `https://vscamacho1104.github.io/APP_DECISION_TREE/`
   - Consola del administrador: `https://vscamacho1104.github.io/APP_DECISION_TREE/#admin`

> El archivo `.nojekyll` ya está incluido para que GitHub Pages sirva todos los archivos tal cual.

## 2) Modo demostración y modo en vivo

- **Modo demostración (por defecto).** Funciona sin configurar nada, pero los datos viven en el navegador.
  Sirve para ensayar en una sola computadora: abre la consola en una pestaña y concursantes en otras pestañas.
  Contraseña de administrador por defecto: **`TRAA2026`**.
- **Modo en vivo (recomendado para la sesión real).** Cada concursante usa su propio celular. Requiere un
  proyecto gratuito de **Firebase** (plan Spark). Configurarlo toma unos 10 minutos (ver abajo).

## 3) Activar el modo en vivo con Firebase

1. Entra a <https://console.firebase.google.com> → **Agregar proyecto** (por ejemplo `traa-academia`).
   Puedes desactivar Google Analytics.
2. **Authentication → Comenzar → Método de acceso**:
   - Habilita **Anónimo** (así entran los concursantes sin contraseña).
   - Habilita **Correo electrónico/contraseña**.
   - En la pestaña **Usuarios → Agregar usuario**, crea tu cuenta de administrador (tu correo y una contraseña segura).
   - En **Configuración → Dominios autorizados**, agrega `vscamacho1104.github.io`.
3. **Realtime Database → Crear base de datos** (elige la ubicación más cercana, inicia en modo bloqueado).
   - En la pestaña **Reglas**, pega el contenido de [`database.rules.json`](database.rules.json),
     reemplaza las **dos** apariciones de `CORREO_ADMIN` por tu correo de administrador (en minúsculas) y **Publica**.
4. **Configuración del proyecto (⚙️) → Tus apps → `</>` (Web)**: registra la app (no necesitas Hosting).
   En "SDK setup and configuration" elige la opción **Config** y copia el bloque completo, que empieza con
   `const firebaseConfig = {` y termina con `};`.
5. Edita [`js/config.js`](js/config.js) en GitHub (ícono del lápiz). Solo hay **dos** cosas que cambiar:

   ```js
   // ▼ PASO 1 — reemplaza este bloque completo por el que copiaste de Firebase
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "traa-academia.firebaseapp.com",
     databaseURL: "https://traa-academia-default-rtdb.firebaseio.com",
     projectId: "traa-academia",
     storageBucket: "traa-academia.firebasestorage.app",
     messagingSenderId: "…",
     appId: "1:…:web:…"
   };

   // ▼ PASO 2 — escribe el correo del administrador entre las comillas
   const adminEmail = "tu-correo@empresa.com";
   ```

   - **No modifiques** la línea `export const CONFIG = {` ni lo que está debajo (salvo puntos o tiempos).
   - Verifica que el bloque incluya `databaseURL`. Si falta, crea primero la Realtime Database (paso 3) y vuelve a copiar la configuración.
   - Para volver al modo demostración, cambia el bloque del paso 1 por `const firebaseConfig = null;`.
6. Guarda con **Commit changes**. La insignia de la app cambiará de **DEMO** a **EN VIVO**.

> Los datos de `firebaseConfig` no son secretos: identifican el proyecto. La seguridad la dan las reglas de
> `database.rules.json`: solo el administrador puede lanzar evaluaciones y escribir puntajes; cada concursante
> solo puede registrar **una** respuesta propia, mientras la pregunta está abierta y dentro del tiempo, y no puede
> ver las respuestas de los demás. Tu contraseña de administrador la guarda Firebase, no el código.

---

## 4) El día de la dinámica

1. Abre `…/#admin`, ingresa tu contraseña y proyecta la pantalla (botón ⛶ o tecla **F** para pantalla completa).
2. En la sala de espera aparecen el **código QR** y el enlace. Los nombres de los concursantes van apareciendo.
3. Elige el **tiempo por evaluación** (15–90 s, por defecto 30 s) y pulsa **Comenzar evaluación 1**.
4. Cada evaluación sigue este ciclo:
   - **Presentación** animada del concepto (6 s) → **Pregunta** con cronómetro →
     **Revelado** automático al terminar el tiempo o cuando todos respondieron (o con **Revelar respuesta**).
   - Desde el revelado puedes ir al **Ranking** o directo a la **Siguiente evaluación**.
5. Tras la evaluación 10, **Resultados finales** muestra el podio con confeti.
6. **Exportar** (⬇) descarga un CSV (abre en Excel) con puntajes, aciertos y detalle por evaluación.

**Atajos de teclado (consola):** `Espacio`/`Enter` avanza al siguiente paso · `H` oculta los controles ·
`F` pantalla completa · `P` panel de participantes.

**Otros controles:** chips **1–10** para saltar o repetir una evaluación · **+10 s** durante la pregunta ·
panel de participantes (ver conectados, retirar a alguien) · **Reiniciar** (solo puntajes, o todo) ·
🖥 abre la pantalla de proyección en otra ventana.

Si un concursante recarga la página o cambia de celular, vuelve a entrar con el mismo nombre y apellido y
conserva sus puntos.

---

## Personalización

- `js/config.js`: puntos base, bono máximo por velocidad, tiempo por defecto y duración de la presentación.
- `js/questions.js`: textos de cada evaluación (concepto, ramas, respuesta correcta y justificación).
- Contraseña del **modo demostración**: abre `…/#hash`, escribe la nueva contraseña y copia la huella en
  `demoAdminPasswordHash` de `js/config.js`. (En modo en vivo la contraseña se cambia en Firebase.)

## Estructura

```
index.html              Punto de entrada (rutas: concursante, #admin, #pantalla, #hash)
css/styles.css          Diseño con la paleta TRAA y animaciones de las 10 escenas
js/config.js            Configuración (Firebase, administrador, puntuación, tiempos)
js/questions.js         Las 10 evaluaciones del documento
js/scenes.js            Escenarios animados (SVG) de cada evaluación
js/host.js              Consola del administrador y pantalla de proyección
js/player.js            Vista del concursante (celular)
js/game.js              Reglas de puntuación y ranking
js/store.js             Datos en tiempo real (Firebase o modo demostración)
js/fx.js · js/ui.js     Sonidos, confeti y utilidades de interfaz
js/vendor/qrcode.js     Generador de códigos QR (MIT, Kazuhiko Arase)
assets/                 Logos optimizados para la web
database.rules.json     Reglas de seguridad para Firebase Realtime Database
```

Paleta: `#ffffff` · `#dcdcdc` · `#8f8681` · `#525252` · `#070000` · `#e75a24` — tipografía Montserrat.

**Nota:** como toda página estática, el código (incluidas las respuestas en `js/questions.js`) es público en
el repositorio. Para una dinámica de capacitación esto es aceptable; si necesitas ocultarlo, usa un repositorio
privado con GitHub Pages (requiere un plan de pago de GitHub).
