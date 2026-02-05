# Plan de Implementación: Sistema de Gestión de Análisis de Laboratorio

## Resumen Ejecutivo

Sistema para gestionar el ciclo completo de envío de muestras a laboratorios, desde la solicitud hasta la recepción y validación de resultados. Basado en Google Apps Script para fácil transferibilidad y uso compartido.

---

## Objetivos

1. **Centralizar información**: Productos, composiciones, envíos y resultados
2. **Automatizar generación de cartas**: A partir de datos registrados
3. **Seguimiento de envíos**: Control de pendientes y alertas
4. **Validación de resultados**: Comparación vs composición esperada
5. **Historial completo**: Importar datos existentes y mantener registro continuo

---

## Escala del Sistema

| Elemento | Cantidad |
|----------|----------|
| Productos terminados | ~200 |
| Materias primas | ~20 |
| Laboratorios | 2 (1 principal) |
| Envíos por semana | ~1 |
| Resultados históricos | ~80 |

---

## Estructura de Archivos y Carpetas

```
📁 Google Drive
│
├── 📊 Sistema_Análisis_Lab (Google Sheets)
│   ├── 📋 Productos
│   ├── 📋 Laboratorios
│   ├── 📋 Envíos
│   ├── 📋 Detalle_Muestras
│   ├── 📋 Resultados
│   ├── 📋 Validación
│   └── 📋 Dashboard
│
├── 📄 Plantilla_Solicitud (Google Doc)
│
├── 📁 Solicitudes_Generadas/
│   └── (Cartas en Doc y PDF)
│
└── 📁 Resultados_Recibidos/
    └── (PDFs de laboratorio)
```

---

## Estructura del Google Sheet

### Hoja: Productos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID_PROD | Texto | Identificador único |
| COD | Texto | Código del producto |
| PRODUCTO | Texto | Nombre del producto |
| CLASE | Texto | PT (producto) o MP (materia prima) |
| PROVEEDOR | Texto | Proveedor |
| C, N, P, K | Número | Porcentajes |
| N-NH4, N-NO3, N-org, N-ur | Número | Formas de N |
| CaO, MgO, S | Número | Elementos secundarios |
| B, Co, Cu, Fe, Mn, Mo, SiO2, Zn, Na | Número | Elementos menores |
| COMP1-10 | Texto | Campos adicionales |

**Regla:** Elemento aplica si tiene valor numérico (>0)

---

### Hoja: Laboratorios

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID | Número | Identificador |
| Nombre | Texto | Nombre del laboratorio |
| Dirección | Texto | Dirección física |
| Ciudad | Texto | Ciudad |
| Email | Texto | Email de contacto |
| Contacto | Texto | Nombre de contacto |

**Registros iniciales:**
- 1: Doctor Calderón Ltda (principal)
- 2: Laboratorio secundario

---

### Hoja: Envíos

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID_Envío | Número | Autonumérico |
| Fecha_Creación | Fecha | Fecha de registro |
| Fecha_Envío | Fecha | Fecha de envío |
| Laboratorio_ID | Número | FK a Laboratorios |
| Estado | Texto | BORRADOR, ENVIADO, PARCIAL, COMPLETO |
| Link_Doc | URL | Google Doc de solicitud |
| Link_PDF | URL | PDF de solicitud |
| Días_Sin_Respuesta | Número | Calculado |
| Alerta | Booleano | TRUE si >10 días pendiente |

---

### Hoja: Detalle_Muestras

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID_Envío | Número | FK a Envíos |
| ID_PROD | Texto | FK a Productos |
| Producto | Texto | Nombre del producto |
| Código | Texto | Código |
| Lote | Texto | Número de lote |
| Req_N, Req_P, Req_K | Booleano | Elementos requeridos |
| Req_CaO, Req_MgO, Req_S | Booleano | Secundarios |
| Req_B, Req_Cu, ... | Booleano | Menores |
| Req_arsenico, Req_cadmio, ... | Booleano | Metales pesados (todos si se activa el grupo) |
| Req_Enterobacterias, Req_salmonella, ... | Booleano | Microbiológicos (todos si se activa el grupo) |

