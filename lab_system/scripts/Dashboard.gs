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
