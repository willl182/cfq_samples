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
