/*
  Archivo unico para pegar en Code.gs (Apps Script)
  Contiene: Config, Utils, Setup, Import, Shipments, Docs, Email,
  Alerts, Results, Validation, Dashboard, Menu
*/

/* Configuracion general */

const CONFIG_DEFAULTS = {
  CITY_ORIGIN: "San Pedro",
  PENDING_DAYS_ALERT: 10,
  THRESHOLD_GREEN: 1.5,
  THRESHOLD_RED: 5,
  TEMPLATE_DOC_ID: "",
  OUTPUT_DOCS_FOLDER_ID: "",
  OUTPUT_PDFS_FOLDER_ID: "",
  OUTPUT_RESULTS_FOLDER_ID: ""
};

const SHEET_NAMES = {
  PRODUCTS: "Productos",
  LABS: "Laboratorios",
  SHIPMENTS: "Envios",
  SAMPLES: "Detalle_Muestras",
  RESULTS: "Resultados",
  VALIDATION: "Validacion",
  DASHBOARD: "Dashboard"
};

const ELEMENTS = [
  "C",
  "N",
  "N-NH4",
  "N-NO3",
  "N-org",
  "N-ur",
  "P",
  "K",
  "CaO",
  "MgO",
  "S",
  "B",
  "Co",
  "Cu",
  "Fe",
  "Mn",
  "Mo",
  "SiO2",
  "Zn",
  "Na"
];

const METALS = [
  "arsenico",
  "cadmio",
  "cromo",
  "mercurio",
  "niquel",
  "plomo"
];

const MICRO = [
  "Enterobacterias",
  "salmonella",
  "coliformes totales",
  "helmintos"
];

const ELEMENT_GROUPS = {
  primarios: ["N", "P", "K"],
  secundarios: ["CaO", "MgO", "S"],
  menores: ["B", "Co", "Cu", "Fe", "Mn", "Mo", "SiO2", "Zn", "Na"],
  metales: METALS,
  micro: MICRO
};

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const config = Object.assign({}, CONFIG_DEFAULTS);
  Object.keys(CONFIG_DEFAULTS).forEach((key) => {
    const value = props.getProperty(key);
    if (value !== null && value !== "") {
      config[key] = isNaN(value) ? value : Number(value);
    }
  });
  return config;
}

function setConfigValue(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, String(value));
}

function setTemplateDocId(docId) {
  setConfigValue("TEMPLATE_DOC_ID", docId);
}

function setOutputFolderIds(docsFolderId, pdfsFolderId, resultsFolderId) {
  setConfigValue("OUTPUT_DOCS_FOLDER_ID", docsFolderId);
  setConfigValue("OUTPUT_PDFS_FOLDER_ID", pdfsFolderId);
  setConfigValue("OUTPUT_RESULTS_FOLDER_ID", resultsFolderId);
}

/* Utilidades */

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error("No existe la hoja: " + name);
  }
  return sheet;
}

function toNumber_(value) {
  if (value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  const cleaned = String(value).replace(/\./g, "").replace(/,/g, ".");
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function formatDate_(date) {
  if (!date) {
    return "";
  }
  const tz = Session.getScriptTimeZone();
  return Utilities.formatDate(date, tz, "dd 'de' MMMM 'de' yyyy");
}

function today_() {
  return new Date();
}

function getNextId_(sheetName, idColumnIndex) {
  const sheet = getSheet_(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return 1;
  }
  const values = sheet.getRange(2, idColumnIndex, lastRow - 1, 1).getValues();
  const ids = values.map((row) => Number(row[0])).filter((id) => !isNaN(id));
  return ids.length ? Math.max.apply(null, ids) + 1 : 1;
}

function mapHeaders_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    map[header] = index + 1;
  });
  return map;
}

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

/* Importacion de CSV desde Drive */