---

### Hoja: Resultados

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID_Envío | Número | FK a Envíos |
| ID_PROD | Texto | FK a Productos |
| Lote | Texto | Número de lote |
| Certificado | Texto | Número de certificado del lab |
| Link_PDF_Resultado | URL | PDF de resultados |
| Res_N, Res_P, Res_K | Número | Valores obtenidos |
| Res_CaO, Res_MgO, ... | Número | Secundarios obtenidos |
| Res_B, Res_Cu, ... | Número | Menores obtenidos |
| Res_arsenico, Res_cadmio, ... | Número/Texto | Metales pesados (se registran todos) |
| Res_Enterobacterias, Res_salmonella, ... | Número/Texto | Microbiológicos (se registran todos) |
| Fecha_Recepción | Fecha | Fecha de recepción |
| Estado_Validación | Texto | OK, ALERTA, ERROR |

---

### Hoja: Validación

| Columna | Tipo | Descripción |
|---------|------|-------------|
| ID_Envío | Número | FK a Envíos |
| Producto | Texto | Nombre del producto |
| Elemento | Texto | Nombre del elemento |
| Esperado | Número | Valor en hoja Productos |
| Obtenido | Número | Valor en resultados |
| Diferencia_% | Número | (|E-O|/E)*100 |
| Nivel_Alerta | Texto | VERDE, AMARILLO, ROJO |

**Reglas de alerta:**
- Diferencia <= 1.5% → VERDE (OK)
- Diferencia > 1.5% y <= 5% → AMARILLO (revisar)
- Diferencia > 5% → ROJO (fuera de especificación)

---

### Hoja: Dashboard

| Métrica | Fórmula |
|---------|---------|
| Total Envíos | COUNTA(Envíos[ID_Envío]) |
| Pendientes | COUNTIF(Envíos[Estado], "ENVIADO") |
| Completos | COUNTIF(Envíos[Estado], "COMPLETO") |
| Parciales | COUNTIF(Envíos[Estado], "PARCIAL") |
| Con Alertas | COUNTIF(Resultados[Estado_Validación], "ALERTA") |
| Envíos este mes | COUNTIF(Envíos[Fecha_Creación], MES=HOY) |
| Promedio días respuesta | AVERAGE(Envíos completos) |

---

## Plantilla de Carta

```markdown
{{CIUDAD}}, {{FECHA}}

Señores
{{LABORATORIO}}
{{DIRECCION}}
{{CIUDAD_LAB}}

Referencia: Solicitud de análisis físico químico

Cordial saludo,

De la manera más atenta, le estamos solicitando a ustedes el análisis 
Físico Químico de las {{CANTIDAD}} muestras que estamos enviando con 
la presente solicitud. Los parámetros a realizar son:

{{PRODUCTOS}}

Agradeciendo de antemano la atención prestada,

Cordialmente,

WILSON R SALAS
DIRECCION TÉCNICA LABORATORIO
CALFERQUIM SAS
```

### Formato de Productos en Carta

Para cada producto:

```markdown
**{{PRODUCTO}} – Lote: {{LOTE}} – {{TIPO}}:**
**Primarios:** Nitrógeno Total, Fósforo Total, Potasio Total.
**Secundarios:** Calcio Total, Magnesio Total, Azufre total.
**Menores:** (lista de menores presentes)
**Metales Pesados:** (si se activa, se solicitan todos)
**Microbiológicos:** (si se activa, se solicitan todos)
```

---

## Flujo de Trabajo

