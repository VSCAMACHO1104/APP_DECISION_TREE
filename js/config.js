// =====================================================================
//  CONFIGURACIÓN DE LA APP — Academia de Ventas TRAA
// =====================================================================
//
//  Solo necesitas editar los DOS bloques marcados con ▼ PASO 1 y ▼ PASO 2.
//  No cambies la línea "export const CONFIG" ni lo que está debajo de ella,
//  salvo que quieras ajustar puntos o tiempos.
// =====================================================================


// ▼ PASO 1 — Pega aquí el bloque que te da Firebase, TAL CUAL.
//   (Consola Firebase → ⚙️ Configuración del proyecto → Tus apps → Web →
//    "SDK setup and configuration" → opción "Config").
//   Debe empezar con  const firebaseConfig = {  y terminar con  };
//
//   Para volver al MODO DEMOSTRACIÓN (sin Firebase), reemplázalo por:
//   const firebaseConfig = null;

const firebaseConfig = {
  apiKey: "AIzaSyDLbtQihknvfkxdmB_PfLvWpLgezCufOFg",
  authDomain: "traa-academia.firebaseapp.com",
  databaseURL: "https://traa-academia-default-rtdb.firebaseio.com",
  projectId: "traa-academia",
  storageBucket: "traa-academia.firebasestorage.app",
  messagingSenderId: "887065165436",
  appId: "1:887065165436:web:3293e9ef1edaa00678d3f9"
};


// ▼ PASO 2 — Correo del usuario administrador que creaste en
//   Firebase → Authentication → Usuarios. En la app solo se te pedirá
//   la contraseña de ese usuario.

const adminEmail = "vcamacho@traarepuestos.com";


// =====================================================================
//  No es necesario modificar nada debajo de esta línea.
// =====================================================================

export const CONFIG = {
  firebase: firebaseConfig,
  adminEmail: adminEmail,

  // Solo para el MODO DEMOSTRACIÓN: huella SHA-256 de la contraseña del
  // administrador. Por defecto la contraseña es:  TRAA2026
  // Para cambiarla, abre la app con #hash al final de la URL, escribe tu
  // nueva contraseña y copia aquí la huella que se muestra.
  demoAdminPasswordHash: "fd257247c8369e408e559175acae3b14ad82873b9d37940859f3bd7949bd9992",

  // Reglas de puntuación
  basePoints: 500, // puntos por respuesta correcta
  maxSpeedBonus: 500, // bono máximo por velocidad (se reduce con el tiempo)

  // Tiempos (segundos)
  defaultQuestionTime: 30, // tiempo para responder cada evaluación
  introSeconds: 6, // presentación animada del concepto antes de responder
};
