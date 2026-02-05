# Sistema de Gestion de Analisis de Laboratorio

Este proyecto contiene el codigo base en Google Apps Script para gestionar
envios a laboratorio, generar solicitudes (Doc y PDF), hacer seguimiento,
registrar resultados y validar diferencias vs composicion esperada.

## Contenido

- scripts/ (codigo de Apps Script en .gs)
- templates/ (plantillas en texto para convertir a Google Doc)
- data/ (CSV de productos y resultados, si deseas copiarlos aqui)

## Requisitos

- Google Drive
- Google Sheets
- Google Docs
- Google Apps Script

## Pasos de puesta en marcha

1. Crear un Google Sheet llamado "Sistema_Analisis_Lab".
2. Abrir Extensions -> Apps Script y crear el proyecto.
3. Copiar los archivos de `scripts/` dentro del proyecto de Apps Script.
4. Ejecutar la funcion `setupSystem()` una vez para crear hojas y encabezados.
5. Subir el CSV de productos a Drive y copiar su ID.
6. Ejecutar `importProductsFromCsv(fileId)`.
7. Subir el CSV de resultados historicos y ejecutar `importResultsFromCsv(fileId)`.
8. Crear una plantilla en Google Docs con el contenido de `templates/solicitud_template.md`.
9. Ejecutar `setTemplateDocId(docId)` y `setOutputFolderIds(docFolderId, pdfFolderId, resultsFolderId)`.
10. Volver al Sheet y usar el menu "Analisis Lab".

## Configuracion rapida

Puedes editar los valores por defecto en `scripts/Config.gs`:

- CIUDAD_ORIGEN: "San Pedro"
- DIAS_PENDIENTE_ALERTA: 10
- UMBRAL_VERDE: 1.5
- UMBRAL_ROJO: 5

## Nota sobre lectura de PDFs

Apps Script no extrae bien tablas de PDF sin OCR. Por ahora, el ingreso de
resultados es manual en la hoja "Resultados".