```
┌─────────────────────────────────────────────────────────────────┐
│  1. REGISTRAR ENVÍO                                             │
│     → Sidebar "Nuevo Envío"                                     │
│     → Seleccionar productos de lista desplegable               │
│     → Ingresar lotes                                            │
│     → Sistema autocompleta elementos según composición          │
│     → Metales y micro: se chulean por grupo, solicita todos     │
│     → Estado inicial: "BORRADOR"                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. GENERAR CARTA                                               │
│     → Menú: Análisis Lab → Generar Solicitud                    │
│     → Crea Google Doc desde plantilla                           │
│     → Reemplaza marcadores con datos del envío                  │
│     → Usuario puede editar si es necesario                      │
│     → Botón: Generar PDF                                        │
│     → Ambos se guardan en carpeta Solicitudes_Generadas         │
│     → Links se guardan en hoja Envíos                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. ENVIAR                                                       │
│     → Menú: Análisis Lab → Enviar por Email                      │
│     → Envía PDF al laboratorio                                   │
│     → Estado cambia a "ENVIADO"                                  │
│     → Se registra fecha de envío                                │
│     → Inicia contador de días                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. SEGUIMIENTO AUTOMÁTICO                                       │
│     → Trigger diario: verificarPendientes()                    │
│     → Busca envíos >10 días sin resultado                       │
│     → Marca columna Alerta = TRUE                                │
│     → Envía email de notificación                               │
│     → Actualiza Dashboard                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. RECIBIR RESULTADOS                                          │
│     → Menú: Análisis Lab → Registrar Resultados                  │
│     → Sube PDF a carpeta Resultados_Recibidos                   │
│     → Ingresa número de certificado                             │
│     → Vincula al envío correspondiente                          │
│     → Sistema lee PDF o usuario ingresa valores                 │
│     → Verifica completitud de elementos                         │
│     → Si faltan → Estado "PARCIAL"                              │
│     → Si todo OK → Estado "COMPLETO"                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. VALIDACIÓN                                                   │
│     → Comparación automática: esperado vs obtenido              │
│     → Calcula % de diferencia                                   │
│     → Si diferencia > 1.5% → Alerta AMARILLO                    │
│     → Si diferencia > 5% → Alerta ROJO                          │
│     → Genera reporte en hoja Validación                         │
│     → Marca resultados con discrepancias                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estados del Sistema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   BORRADOR   │ ──▶ │   ENVIADO    │ ──▶ │   PARCIAL    │
│  (creando)   │     │ (esperando)  │     │ (incompleto) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                            │                     │
                            │                     ▼
                            │              ┌──────────────┐
                            └─────────────▶│   COMPLETO   │
                                           │  (cerrado)   │
                                           └──────────────┘
```

**Condiciones de cambio de estado:**
- BORRADOR → ENVIADO: Al enviar por email
- ENVIADO → PARCIAL: Al recibir resultados incompletos
- ENVIADO → COMPLETO: Al recibir todos los resultados
- PARCIAL → COMPLETO: Al recibir resultados faltantes

---

## Agrupación de Elementos

### Primarios (NPK)
- Nitrógeno Total
- Fósforo Total
- Potasio Total

### Secundarios
- Calcio Total (CaO)
- Magnesio Total (MgO)
- Azufre total (S)

### Menores
- Boro (B)
- Cobre (Cu)
- Hierro (Fe)
- Manganeso (Mn)
- Molibdeno (Mo)
- Zinc (Zn)
- Silicio (SiO2)
- Sodio (Na)
- Cobalto (Co)

### Metales Pesados
- Arsénico (As)
- Cadmio (Cd)
- Cromo (Cr)
- Mercurio (Hg)
- Níquel (Ni)
- Plomo (Pb)

### Microbiológicos
- Enterobacterias
- Salmonella
- Coliformes totales
- Helmintos

---

## Reglas de Validación

### Tolerancias

| Elemento | Umbral Verde | Umbral Amarillo | Umbral Rojo |
|----------|--------------|-----------------|-------------|
| Todos | ≤1.5% | 1.5% - 5% | >5% |

### Cálculo de Diferencia

```
Diferencia_% = |Esperado - Obtenido| / Esperado × 100
```

