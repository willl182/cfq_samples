# AGENTS.md

This repository is a Google Apps Script scaffold for a lab analysis workflow.
There is no traditional build/test toolchain (no npm, pytest, etc.).

Use this file as the operational guide for agentic coding in this repo.

## 1. Build / Lint / Test Commands

There are no automated build, lint, or unit test commands in this repo.

When changes are made, validate manually in Google Sheets + Apps Script:

- Paste `lab_system/scripts/ALL_IN_ONE.gs` into Apps Script (Code.gs)
- Run `setupSystem()` to create sheets
- Run CSV imports with:
  - `importProductsFromCsv(fileId)`
  - `importResultsFromCsv(fileId)`
- Run menu actions in the Sheet: "Analisis Lab"
- Generate a Doc and PDF with:
  - `generateSolicitud(idEnvio)`
  - `generatePdfForShipment(idEnvio)`

Single-test equivalent:

- There is no single-test runner. Instead, run one function manually in Apps Script.
- Recommended minimal checks after changes:
  1. `setupSystem()`
  2. `importProductsFromCsv(fileId)`
  3. `createShipment(labId)` + `addSampleToShipment(idEnvio, idProd, lote)`
  4. `generateSolicitud(idEnvio)`

## 2. Code Style Guidelines

### Language and Runtime

- JavaScript for Google Apps Script (V8 runtime).
- Avoid modern Node-only APIs.
- Use Apps Script services: SpreadsheetApp, DriveApp, DocumentApp, etc.

### File Structure

- Primary source files live in `lab_system/scripts/`.
- `ALL_IN_ONE.gs` is the canonical single-file version for copying into Apps Script.
- Keep `ALL_IN_ONE.gs` in sync with modular files.

### Formatting

- Two-space indentation.
- Double quotes for strings.
- Semicolons at line ends.
- Keep lines under ~100 characters when possible.

### Naming Conventions

- Functions: lowerCamelCase (e.g., `generateSolicitud`).
- Private helpers: suffix underscore (e.g., `getSheet_`).
- Constants: UPPER_SNAKE_CASE (e.g., `CONFIG_DEFAULTS`).
- Sheet names use Title Case with underscores where needed (e.g., `Detalle_Muestras`).

### Imports

- No module system. Apps Script uses global scope.
- Keep constants and helpers defined before use when possible.

### Error Handling

- Throw explicit errors for missing configuration or invalid input.
- Use guard clauses early (e.g., missing Doc ID, missing samples).
- Keep error messages user-friendly and in Spanish to match the UI.

### Data Handling

- Treat empty strings and null as "missing" values.
- Convert numeric strings with comma decimal using `toNumber_()`.
- Use `mapHeaders_()` to locate columns by name.
- Prefer bulk reads/writes for performance.

### Sheets and Headers

- Do not rename headers without updating `HEADERS`.
- New columns should be appended to preserve indexes.
- Use `setupSystem()` to initialize structure only once.

### Metales y Microbiologicos

- Metales and microbiologicos are handled by group selection.
- Activating the group implies all elements/organisms are requested.
- For results, record all of them even if some are empty.

### Document Generation

- The template uses placeholders: {{CIUDAD}}, {{FECHA}}, {{LABORATORIO}}, etc.
- `generateSolicitud()` replaces placeholders with actual values.
- The generated Doc and PDF links are stored in the `Envios` sheet.

### Email Sending

- `sendShipmentEmail()` uses GmailApp and requires `Link_PDF`.
- Ensure the lab email is configured in `Laboratorios`.

### Alerts

- Pending alerts are based on `PENDING_DAYS_ALERT` (default 10 days).
- `createDailyTrigger()` sets a daily trigger at 8 AM.

### Validation Rules

- Green: <= 1.5% difference
- Yellow: > 1.5% and <= 5%
- Red: > 5%

### Localization

- User-facing text should stay in Spanish.
- Use ASCII characters by default; avoid accents in code/filenames.

## Repository Files

- `plan_1.md` — full implementation plan and process
- `lab_system/CHECKLIST.md` — setup checklist
- `lab_system/templates/solicitud_template.md` — Doc template text
- `lab_system/scripts/ALL_IN_ONE.gs` — paste into Apps Script

## Cursor / Copilot Rules

- No .cursor/rules or .cursorrules found.
- No .github/copilot-instructions.md found.