function importProductsFromCsv(fileId) {
  const data = loadCsv_(fileId);
  if (!data.length) {
    throw new Error("CSV vacio");
  }
  const sheet = getSheet_(SHEET_NAMES.PRODUCTS);
  sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearContent();
  const rows = data.slice(1).map((row) => normalizeProductRow_(row));
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function importResultsFromCsv(fileId) {
  const data = loadCsv_(fileId);
  if (!data.length) {
    throw new Error("CSV vacio");
  }
  const sheet = getSheet_(SHEET_NAMES.RESULTS);
  sheet.getRange(2, 1, sheet.getMaxRows(), sheet.getMaxColumns()).clearContent();
  const rows = data.slice(1).map((row) => normalizeResultRow_(row));
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function loadCsv_(fileId) {
  const file = DriveApp.getFileById(fileId);
  const content = file.getBlob().getDataAsString();
  return Utilities.parseCsv(content);
}

function normalizeProductRow_(row) {
  const header = HEADERS.Productos;
  const base = header.map(() => "");
  header.forEach((col, idx) => {
    const csvIndex = idx;
    if (csvIndex < row.length) {
      const value = row[csvIndex];
      if (ELEMENTS.indexOf(col) !== -1) {
        base[idx] = toNumber_(value);
      } else {
        base[idx] = value;
      }
    }
  });
  return base;
}

function normalizeResultRow_(row) {
  const header = HEADERS.Resultados;
  const base = header.map(() => "");
  header.forEach((col, idx) => {
    if (col === "ID_Envio") {
      base[idx] = "";
      return;
    }
    if (col === "ID_PROD") {
      base[idx] = row[6] || "";
      return;
    }
    if (col === "Lote") {
      base[idx] = row[7] || "";
      return;
    }
    if (col === "Certificado") {
      base[idx] = row[2] || "";
      return;
    }
    if (col === "Fecha_Recepcion") {
      base[idx] = row[8] || "";
      return;
    }
    if (col.startsWith("Res_")) {
      const key = col.replace("Res_", "");
      const csvIndex = csvIndexForResult_(key);
      if (csvIndex !== null) {
        base[idx] = toNumber_(row[csvIndex]);
      }
      return;
    }
    base[idx] = "";
  });
  return base;
}

function csvIndexForResult_(key) {
  const csvHeaders = [
    "id",
    "analisis",
    "certificado",
    "ot",
    "tipo",
    "producto",
    "codigo",
    "lote",
    "Fecha",
    "C",
    "N",
    "N-NH4",
    "N-NO3",
    "N-org",
    "N-ur",
    "P",
    "K",
    "CaO",
    "MgO",
    "S",
    "B",
    "Co",
    "Cu",
    "Fe",
    "Mn",
    "Mo",
    "SiO2",
    "Zn",
    "Na",
    "Enterobacterias",
    "salmonella",
    "coliformes totales",
    "helmintos",
    "mb5",
    "arsenico",
    "cadmio",
    "cromo",
    "mercurio",
    "niquel",
    "plomo"
  ];
  const idx = csvHeaders.indexOf(key);
  return idx === -1 ? null : idx;
}

/* Envios y muestras */

function createShipment(labId) {
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const id = getNextId_(SHEET_NAMES.SHIPMENTS, 1);
  const row = [
    id,
    today_(),
    "",
    labId,
    "BORRADOR",
    "",
    "",
    "",
    ""
  ];
  sheet.appendRow(row);
  return id;
}

function addSampleToShipment(idEnvio, idProd, lote) {
  const product = getProductById_(idProd);
  if (!product) {
    throw new Error("Producto no encontrado: " + idProd);
  }
  const sheet = getSheet_(SHEET_NAMES.SAMPLES);
  const row = [
    idEnvio,
    idProd,
    product.PRODUCTO,
    product.COD,
    lote
  ];

  const reqElements = getRequiredElements_(product);
  ELEMENTS.forEach((el) => row.push(reqElements[el] ? true : false));
  METALS.forEach((el) => row.push(reqElements[el] ? true : false));
  MICRO.forEach((el) => row.push(reqElements[el] ? true : false));

  sheet.appendRow(row);
}

function getSamplesForShipment_(idEnvio) {
  const sheet = getSheet_(SHEET_NAMES.SAMPLES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data
    .slice(1)
    .filter((row) => String(row[0]) === String(idEnvio))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

function getProductById_(idProd) {
  const sheet = getSheet_(SHEET_NAMES.PRODUCTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idProd)) {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = data[i][idx]));
      return obj;
    }
  }
  return null;
}

function getRequiredElements_(product) {
  const req = {};
  ELEMENTS.forEach((el) => {
    const value = toNumber_(product[el]);
    if (value !== null && value !== 0) {
      req[el] = true;
    }
  });
  return req;
}

/* Generacion de solicitudes */

