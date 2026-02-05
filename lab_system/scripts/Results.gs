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
