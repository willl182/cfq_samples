/* Configuracion inicial y estructuras */

const HEADERS = {
  Productos: [
    "ID_PROD",
    "COD",
    "PRODUCTO",
    "PROVEEDOR",
    "Cprov",
    "CLASE",
    "TIPO",
    "NOMBRE"
  ].concat(ELEMENTS).concat([
    "COMP1",
    "COMP2",
    "COMP3",
    "COMP4",
    "COMP5",
    "COMP6",
    "COMP7",
    "COMP8",
    "COMP9",
    "COMP10"
  ]),
  Laboratorios: ["ID", "Nombre", "Direccion", "Ciudad", "Email", "Contacto"],
  Envios: [
    "ID_Envio",
    "Fecha_Creacion",
    "Fecha_Envio",
    "Laboratorio_ID",
    "Estado",
    "Link_Doc",
    "Link_PDF",
    "Dias_Sin_Respuesta",
    "Alerta"
  ],
  Detalle_Muestras: [
    "ID_Envio",
    "ID_PROD",
    "Producto",
    "Codigo",
    "Lote"
  ]
    .concat(ELEMENTS.map((el) => "Req_" + el))
    .concat(METALS.map((el) => "Req_" + el))
    .concat(MICRO.map((el) => "Req_" + el)),
  Resultados: [
    "ID_Envio",
    "ID_PROD",
    "Lote",
    "Certificado",
    "Link_PDF_Resultado"
  ]
    .concat(ELEMENTS.map((el) => "Res_" + el))
    .concat(METALS.map((el) => "Res_" + el))
    .concat(MICRO.map((el) => "Res_" + el))
    .concat(["Fecha_Recepcion", "Estado_Validacion"]),
  Validacion: [
    "ID_Envio",
    "Producto",
    "Elemento",
    "Esperado",
    "Obtenido",
    "Diferencia_%",
    "Nivel_Alerta"
  ],
  Dashboard: ["Metrica", "Valor"]
};

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEET_NAMES).forEach((key) => {
    const name = SHEET_NAMES[key];
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    const headers = HEADERS[name];
    if (headers && sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
  });

  setupLaboratories();
  setupDashboard();
}

function setupLaboratories() {
  const sheet = getSheet_(SHEET_NAMES.LABS);
  if (sheet.getLastRow() > 1) {
    return;
  }
  sheet.appendRow([1, "LABORATORIO DOCTOR CALDERON LTDA.", "Avenida Carrera 20 N 87-81", "Bogota D.C.", "", ""]);
  sheet.appendRow([2, "LABORATORIO SECUNDARIO", "", "", "", ""]);
}

function setupDashboard() {
  const sheet = getSheet_(SHEET_NAMES.DASHBOARD);
  if (sheet.getLastRow() > 1) {
    return;
  }
  const metrics = [
    "Total Envios",
    "Pendientes",
    "Completos",
    "Parciales",
    "Con Alertas",
    "Envios Este Mes",
    "Promedio Dias Respuesta"
  ];
  metrics.forEach((metric) => sheet.appendRow([metric, ""]));
}