### Niveles de Alerta

| Diferencia | Nivel | Acción |
|------------|-------|--------|
| ≤1.5% | VERDE | Sin acción |
| >1.5% y ≤5% | AMARILLO | Revisar manualmente |
| >5% | ROJO | Alerta crítica, investigar |

---

## Alertas y Notificaciones

### Alerta de Pendientes

**Trigger:** Diario a las 8:00 AM

**Condición:** Envío en estado "ENVIADO" con más de 10 días desde Fecha_Envío

**Acciones:**
1. Marcar columna `Alerta = TRUE` en hoja Envíos
2. Enviar email con detalle de envíos pendientes
3. Actualizar Dashboard con conteo de alertas

**Formato de email:**
```
Asunto: ⚠️ Envíos Pendientes de Resultados

Tienes los siguientes envíos sin resultado hace más de 10 días:

• Envío #123 - 3 muestras - Enviado hace 12 días
• Envío #124 - 1 muestra - Enviado hace 15 días

Por favor verifica el estado con el laboratorio.
```

### Alerta de Validación

**Trigger:** Al registrar resultados

**Condición:** Diferencia > 1.5% en cualquier elemento

**Acciones:**
1. Marcar `Estado_Validación = "ALERTA"` en Resultados
2. Crear registro en hoja Validación
3. Destacar fila en Dashboard

---

## Menú Principal

```
📊 Análisis Lab
├── ➕ Nuevo Envío
│   └── Abre sidebar para registrar envío
├── 📄 Generar Solicitud
│   └── Crea Google Doc y PDF del envío seleccionado
├── 📧 Enviar por Email
│   └── Envía solicitud al laboratorio
├── ────────────────────────
├── ✅ Registrar Resultados
│   └── Abre formulario para ingresar resultados
├── 🔍 Verificar Pendientes
│   └── Ejecuta verificación manual de envíos
├── 📋 Ver Dashboard
│   └── Muestra resumen visual
├── ────────────────────────
└── ⚙️ Configuración
    ├── Agregar Laboratorio
    ├── Importar Productos
    └── Limpiar Datos
```

---

## Fases de Implementación

### FASE 1: Configuración Base (1 sesión)

**Objetivo:** Crear estructura inicial y cargar datos históricos

**Tareas:**

| # | Tarea | Entregable |
|---|-------|------------|
| 1.1 | Crear carpeta en Google Drive | Estructura de carpetas |
| 1.2 | Crear Google Sheet con 7 hojas | Sheet vacío con encabezados |
| 1.3 | Importar CSV de productos | ~200 productos con elementos |
| 1.4 | Importar CSV de resultados históricos | ~80 registros |
| 1.5 | Crear hoja Laboratorios con 2 registros | Laboratorios configurados |
| 1.6 | Configurar formatos de celdas | Fechas, números, validaciones |
| 1.7 | Crear validación de datos | Listas desplegables en columnas clave |

**Validación:**
- Todas las hojas existen
- Productos importados correctamente
- Resultados históricos importados
- Formatos aplicados

---

### FASE 2: Plantilla de Carta (1 sesión)

**Objetivo:** Crear documento base para generación de solicitudes

**Tareas:**

| # | Tarea | Entregable |
|---|-------|------------|
| 2.1 | Crear Google Doc con formato | Plantilla base |
| 2.2 | Definir marcadores de reemplazo | Variables identificadas |
| 2.3 | Crear formato de sección de productos | Template de línea |
| 2.4 | Agregar firma y membrete | Documento completo |

**Marcadores a definir:**
- `{{CIUDAD}}` - "San Pedro"
- `{{FECHA}}` - Fecha actual
- `{{LABORATORIO}}` - Nombre del lab
- `{{DIRECCION}}` - Dirección del lab
- `{{CIUDAD_LAB}}` - Ciudad del lab
- `{{CANTIDAD}}` - Número de muestras
- `{{PRODUCTOS}}` - Sección dinámica

