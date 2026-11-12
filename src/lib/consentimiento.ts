// Texto del consentimiento del formulario de primera visita.
// BORRADOR basado en el consentimiento en PDF que Julia usa ahora: el texto final lo aprueba Julia.
// Si cambia el texto, sube la versión: cada paciente guarda la versión que aceptó.
export const CONSENTIMIENTO_VERSION = "2026-11-borrador";

export const PSICOLOGA = {
  nombre:     "Julia Abete González",
  colegiada:  "MU-04047",
  email:      "juliaabetepsicologa@gmail.com",
  telefono:   "+34 611 39 32 33",
};

export const TERAPIA: { titulo: string; puntos: string[] }[] = [
  {
    titulo: "Intervención psicológica",
    puntos: [
      `Doy mi consentimiento para recibir la intervención psicológica que me proponga ${PSICOLOGA.nombre}, psicóloga colegiada ${PSICOLOGA.colegiada}, de forma presencial u online.`,
      "Se me informará de forma clara de los objetivos, el procedimiento, la duración aproximada y los honorarios.",
      "Todo lo que se hable en sesión es confidencial, según el Código Deontológico de la Psicología. El secreto profesional solo se rompe si hay riesgo para mi vida o la de otras personas, o por orden judicial.",
      "Puedo retirar este consentimiento cuando quiera, igual que la profesional puede dar por terminada la intervención.",
    ],
  },
  {
    titulo: "Sesiones online",
    puntos: [
      "Las sesiones online se hacen por Google Meet, en un lugar privado, sin otras personas presentes salvo acuerdo y evitando interrupciones.",
      "No se permite grabar las sesiones salvo acuerdo por escrito de ambas partes.",
      "La terapia online no sustituye a la medicación ni al seguimiento de un psiquiatra o médico.",
      "Si la conexión falla, se intentará seguir por otro medio seguro o se buscará otro momento. Si los problemas de conexión o del entorno se repiten, la profesional podrá dejar la terapia y cobrar las sesiones.",
      "No reenviaré a otras personas los correos o mensajes de la profesional sin su permiso por escrito.",
    ],
  },
  {
    titulo: "Condiciones del servicio",
    puntos: [
      "Sesión individual: 50 €. Se paga por Bizum o transferencia, indicando en el concepto la fecha de la sesión y el nombre. Puedo pedir la factura a final de mes.",
      `Las cancelaciones se avisan con 24 horas de antelación por WhatsApp o llamada al ${PSICOLOGA.telefono}. Si no me presento sin avisar, se cobra la sesión completa.`,
    ],
  },
];

export const DATOS: string[] = [
  `Responsable: ${PSICOLOGA.nombre} (${PSICOLOGA.email}).`,
  "Finalidad: gestionar la atención psicológica, las citas, los cobros y las facturas.",
  "Base legal: mi consentimiento expreso (art. 6.1.a y 9.2.a del RGPD) y las obligaciones legales de facturación y de historia clínica.",
  "Los datos se guardan de forma segura, no se ceden a terceros salvo obligación legal y se conservan mientras dure la atención y después el tiempo que exija la ley.",
  `Puedo acceder, rectificar, suprimir, oponerme, limitar o portar mis datos escribiendo a ${PSICOLOGA.email}, y reclamar ante la Agencia Española de Protección de Datos (aepd.es).`,
];
