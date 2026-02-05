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