**Validación:**
- Plantilla creada en carpeta
- Marcadores definidos
- Formato de productos probado

---

### FASE 3: Script - Generación de Solicitudes (1-2 sesiones)

**Objetivo:** Funciones para crear cartas desde datos registrados

**Tareas:**

| # | Función | Descripción |
|---|---------|-------------|
| 3.1 | `obtenerElementosProducto(codigo)` | Retorna array de elementos con valor |
| 3.2 | `agruparElementos(elementos)` | Categoriza en primarios, secundarios, etc. |
| 3.3 | `formatearElementos(producto, lote, elementos)` | Genera texto para un producto |
| 3.4 | `generarTextoEnvio(idEnvio)` | Genera sección completa de productos |
| 3.5 | `generarSolicitud(idEnvio)` | Copia plantilla, reemplaza, guarda Doc |
| 3.6 | `generarPDF(idEnvio)` | Convierte Doc a PDF |
| 3.7 | `registrarEnvio()` | Crea nuevo envío desde sidebar |
| 3.8 | `agregarMuestraAEnvio()` | Agrega producto al envío actual |

**Validación:**
- Funciones creadas
- Prueba de generación de Doc
- Prueba de generación de PDF
- Links guardados correctamente

---

### FASE 4: Script - Envío por Email (1 sesión)

**Objetivo:** Enviar solicitudes automáticamente al laboratorio

**Tareas:**

| # | Función | Descripción |
|---|---------|-------------|
| 4.1 | `enviarSolicitud(idEnvio)` | Envía email con PDF adjunto |
| 4.2 | `actualizarEstadoEnviado(idEnvio)` | Cambia estado a ENVIADO |
| 4.3 | `registrarFechaEnvio(idEnvio)` | Registra fecha actual |
| 4.4 | `obtenerEmailLaboratorio(labID)` | Busca email del laboratorio |

**Validación:**
- Email enviado correctamente
- Estado actualizado
- Fecha registrada
- PDF adjunto

---

### FASE 5: Script - Seguimiento y Alertas (1-2 sesiones)

**Objetivo:** Monitorear envíos pendientes y notificar

**Tareas:**

| # | Función | Descripción |
|---|---------|-------------|
| 5.1 | `calcularDiasPendientes()` | Actualiza días sin respuesta |
| 5.2 | `verificarPendientes()` | Busca envíos >10 días |
| 5.3 | `enviarAlertaEmail(envios)` | Envía notificación |
| 5.4 | `actualizarDashboard()` | Refresca métricas |
| 5.5 | `crearTriggerDiario()` | Configura trigger automático |
| 5.6 | `ejecutarVerificacionManual()` | Función on-demand |

**Validación:**
- Cálculo de días correcto
- Alertas generadas
- Emails enviados
- Trigger configurado
- Dashboard actualizado

---

### FASE 6: Script - Recepción de Resultados (1-2 sesiones)

**Objetivo:** Registrar y validar resultados de laboratorio

**Tareas:**

| # | Función | Descripción |
|---|---------|-------------|
| 6.1 | `mostrarFormularioResultados()` | Sidebar para ingreso |
| 6.2 | `registrarResultado()` | Guarda datos ingresados |
| 6.3 | `vincularPDF(idEnvio, url)` | Asocia PDF de resultados |
| 6.4 | `verificarCompletitud(idEnvio)` | Compara solicitados vs recibidos |
| 6.5 | `validarResultado(elemento, esperado, obtenido)` | Calcula diferencia |
| 6.6 | `generarReporteValidacion(idEnvio)` | Crea registros en hoja Validación |
| 6.7 | `determinarNivelAlerta(diferencia)` | Retorna VERDE/AMARILLO/ROJO |
| 6.8 | `actualizarEstadoEnvio(idEnvio)` | Cambia a PARCIAL o COMPLETO |

**Validación:**
- Resultados guardados
- PDF vinculado
- Completitud verificada
- Diferencia calculada
- Nivel de alerta correcto
- Estado actualizado
- Reporte generado

