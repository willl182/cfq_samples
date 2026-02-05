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