function generateSolicitud(idEnvio) {
  const config = getConfig();
  if (!config.TEMPLATE_DOC_ID) {
    throw new Error("Configura TEMPLATE_DOC_ID con setTemplateDocId().");
  }
  const shipment = getShipment_(idEnvio);
  const lab = getLaboratory_(shipment.Laboratorio_ID);
  const samples = getSamplesForShipment_(idEnvio);
  if (!samples.length) {
    throw new Error("El envio no tiene muestras.");
  }

  const docTemplate = DriveApp.getFileById(config.TEMPLATE_DOC_ID);
  const docCopy = docTemplate.makeCopy(buildDocName_(shipment, samples), getOutputFolder_(config.OUTPUT_DOCS_FOLDER_ID));
  const doc = DocumentApp.openById(docCopy.getId());
  const body = doc.getBody();

  const replacements = {
    "{{CIUDAD}}": config.CITY_ORIGIN,
    "{{FECHA}}": formatDate_(today_()),
    "{{LABORATORIO}}": lab.Nombre,
    "{{DIRECCION}}": lab.Direccion,
    "{{CIUDAD_LAB}}": lab.Ciudad,
    "{{CANTIDAD}}": String(samples.length),
    "{{PRODUCTOS}}": buildProductsSection_(samples)
  };

  Object.keys(replacements).forEach((key) => body.replaceText(key, replacements[key]));

  doc.saveAndClose();

  updateShipmentLinks_(idEnvio, docCopy.getUrl(), "");
  return docCopy.getId();
}

function generatePdfForShipment(idEnvio) {
  const config = getConfig();
  const shipment = getShipment_(idEnvio);
  if (!shipment.Link_Doc) {
    throw new Error("El envio no tiene documento asociado.");
  }
  const docId = extractIdFromUrl_(shipment.Link_Doc);
  const docFile = DriveApp.getFileById(docId);
  const pdfBlob = docFile.getAs(MimeType.PDF);
  const pdfFolder = getOutputFolder_(config.OUTPUT_PDFS_FOLDER_ID);
  const pdfFile = pdfFolder.createFile(pdfBlob).setName(docFile.getName() + ".pdf");
  updateShipmentLinks_(idEnvio, shipment.Link_Doc, pdfFile.getUrl());
  return pdfFile.getId();
}

function buildProductsSection_(samples) {
  return samples
    .map((sample) => {
      const req = buildRequirementsFromSample_(sample);
      const grouped = groupElements_(req);
      const lines = [];
      const header = sample.Producto + " - Lote: " + sample.Lote + ": Parametros a analizar";
      lines.push(header);
      if (grouped.primarios.length) {
        lines.push("Primarios: " + grouped.primarios.join(", ") + ".");
      }
      if (grouped.secundarios.length) {
        lines.push("Secundarios: " + grouped.secundarios.join(", ") + ".");
      }
      if (grouped.menores.length) {
        lines.push("Menores: " + grouped.menores.join(", ") + ".");
      }
      if (grouped.metales.length) {
        lines.push("Metales pesados: " + grouped.metales.join(", ") + ".");
      }
      if (grouped.micro.length) {
        lines.push("Microbiologicos: " + grouped.micro.join(", ") + ".");
      }
      return lines.join("\n");
    })
    .join("\n\n");
}

function groupElements_(reqMap) {
  const groups = {
    primarios: [],
    secundarios: [],
    menores: [],
    metales: [],
    micro: []
  };
  ELEMENT_GROUPS.primarios.forEach((el) => {
    if (reqMap[el]) groups.primarios.push(labelForElement_(el));
  });
  ELEMENT_GROUPS.secundarios.forEach((el) => {
    if (reqMap[el]) groups.secundarios.push(labelForElement_(el));
  });
  ELEMENT_GROUPS.menores.forEach((el) => {
    if (reqMap[el]) groups.menores.push(labelForElement_(el));
  });
  ELEMENT_GROUPS.metales.forEach((el) => {
    if (reqMap[el]) groups.metales.push(labelForElement_(el));
  });
  ELEMENT_GROUPS.micro.forEach((el) => {
    if (reqMap[el]) groups.micro.push(labelForElement_(el));
  });
  return groups;
}

