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
  const map = {
    id: "",
    analisis: "",
    certificado: "Certificado",
    ot: "",
    tipo: "",
    producto: "",
    codigo: "ID_PROD",
    lote: "Lote",
    Fecha: "Fecha_Recepcion"
  };

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
