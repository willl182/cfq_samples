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