function labelForElement_(el) {
  const labels = {
    C: "Carbono",
    N: "Nitrogeno Total",
    "N-NH4": "Nitrogeno Amoniacal",
    "N-NO3": "Nitrogeno Nitrico",
    "N-org": "Nitrogeno Organico",
    "N-ur": "Nitrogeno Ureico",
    P: "Fosforo Total",
    K: "Potasio Total",
    CaO: "Calcio Total",
    MgO: "Magnesio Total",
    S: "Azufre total",
    B: "Boro",
    Co: "Cobalto",
    Cu: "Cobre",
    Fe: "Hierro",
    Mn: "Manganeso",
    Mo: "Molibdeno",
    SiO2: "Silicio",
    Zn: "Zinc",
    Na: "Sodio",
    arsenico: "Arsenico",
    cadmio: "Cadmio",
    cromo: "Cromo",
    mercurio: "Mercurio",
    niquel: "Niquel",
    plomo: "Plomo",
    Enterobacterias: "Enterobacterias",
    salmonella: "Salmonella",
    "coliformes totales": "Coliformes totales",
    helmintos: "Helmintos"
  };
  return labels[el] || el;
}

function buildRequirementsFromSample_(sample) {
  const req = {};
  Object.keys(sample).forEach((key) => {
    if (key.startsWith("Req_")) {
      const element = key.replace("Req_", "");
      req[element] = Boolean(sample[key]);
    }
  });
  return req;
}

function buildDocName_(shipment, samples) {
  const date = Utilities.formatDate(today_(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  return "Solicitud_" + date + "_" + shipment.ID_Envio + "_" + samples.length + "_muestras";
}

function updateShipmentLinks_(idEnvio, docUrl, pdfUrl) {
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      if (docUrl) sheet.getRange(i + 1, map.Link_Doc).setValue(docUrl);
      if (pdfUrl) sheet.getRange(i + 1, map.Link_PDF).setValue(pdfUrl);
      return;
    }
  }
}

function getShipment_(idEnvio) {
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = data[i][idx]));
      return obj;
    }
  }
  throw new Error("Envio no encontrado: " + idEnvio);
}

function getLaboratory_(labId) {
  const sheet = getSheet_(SHEET_NAMES.LABS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(labId)) {
      const obj = {};
      headers.forEach((h, idx) => (obj[h] = data[i][idx]));
      return obj;
    }
  }
  throw new Error("Laboratorio no encontrado: " + labId);
}

function getOutputFolder_(folderId) {
  if (!folderId) {
    return DriveApp.getRootFolder();
  }
  return DriveApp.getFolderById(folderId);
}

function extractIdFromUrl_(url) {
  const match = String(url).match(/[-\w]{25,}/);
  return match ? match[0] : url;
}

/* Envio de emails */

function sendShipmentEmail(idEnvio) {
  const shipment = getShipment_(idEnvio);
  const lab = getLaboratory_(shipment.Laboratorio_ID);
  if (!lab.Email) {
    throw new Error("Laboratorio sin email configurado.");
  }
  if (!shipment.Link_PDF) {
    throw new Error("El envio no tiene PDF asociado.");
  }
  const pdfId = extractIdFromUrl_(shipment.Link_PDF);
  const pdfFile = DriveApp.getFileById(pdfId);
  const subject = "Solicitud de analisis - Envio " + shipment.ID_Envio;
  const body = "Cordial saludo,\n\nAdjunto encontrara la solicitud de analisis correspondiente al envio " +
    shipment.ID_Envio + ".\n\nGracias.";

  GmailApp.sendEmail(lab.Email, subject, body, {
    attachments: [pdfFile.getAs(MimeType.PDF)]
  });

  markShipmentAsSent_(idEnvio);
}

function markShipmentAsSent_(idEnvio) {
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      sheet.getRange(i + 1, map.Estado).setValue("ENVIADO");
      sheet.getRange(i + 1, map.Fecha_Envio).setValue(today_());
      return;
    }
  }
}

/* Seguimiento de pendientes y alertas */

function updatePendingDays() {
  const config = getConfig();
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const estado = data[i][map.Estado - 1];
    const fechaEnvio = data[i][map.Fecha_Envio - 1];
    if (estado === "ENVIADO" && fechaEnvio) {
      const days = Math.floor((today_() - new Date(fechaEnvio)) / (1000 * 60 * 60 * 24));
      sheet.getRange(i + 1, map.Dias_Sin_Respuesta).setValue(days);
      sheet.getRange(i + 1, map.Alerta).setValue(days > config.PENDING_DAYS_ALERT);
    }
  }
}

