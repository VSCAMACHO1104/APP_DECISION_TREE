// Banco de evaluaciones — Árbol de Decisión de Conceptos Clave
// Fuente: Arbol_Decision_Academia_Ventas_TRAA_Modulo2.docx
// Cada evaluación tiene un "escenario" (theme) con su propia visualización animada.

export const QUESTIONS = [
  {
    id: 1,
    theme: "ruta",
    themeName: "Ruta de Flota",
    concept: "CPK",
    fullTitle: "CPK (Costo por Kilómetro)",
    module: "Repaso Módulo 1 · Métricas Comerciales B2B",
    options: {
      A: "Costo por Kit de Mantenimiento: indicador financiero para calcular el margen bruto obtenido por cada paquete de repuestos vendido en mostrador.",
      B: "Costo por Kilómetro: métrica operativa vital para evaluar el rendimiento y gasto real por distancia recorrida en flotas comerciales y transporte pesado.",
      C: "Capacidad de Pedido por Kilogramo: índice logístico utilizado en bodega para medir el peso máximo de importación en contenedores de repuestos.",
    },
    correct: "B",
    explanation:
      "El CPK mide el costo operativo por kilómetro recorrido, herramienta esencial del asesor consultivo en TRAA Repuestos para demostrar rentabilidad a clientes de flotas y transporte pesado.",
  },
  {
    id: 2,
    theme: "iceberg",
    themeName: "El Iceberg del Costo",
    concept: "TCO",
    fullTitle: "TCO (Costo Total de Propiedad)",
    module: "Repaso Módulo 1 · Argumentación de Valor",
    options: {
      A: "Tasa de Cierre Operativo: porcentaje de cotizaciones que un vendedor transaccional convierte en facturas efectivas durante una semana.",
      B: "Tiempo de Ciclo de Orden: duración exacta desde que el cliente solicita una pieza en mostrador hasta que bodega completa el despacho físico.",
      C: "Costo Total de Propiedad: evaluación integral de la inversión a largo plazo (vida útil, durabilidad y menor tiempo de paro) más allá del precio inicial de compra.",
    },
    correct: "C",
    explanation:
      "Mientras las ramas A y B refieren a indicadores de ventas o logística, el TCO evalúa el costo integral a largo plazo del repuesto, justificando por qué una pieza de calidad superior es más rentable que una barata.",
  },
  {
    id: 3,
    theme: "recuperacion",
    themeName: "La Curva de la Lealtad",
    concept: "Paradoja de la Recuperación",
    fullTitle: "Paradoja de la Recuperación",
    module: "Repaso Módulo 1 · Fidelización y Servicio al Cliente",
    options: {
      A: "Fenómeno comercial donde un cliente desarrolla mayor fidelidad hacia la empresa tras un problema excelentemente resuelto que si nunca hubiera tenido inconvenientes.",
      B: "Estrategia financiera para recuperar cuentas por cobrar morosas mediante descuentos escalonados sin suspender el crédito comercial del cliente.",
      C: "Proceso logístico de reingreso a inventario de repuestos devueltos por garantía para recuperar su valor contable ante el fabricante original (OEM).",
    },
    correct: "A",
    explanation:
      "La Paradoja de la Recuperación transforma una queja o falla crítica en una oportunidad de fidelización superior cuando el equipo actúa con rapidez, empatía y eficacia resolutiva.",
  },
  {
    id: 4,
    theme: "latigo",
    themeName: "La Onda de la Cadena",
    concept: "Efecto Látigo",
    sub: "Bullwhip Effect",
    fullTitle: "Efecto Látigo (Bullwhip Effect)",
    module: "Repaso Módulo 1 · Cadena de Suministro e Inventarios",
    options: {
      A: "Impacto psicológico de presión autoritaria que ejerce un supervisor comercial cuando exige el cumplimiento de metas mediante amenazas o sanciones.",
      B: "Desajuste en la cadena de suministro donde pequeñas variaciones en la demanda del cliente final provocan grandes distorsiones de inventario hacia atrás.",
      C: "Técnica de cierre agresivo en ventas transaccionales que busca presionar al comprador con ofertas relámpago de último minuto.",
    },
    correct: "B",
    explanation:
      "El Efecto Látigo es un fenómeno logístico y comercial en el cual pequeños cambios en el consumo final generan sobrestock o desabasto severo a lo largo de la cadena de distribución.",
  },
  {
    id: 5,
    theme: "empatia",
    themeName: "La Mesa de Negociación",
    concept: "Empatía Táctica",
    fullTitle: "Empatía Táctica",
    module: "Repaso Módulo 1 · Negociación y Psicología Comercial",
    options: {
      A: "Complacer emocionalmente al cliente otorgándole todos los descuentos y plazos que solicite con tal de evitar cualquier fricción o desacuerdo.",
      B: "Comprender deliberadamente la perspectiva, emociones y obstáculos del cliente para generar confianza y guiar estratégicamente la negociación comercial.",
      C: "Simular afinidad personal imitando los gestos y modismos del comprador únicamente para cerrar una venta puntual sin importar su necesidad real.",
    },
    correct: "B",
    explanation:
      "A diferencia de la complacencia pasiva (Rama A) o la manipulación superficial (Rama C), la Empatía Táctica reconoce genuinamente la emoción del cliente para encauzar la negociación con ventaja estratégica.",
  },
  {
    id: 6,
    theme: "pas",
    themeName: "La Tragamonedas PAS",
    concept: "Método PAS",
    fullTitle: "Método PAS (Psicología de la Compra)",
    module: "Repaso Módulo 1 · Estructura de Venta Persuasiva",
    options: {
      A: "Producto, Atención y Seguimiento: protocolo administrativo de mostrador para registrar cotizaciones, facturar repuestos y realizar llamadas postventa.",
      B: "Precio, Ahorro y Surtido: argumento de venta transaccional enfocado exclusivamente en competir por volumen y bajo costo frente a otros comercios.",
      C: "Problema, Agitación y Solución: estructura persuasiva que identifica el dolor del cliente, evidencia las consecuencias de no actuar y presenta el repuesto ideal.",
    },
    reels: { A: ["Producto", "Atención", "Seguimiento"], B: ["Precio", "Ahorro", "Surtido"], C: ["Problema", "Agitación", "Solución"] },
    correct: "C",
    explanation:
      "El Método PAS activa los gatillos mentales de decisión al diagnosticar el Problema, generar Agitación sobre el costo de tener la unidad detenida y presentar la Solución técnica.",
  },
  {
    id: 7,
    theme: "reevaluacion",
    themeName: "La Escalera de Micro-metas",
    concept: "Reevaluación Cognitiva",
    fullTitle: "Autoconocimiento y Reevaluación Cognitiva",
    module: "Módulo 2.1 · Control Emocional en el Entorno de Ventas",
    options: {
      A: "Reconocer los picos de ansiedad ante una meta lejana y reinterpretar la situación dividiendo la cuota mensual en micro-metas diarias alcanzables.",
      B: "Evaluar técnicamente el catálogo de repuestos nuevos cada mes para memorizar códigos de fábrica y especificaciones mecánicas.",
      C: "Reasignar las metas de ventas no cumplidas entre los demás compañeros del mostrador para reducir la carga laboral individual.",
    },
    correct: "A",
    explanation:
      "Basado en Daniel Goleman y Richard Lazarus, el autoconocimiento y la reevaluación cognitiva permiten controlar el estrés comercial transformando una amenaza abrumadora en objetivos diarios manejables.",
  },
  {
    id: 8,
    theme: "contencion",
    themeName: "El Termómetro Emocional",
    concept: "Contención Emocional",
    fullTitle: "Técnicas de Contención y Optimismo Aprendido",
    module: "Módulo 2.1 · Resiliencia y Manejo de Reclamos",
    options: {
      A: "Frenar de inmediato al cliente molesto explicándole con firmeza las políticas legales de garantía mientras habla para que baje el tono de voz.",
      B: "Absorber la carga emocional negativa mediante escucha activa sin interrumpir, validando la frustración del cliente para luego guiarlo a una solución racional.",
      C: "Contener y ocultar las quejas de los clientes sin registrarlas en el sistema para evitar que la gerencia detecte fallas en el servicio de la sucursal.",
    },
    correct: "B",
    explanation:
      "Inspirada en Carl Rogers y Marshall Rosenberg, la contención emocional desescala el conflicto validando el sentimiento del cliente («un vehículo detenido cuesta dinero») antes de pasar a la solución técnica.",
  },
  {
    id: 9,
    theme: "sistemico",
    themeName: "Los Engranajes de la Organización",
    concept: "Pensamiento Sistémico",
    fullTitle: "Pensamiento Sistémico y Alineación Operativa",
    module: "Módulo 2.2 · Trabajo en Equipo Interdepartamental",
    options: {
      A: "Implementación de un software informático automatizado que reemplaza la comunicación humana entre los vendedores de calle y el personal de bodega.",
      B: "Esquema donde cada departamento compite internamente por cumplir sus propios indicadores aislados sin intervenir en las labores de las demás áreas.",
      C: "Visión organizacional (Peter Senge) donde Ventas, Bodega y Mostrador comparten objetivos comunes y comprenden que su desempeño impacta a toda la cadena.",
    },
    correct: "C",
    explanation:
      "El pensamiento sistémico elimina el trabajo en «silos» aislados, alineando promesas de venta con tiempos reales de alistamiento en bodega y atención fluida en mostrador.",
  },
  {
    id: 10,
    theme: "kam",
    themeName: "La Llave Maestra",
    concept: "KAM",
    sub: "Cuentas Clave",
    fullTitle: "Colaboración Estratégica KAM (Key Account Management)",
    module: "Módulo 2.2 · Sinergia Multifuncional en Cuentas Clave",
    options: {
      A: "Asignar un único vendedor estrella para que atienda, facture, aliste en bodega y despache por su cuenta todos los pedidos de las flotas más grandes.",
      B: "Esfuerzo coordinado y multifuncional de toda la empresa (Ventas, Bodega, Mostrador, Compras y Finanzas) para brindar protocolos prioritarios a clientes estratégicos.",
      C: "Programa de bloqueo de clave de acceso en el sistema CRM para restringir que otros departamentos consulten la información de los clientes corporativos.",
    },
    correct: "B",
    explanation:
      "Según McDonald y Woodburn, el manejo exitoso de Cuentas Clave (KAM) no depende de un vendedor solitario, sino de la sinergia interdepartamental (stock reservado, prioridad de picking y carril rápido).",
  },
];

export const LETTERS = ["A", "B", "C"];