---

### FASE 7: Interfaz de Usuario (1 sesión)

**Objetivo:** Crear menú y herramientas de interacción

**Tareas:**

| # | Tarea | Descripción |
|---|-------|-------------|
| 7.1 | Crear menú personalizado | "Análisis Lab" en barra |
| 7.2 | Sidebar de nuevo envío | Formulario con validaciones |
| 7.3 | Sidebar de resultados | Formulario de ingreso |
| 7.4 | Botones en hoja Envíos | Acciones rápidas por fila |
| 7.5 | Formato condicional | Colores por estado |
| 7.6 | Vista Dashboard | Resumen visual |

**Sidebar - Nuevo Envío:**
```
┌─────────────────────────────────────┐
│  ➕ Nuevo Envío                      │
├─────────────────────────────────────┤
│  Laboratorio: [Dropdown]            │
│                                      │
│  Muestras:                           │
│  ┌────────────────────────────────┐ │
│  │ [+ Agregar Muestra]            │ │
│  └────────────────────────────────┘ │
│                                      │
│  Muestra 1:                          │
│  Producto: [Dropdown]              │
│  Lote: [___________]                │
│  Elementos requeridos:              │
│  ☑ N ☑ P ☑ K ☑ CaO ☑ MgO ☑ S      │
│  ☑ Menores ☑ Metales (todos) ☑ Micro (todos) │
│                                      │
│  [Cancelar] [Guardar Borrador]       │
└─────────────────────────────────────┘
```

**Nota:** Las opciones "Metales (todos)" y "Micro (todos)" activan el conjunto completo de metales pesados y microbiologicos para esa muestra.

**Formato condicional - Hoja Envíos:**
| Estado | Color |
|--------|-------|
| BORRADOR | Gris |
| ENVIADO | Azul |
| PARCIAL | Naranja |
| COMPLETO | Verde |
| Alerta=TRUE | Fondo rojo |

**Dashboard visual:**
- Tarjetas con métricas principales
- Gráfico de envíos por mes
- Lista de envíos pendientes
- Lista de resultados con alertas

**Validación:**
- Menú visible
- Sidebars funcionales
- Botones operativos
- Formato condicional aplicado
- Dashboard actualizado

---

### FASE 8: Pruebas y Ajustes (1 sesión)

**Objetivo:** Verificar funcionamiento completo del sistema

**Tareas:**

| # | Prueba | Resultado esperado |
|---|--------|-------------------|
| 8.1 | Crear envío nuevo | Registro en hojas correcto |
| 8.2 | Generar carta | Doc y PDF creados |
| 8.3 | Enviar email | Email llega con PDF |
| 8.4 | Registrar resultado parcial | Estado cambia a PARCIAL |
| 8.5 | Completar resultado | Estado cambia a COMPLETO |
| 8.6 | Validar con discrepancia | Alerta generada |
| 8.7 | Verificar pendientes | Envíos >10 días detectados |
| 8.8 | Ejecutar trigger | Alerta enviada |

**Lista de verificación:**
- [ ] Flujo completo sin errores
- [ ] Todos los botones funcionan
- [ ] Menú se crea al abrir Sheet
- [ ] Triggers se configuran
- [ ] Emails se envían
- [ ] PDFs se generan
- [ ] Links se guardan
- [ ] Estados se actualizan
- [ ] Validación funciona
- [ ] Dashboard actualiza
- [ ] Alertas notifican

---

### FASE 9: Documentación y Entrega (1 sesión)

**Objetivo:** Documentar el sistema para el próximo usuario

**Tareas:**

| # | Tarea | Entregable |
|---|-------|------------|
| 9.1 | Crear README en Drive | Instrucciones básicas |
| 9.2 | Documentar funciones | Comentarios en código |
| 9.3 | Crear guía de usuario | Paso a paso del flujo |
| 9.4 | Registrar credenciales | Si es necesario |
| 9.5 | Compartir acceso | Permisos configurados |