function checkPendingShipments() {
  const config = getConfig();
  updatePendingDays();
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  const pending = [];
  for (let i = 1; i < data.length; i++) {
    const estado = data[i][map.Estado - 1];
    const days = Number(data[i][map.Dias_Sin_Respuesta - 1]);
    if (estado === "ENVIADO" && days > config.PENDING_DAYS_ALERT) {
      pending.push({
        id: data[i][0],
        days
      });
    }
  }
  if (pending.length) {
    sendPendingAlert_(pending);
  }
  updateDashboard();
}

function sendPendingAlert_(pending) {
  const subject = "Envios pendientes de resultados";
  const lines = ["Tienes los siguientes envios sin resultado:", ""]; 
  pending.forEach((item) => {
    lines.push("- Envio #" + item.id + " - " + item.days + " dias sin respuesta");
  });
  const body = lines.join("\n");
  MailApp.sendEmail(Session.getActiveUser().getEmail(), subject, body);
}

function createDailyTrigger() {
  ScriptApp.newTrigger("checkPendingShipments")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

/* Registro de resultados */

function registerResult(result) {
  const sheet = getSheet_(SHEET_NAMES.RESULTS);
  const row = [
    result.ID_Envio || "",
    result.ID_PROD || "",
    result.Lote || "",
    result.Certificado || "",
    result.Link_PDF_Resultado || ""
  ];

  ELEMENTS.forEach((el) => row.push(result["Res_" + el] || ""));
  METALS.forEach((el) => row.push(result["Res_" + el] || ""));
  MICRO.forEach((el) => row.push(result["Res_" + el] || ""));
  row.push(result.Fecha_Recepcion || today_());
  row.push("");

  sheet.appendRow(row);

  verifyCompletenessAndStatus_(result.ID_Envio);
  validateResults_(result.ID_Envio);
}

function linkResultPdf(idEnvio, pdfUrl) {
  const sheet = getSheet_(SHEET_NAMES.RESULTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      sheet.getRange(i + 1, map.Link_PDF_Resultado).setValue(pdfUrl);
    }
  }
}

function verifyCompletenessAndStatus_(idEnvio) {
  const samples = getSamplesForShipment_(idEnvio);
  const results = getResultsForShipment_(idEnvio);
  if (!samples.length || !results.length) {
    return;
  }

  const required = buildRequiredMapForShipment_(samples);
  const received = buildReceivedMapForShipment_(results);

  const missing = Object.keys(required).some((key) => required[key] && !received[key]);
  const status = missing ? "PARCIAL" : "COMPLETO";
  updateShipmentStatus_(idEnvio, status);
}

function buildRequiredMapForShipment_(samples) {
  const required = {};
  samples.forEach((sample) => {
    Object.keys(sample).forEach((key) => {
      if (key.startsWith("Req_")) {
        const element = key.replace("Req_", "");
        if (sample[key]) {
          required[element] = true;
        }
      }
    });
  });
  return required;
}

function buildReceivedMapForShipment_(results) {
  const received = {};
  results.forEach((res) => {
    Object.keys(res).forEach((key) => {
      if (key.startsWith("Res_")) {
        const element = key.replace("Res_", "");
        if (res[key] !== "" && res[key] !== null) {
          received[element] = true;
        }
      }
    });
  });
  return received;
}

function updateShipmentStatus_(idEnvio, status) {
  const sheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      sheet.getRange(i + 1, map.Estado).setValue(status);
      return;
    }
  }
}

function getResultsForShipment_(idEnvio) {
  const sheet = getSheet_(SHEET_NAMES.RESULTS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data
    .slice(1)
    .filter((row) => String(row[0]) === String(idEnvio))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = row[i]));
      return obj;
    });
}

/* Validacion de resultados */

