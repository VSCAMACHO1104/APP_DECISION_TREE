// =====================================================================
//  CONFIGURACIÓN DE LA APP — Academia de Ventas TRAA
// =====================================================================
//
//  MODO EN VIVO (varios dispositivos):  pega abajo la configuración de tu
//  proyecto Firebase y el correo del administrador. Sigue la guía del
//  README.md (sección "Activar el modo en vivo con Firebase").
//
//  MODO DEMOSTRACIÓN: si `firebase` se deja en null, la app funciona sin
//  servidor, guardando los datos en el navegador. Sirve para probar la
//  dinámica abriendo varias pestañas en la MISMA computadora.
// =====================================================================

export const CONFIG = {
  // 1) Configuración web de Firebase (Consola Firebase → Configuración del
  //    proyecto → Tus apps → SDK de Firebase → "Configuración").
  //    Ejemplo:
  //    firebase: {
  //      apiKey: "AIza...",
  //      authDomain: "traa-academia.firebaseapp.com",
  //      databaseURL: "https://traa-academia-default-rtdb.firebaseio.com",
  //      projectId: "traa-academia",
  //      appId: "1:123:web:abc",
  //    },
  firebase: null,

  // 2) Correo del usuario administrador creado en Firebase Authentication
  //    (Correo/contraseña). En la app solo se te pedirá la contraseña.
  adminEmail: "",

  // 3) Solo para el MODO DEMOSTRACIÓN: huella SHA-256 de la contraseña del
  //    administrador. Por defecto la contraseña es:  TRAA2026
  //    Para cambiarla, abre la app con #hash al final de la URL, escribe tu
  //    nueva contraseña y copia aquí la huella que se muestra.
  demoAdminPasswordHash: "fd257247c8369e408e559175acae3b14ad82873b9d37940859f3bd7949bd9992",

  // Reglas de puntuación
  basePoints: 500,      // puntos por respuesta correcta
  maxSpeedBonus: 500,   // bono máximo por velocidad (se reduce con el tiempo)

  // Tiempos (segundos)
  defaultQuestionTime: 30, // tiempo para responder cada evaluación
  introSeconds: 6,         // presentación animada del concepto antes de responder
};
