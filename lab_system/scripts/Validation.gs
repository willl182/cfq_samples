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