function validateResults_(idEnvio) {
  const config = getConfig();
  const samples = getSamplesForShipment_(idEnvio);
  const results = getResultsForShipment_(idEnvio);
  if (!samples.length || !results.length) {
    return;
  }

  const validationSheet = getSheet_(SHEET_NAMES.VALIDATION);
  const rows = [];

  results.forEach((result) => {
    const product = getProductById_(result.ID_PROD);
    if (!product) {
      return;
    }
    ELEMENTS.forEach((el) => {
      const expected = toNumber_(product[el]);
      const obtained = toNumber_(result["Res_" + el]);
      if (expected === null || obtained === null) {
        return;
      }
      const diff = Math.abs(expected - obtained) / expected * 100;
      const level = getAlertLevel_(diff, config);
      rows.push([idEnvio, product.PRODUCTO, el, expected, obtained, diff, level]);
    });
  });

  if (rows.length) {
    validationSheet.getRange(validationSheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  updateResultValidationStatus_(idEnvio, rows, config);
}

function getAlertLevel_(diff, config) {
  if (diff <= config.THRESHOLD_GREEN) {
    return "VERDE";
  }
  if (diff <= config.THRESHOLD_RED) {
    return "AMARILLO";
  }
  return "ROJO";
}

function updateResultValidationStatus_(idEnvio, rows, config) {
  const sheet = getSheet_(SHEET_NAMES.RESULTS);
  const map = mapHeaders_(sheet);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(idEnvio)) {
      const hasRed = rows.some((row) => row[6] === "ROJO");
      const hasYellow = rows.some((row) => row[6] === "AMARILLO");
      let status = "OK";
      if (hasRed || hasYellow) {
        status = "ALERTA";
      }
      sheet.getRange(i + 1, map.Estado_Validacion).setValue(status);
    }
  }
}

/* Dashboard */

function updateDashboard() {
  const shipmentsSheet = getSheet_(SHEET_NAMES.SHIPMENTS);
  const resultsSheet = getSheet_(SHEET_NAMES.RESULTS);
  const dashboardSheet = getSheet_(SHEET_NAMES.DASHBOARD);

  const shipments = shipmentsSheet.getDataRange().getValues();
  const results = resultsSheet.getDataRange().getValues();

  const estadoIdx = shipments[0].indexOf("Estado");
  const fechaIdx = shipments[0].indexOf("Fecha_Creacion");

  const totalEnvios = shipments.length - 1;
  let pendientes = 0;
  let completos = 0;
  let parciales = 0;
  let enviosMes = 0;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  shipments.slice(1).forEach((row) => {
    const estado = row[estadoIdx];
    if (estado === "ENVIADO") pendientes++;
    if (estado === "COMPLETO") completos++;
    if (estado === "PARCIAL") parciales++;
    const fecha = row[fechaIdx];
    if (fecha instanceof Date && fecha.getMonth() === month && fecha.getFullYear() === year) {
      enviosMes++;
    }
  });

  const statusIdx = results[0].indexOf("Estado_Validacion");
  const conAlertas = results.slice(1).filter((row) => row[statusIdx] === "ALERTA").length;

  const metricMap = {
    "Total Envios": totalEnvios,
    "Pendientes": pendientes,
    "Completos": completos,
    "Parciales": parciales,
    "Con Alertas": conAlertas,
    "Envios Este Mes": enviosMes,
    "Promedio Dias Respuesta": ""
  };

  const data = dashboardSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const metric = data[i][0];
    if (metricMap.hasOwnProperty(metric)) {
      dashboardSheet.getRange(i + 1, 2).setValue(metricMap[metric]);
    }
  }
}

/* Menu personalizado */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Analisis Lab")
    .addItem("Configurar sistema", "setupSystem")
    .addSeparator()
    .addItem("Generar solicitud", "promptGenerateSolicitud")
    .addItem("Generar PDF", "promptGeneratePdf")
    .addItem("Enviar por email", "promptSendShipment")
    .addSeparator()
    .addItem("Verificar pendientes", "checkPendingShipments")
    .addItem("Actualizar dashboard", "updateDashboard")
    .addSeparator()
    .addItem("Crear trigger diario", "createDailyTrigger")
    .addToUi();
}

function promptGenerateSolicitud() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt("ID de envio", "Ingrese el ID de envio", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  const id = response.getResponseText();
  generateSolicitud(id);
}

function promptGeneratePdf() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt("ID de envio", "Ingrese el ID de envio", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  const id = response.getResponseText();
  generatePdfForShipment(id);
}

function promptSendShipment() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt("ID de envio", "Ingrese el ID de envio", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }
  const id = response.getResponseText();
  sendShipmentEmail(id);
}
