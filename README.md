# Dashboard de Proyectos THINK

Dashboard interactivo que se conecta en tiempo real a Google Sheets para gestionar proyectos de la agencia.

## 🎯 Características

- ✅ **Conexión en tiempo real** con Google Sheets
- 📊 **KPIs principales**: Proyectos activos, facturación, tareas críticas, margen
- 👥 **Vista por persona**: Proyectos agrupados por responsable
- 💰 **Análisis financiero**: Previsión de facturación y márgenes
- 🚨 **Alertas críticas**: Identificación automática de proyectos urgentes
- 🔍 **Filtros dinámicos**: Por responsable, cliente y estado
- 🔄 **Auto-actualización**: Datos actualizados cada 5 minutos

## 📂 Archivos del Proyecto

```
project-dashboard/
├── index.html        - Estructura HTML del dashboard
├── style.css         - Estilos profesionales responsive
├── config.js         - Configuración de Google API
├── google-api.js     - Integración con Google Sheets API
├── app.js            - Lógica principal del dashboard
├── SETUP.md          - Guía detallada de configuración
└── README.md         - Este archivo
```

## 🚀 Inicio Rápido

### 1. Configurar Google Cloud Console (PRIMERA VEZ)

Lee el archivo **`SETUP.md`** para instrucciones detalladas sobre cómo:
- Crear un proyecto en Google Cloud
- Habilitar Google Sheets API
- Obtener credenciales OAuth 2.0
- Configurar el archivo `config.js`

### 2. Abrir el Dashboard

1. Abre `index.html` en tu navegador
2. Haz clic en "Conectar Google Sheets"
3. Autoriza el acceso a tu cuenta de Google
4. ¡Los datos se cargarán automáticamente!

## 📊 Vistas del Dashboard

### Vista "Por Persona"
- Proyectos organizados por responsable (columna PROJECT)
- Tarjetas con estado, progreso y datos financieros
- Alertas visuales para proyectos críticos

### Vista "Facturación"
- Tabla de previsión mensual
- Totales de facturación, costes y márgenes
- Agrupación automática por mes de finalización

### Vista "Tareas Críticas"
- Proyectos con fecha de fin próxima (< 7 días)
- Proyectos con observaciones urgentes
- Contador de días restantes

## 🔧 Configuración

### Editar `config.js`

```javascript
GOOGLE_CLIENT_ID: 'TU_CLIENT_ID_AQUI',  // Obligatorio
SPREADSHEET_ID: '...',                   // ID de tu Google Sheets
SHEET_NAME: 'Hoja 1',                    // Nombre de la pestaña
REFRESH_INTERVAL: 300000,                // Actualización cada 5 min
```

## 🎨 Personalización

Puedes personalizar colores editando las variables CSS en `style.css`:

```css
:root {
    --color-primary: hsl(210, 100%, 56%);
    --color-success: hsl(145, 63%, 49%);
    --color-danger: hsl(0, 84%, 60%);
    /* ... más variables */
}
```

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Edge, Safari (últimas versiones)
- ✅ Responsive: Desktop, Tablet, Mobile
- ✅ Offline: NO (requiere conexión para cargar datos)

## 🔒 Seguridad

- Solo permisos de **lectura** (`spreadsheets.readonly`)
- El dashboard **NO puede modificar** tu Google Sheets
- Los datos solo se transmiten entre Google y tu navegador
- OAuth 2.0 para autenticación segura

## 💡 Consejos

1. **Auto-actualización**: Los datos se refrescan automáticamente cada 5 minutos
2. **Actualización manual**: Usa el botón 🔄 en cualquier momento
3. **Filtros**: Los filtros afectan todas las vistas y los KPIs
4. **Proyectos críticos**: Se detectan automáticamente basándose en fecha de fin y observaciones

## 🆘 Problemas Comunes

Ver archivo **`SETUP.md`** → Sección "Solución de Problemas"

## 📝 Estructura de Datos Esperada

El dashboard espera que tu Google Sheets tenga estas columnas:

```
Nº | PROJECT | Cliente | Marca | PUNTO VENTA | Tipo | Previos | Diseño | 
Produccion | Ejecución | Fin | Previsión facturación | Costes asociados a proyecto | 
Coste estructura | Status | Observaciones
```

## 🔄 Actualizaciones Futuras (Opcionales)

- [ ] Vista de calendario/timeline visual
- [ ] Gráficos con Chart.js
- [ ] Exportar reportes a PDF
- [ ] Notificaciones por email para proyectos críticos
- [ ] Vista de comparación mes a mes

---

**Desarrollado para THINK Agency** 🚀
