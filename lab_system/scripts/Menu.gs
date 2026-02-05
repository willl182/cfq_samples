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
