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
