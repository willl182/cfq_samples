# cfq_samples

Repositorio con el scaffold del sistema de gestion de analisis de laboratorio.

## Inicio rapido

1. Crear un Google Sheet llamado `Sistema_Analisis_Lab`.
2. Abrir Extensions -> Apps Script.
3. Pegar el contenido de `lab_system/scripts/ALL_IN_ONE.gs` en `Code.gs`.
4. Ejecutar `setupSystem()` y aceptar permisos.
5. Subir los CSV a Drive y ejecutar:
   - `importProductsFromCsv(fileId)`
   - `importResultsFromCsv(fileId)`

## Documentacion

- Plan: `plan_1.md`
- Checklist: `lab_system/CHECKLIST.md`
- Scripts: `lab_system/scripts/`
- Plantilla carta: `lab_system/templates/solicitud_template.md`
