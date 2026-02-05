/* Configuracion general */

const CONFIG_DEFAULTS = {
  CITY_ORIGIN: "San Pedro",
  PENDING_DAYS_ALERT: 10,
  THRESHOLD_GREEN: 1.5,
  THRESHOLD_RED: 5,
  TEMPLATE_DOC_ID: "",
  OUTPUT_DOCS_FOLDER_ID: "",
  OUTPUT_PDFS_FOLDER_ID: "",
  OUTPUT_RESULTS_FOLDER_ID: ""
};

const SHEET_NAMES = {
  PRODUCTS: "Productos",
  LABS: "Laboratorios",
  SHIPMENTS: "Envios",
  SAMPLES: "Detalle_Muestras",
  RESULTS: "Resultados",
  VALIDATION: "Validacion",
  DASHBOARD: "Dashboard"
};

const ELEMENTS = [
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
  "Na"
];

const METALS = [
  "arsenico",
  "cadmio",
  "cromo",
  "mercurio",
  "niquel",
  "plomo"
];

const MICRO = [
  "Enterobacterias",
  "salmonella",
  "coliformes totales",
  "helmintos"
];

const ELEMENT_GROUPS = {
  primarios: ["N", "P", "K"],
  secundarios: ["CaO", "MgO", "S"],
  menores: ["B", "Co", "Cu", "Fe", "Mn", "Mo", "SiO2", "Zn", "Na"],
  metales: METALS,
  micro: MICRO
};

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  const config = Object.assign({}, CONFIG_DEFAULTS);
  Object.keys(CONFIG_DEFAULTS).forEach((key) => {
    const value = props.getProperty(key);
    if (value !== null && value !== "") {
      config[key] = isNaN(value) ? value : Number(value);
    }
  });
  return config;
}

function setConfigValue(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, String(value));
}

function setTemplateDocId(docId) {
  setConfigValue("TEMPLATE_DOC_ID", docId);
}

function setOutputFolderIds(docsFolderId, pdfsFolderId, resultsFolderId) {
  setConfigValue("OUTPUT_DOCS_FOLDER_ID", docsFolderId);
  setConfigValue("OUTPUT_PDFS_FOLDER_ID", pdfsFolderId);
  setConfigValue("OUTPUT_RESULTS_FOLDER_ID", resultsFolderId);
}
