# Checklist de Implementacion

## Preparacion (Drive)

- [ ] Crear carpeta principal en Google Drive
- [ ] Crear subcarpetas: Solicitudes_Generadas, Resultados_Recibidos
- [ ] Guardar los CSV en Drive y anotar sus IDs

## Google Sheet

- [ ] Crear Google Sheet: "Sistema_Analisis_Lab"
- [ ] Abrir Extensions -> Apps Script
- [ ] Copiar todos los archivos de `lab_system/scripts/`
- [ ] Guardar el proyecto
- [ ] Ejecutar `setupSystem()`

## Importacion de datos

- [ ] Ejecutar `importProductsFromCsv(fileId)`
- [ ] Ejecutar `importResultsFromCsv(fileId)`
- [ ] Revisar filas y columnas en "Productos" y "Resultados"

## Plantilla y carpetas

- [ ] Crear Google Doc con el contenido de `lab_system/templates/solicitud_template.md`
- [ ] Ejecutar `setTemplateDocId(docId)`
- [ ] Ejecutar `setOutputFolderIds(docFolderId, pdfFolderId, resultsFolderId)`

## Prueba de flujo

- [ ] Crear un envio (menu -> Analisis Lab)
- [ ] Agregar al menos una muestra en "Detalle_Muestras"
- [ ] Generar solicitud (Doc)
- [ ] Generar PDF
- [ ] Enviar por email (si aplica)
- [ ] Registrar resultado en "Resultados"
- [ ] Verificar que el estado cambie a PARCIAL o COMPLETO
- [ ] Revisar hoja "Validacion"

## Alertas

- [ ] Ejecutar `createDailyTrigger()`
- [ ] Probar `checkPendingShipments()`

## Validacion final

- [ ] Dashboard muestra conteos correctos
- [ ] Links Doc y PDF guardados en "Envios"
- [ ] Estados actualizan correctamente