**Contenido de README:**
```markdown
# Sistema de Gestión de Análisis de Laboratorio

## Descripción
Sistema para gestionar envíos de muestras y resultados de laboratorio.

## Acceso
[Link al Google Sheet]

## Primeros Pasos
1. Abrir el Sheet
2. Ver menú "Análisis Lab"
3. Seleccionar "Nuevo Envío"

## Flujo de Uso
[Sección de flujo detallado]

## Problemas Comunes
[FAQ básica]

## Contacto
[Información de soporte]
```

**Validación:**
- README completo
- Código documentado
- Guía creada
- Acceso compartido

---

## Cronograma Estimado

| Fase | Sesiones | Tiempo estimado |
|------|----------|-----------------|
| FASE 1: Configuración Base | 1 | 1-2 horas |
| FASE 2: Plantilla de Carta | 1 | 1 hora |
| FASE 3: Generación de Solicitudes | 1-2 | 2-3 horas |
| FASE 4: Envío por Email | 1 | 1 hora |
| FASE 5: Seguimiento y Alertas | 1-2 | 2-3 horas |
| FASE 6: Recepción de Resultados | 1-2 | 2-3 horas |
| FASE 7: Interfaz de Usuario | 1 | 1-2 horas |
| FASE 8: Pruebas y Ajustes | 1 | 1-2 horas |
| FASE 9: Documentación | 1 | 1 hora |
| **TOTAL** | **9-12** | **12-17 horas** |

---

## Tecnologías Utilizadas

| Herramienta | Uso |
|--------------|-----|
| Google Sheets | Base de datos |
| Google Docs | Plantilla de carta |
| Google Drive | Almacenamiento |
| Google Apps Script | Automatización |
| Gmail | Envío de emails |
| Formularios | Entrada de datos |

---

## Requisitos Previos

- Cuenta de Google
- Acceso a Google Drive
- Permisos de Apps Script
- Conexión a internet

---

## Limitaciones Conocidas

1. **Lectura de PDFs automáticos:** Apps Script tiene limitaciones para extraer datos de PDFs. Se puede usar OCR, pero es complejo. Solución: ingreso manual o semiautomático.

2. **Tamaño de archivo:** Google Docs tiene límite de tamaño. Si las cartas son muy largas, puede afectar el rendimiento.

3. **Triggers:** Los triggers diarios se ejecutan en zona horaria del script. Debe ajustarse.

4. **Emails:** Hay límite de envíos diarios (100-200) por cuenta de Google.

5. **Concurrentes:** Si múltiples personas usan el sistema simultáneamente, pueden haber conflictos de edición.

---

## Futuras Mejoras

1. **OCR para resultados:** Implementar lectura automática de PDFs de laboratorio
2. **Integración con API del laboratorio:** Si tienen sistema disponible
3. **Reportes personalizados:** Generar reportes PDF con métricas
4. **Notificaciones por SMS:** Para alertas críticas
5. **Historial de cambios:** Usar Sheet Version History o implementar log
6. **Dashboard más avanzado:** Usar Google Data Studio
7. **Aplicación móvil:** Usar Google AppSheet
8. **Firma digital:** Certificar solicitudes

---

## Aceptación del Sistema

El sistema será considerado completo cuando:

- [ ] FASE 1-9 completadas
- [ ] Todas las pruebas exitosas
- [ ] Documentación entregada
- [ ] Usuario capacitado
- [ ] 3 envíos de prueba completados
- [ ] 3 resultados de prueba validados
- [ ] Alertas funcionando
- [ ] Dashboard actualizando

---

## Contacto y Soporte

**Desarrollador:** [Nombre]
**Fecha de creación:** [Fecha]
**Última actualización:** [Fecha]

**Para soporte:**
1. Revisar README
2. Consultar guía de usuario
3. Contactar desarrollador

---

*Fin del Plan de Implementación*
