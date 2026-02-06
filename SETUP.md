# Guía de Configuración - Dashboard de Proyectos THINK

## 📋 Configuración de Google Cloud Console

Para que el dashboard pueda conectarse a tu Google Sheets, necesitas crear credenciales OAuth 2.0. Sigue estos pasos:

### Paso 1: Crear/Seleccionar Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Haz clic en el selector de proyecto (arriba, al lado de "Google Cloud")
4. Clic en **"NUEVO PROYECTO"**
5. Nombre: "Dashboard THINK" (o el que prefieras)
6. Clic en **"CREAR"**
7. Espera unos segundos y selecciona el proyecto recién creado

### Paso 2: Habilitar Google Sheets API

1. En el menú lateral, ve a **"APIs y servicios"** → **"Biblioteca"**
2. Busca **"Google Sheets API"**
3. Haz clic en el resultado
4. Clic en **"HABILITAR"**
5. Espera a que se active la API

### Paso 3: Configurar Pantalla de Consentimiento OAuth

1. Ve a **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**
2. Selecciona **"Externo"** como tipo de usuario
3. Clic en **"CREAR"**

4. **Información de la aplicación**:
   - Nombre de la aplicación: "Dashboard THINK"
   - Correo electrónico de asistencia: tu email
   - Logo: (opcional)

5. **Dominios autorizados**: (dejar vacío por ahora)

6. **Información de contacto del desarrollador**: tu email

7. Clic en **"GUARDAR Y CONTINUAR"**

8. **Permisos** (Scopes):
   - Clic en **"AGREGAR O QUITAR PERMISOS"**
   - Busca: `../auth/spreadsheets.readonly`
   - Marca la casilla
   - Clic en **"ACTUALIZAR"**
   - Clic en **"GUARDAR Y CONTINUAR"**

9. **Usuarios de prueba**:
   - Clic en **"+ ADD USERS"**
   - Añade tu email y el de otros usuarios que necesiten acceso
   - Clic en **"GUARDAR Y CONTINUAR"**

10. Revisa el resumen y clic en **"VOLVER AL PANEL"**

### Paso 4: Crear Credenciales OAuth 2.0

1. Ve a **"APIs y servicios"** → **"Credenciales"**
2. Clic en **"+ CREAR CREDENCIALES"** → **"ID de cliente de OAuth 2.0"**

3. **Tipo de aplicación**: Selecciona **"Aplicación web"**

4. **Nombre**: "Dashboard THINK Web Client"

5. **Orígenes de JavaScript autorizados**:
   - Clic en **"+ AGREGAR URI"**
   - Añade: `http://localhost`
   - Clic en **"+ AGREGAR URI"** nuevamente
   - Añade: `file://`
   
6. **URIs de redirección autorizados**: (dejar vacío para apps locales)

7. Clic en **"CREAR"**

8. **¡IMPORTANTE!** Aparecerá un popup con tu **Client ID**
   - Copia el texto que empieza con algo como: `123456789-abc...apps.googleusercontent.com`
   - Guárdalo en un lugar seguro

### Paso 5: Configurar el Dashboard

1. Abre el archivo `config.js` en la carpeta del dashboard
2. Busca la línea:
   ```javascript
   GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com',
   ```
3. Reemplaza `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` con tu Client ID completo
4. Guarda el archivo

### Paso 6: Verificar ID de Google Sheets

1. Abre tu Google Sheets en el navegador
2. La URL se ve así: `https://docs.google.com/spreadsheets/d/[ID]/edit`
3. Copia el **ID** (el texto entre `/d/` y `/edit`)
4. Debe ser: `1KDv8_yXkRouuHRMiqDP8wA-DR5ab8NXlDhD0qKiNl9o`
5. Verifica que coincida con el ID en `config.js`:
   ```javascript
   SPREADSHEET_ID: '1KDv8_yXkRouuHRMiqDP8wA-DR5ab8NXlDhD0qKiNl9o',
   ```

### Paso 7: Verificar nombre de la pestaña

1. En tu Google Sheets, mira el nombre de la pestaña (abajo)
2. Si no es "Hoja 1", actualiza en `config.js`:
   ```javascript
   SHEET_NAME: 'TU_NOMBRE_DE_PESTAÑA',
   ```

---

## 🚀 Cómo Usar el Dashboard

### Primera vez

1. Abre `index.html` en tu navegador (doble clic o clic derecho → Abrir con → navegador)
2. Verás el dashboard con estado "🔴 Desconectado"
3. Haz clic en **"🔗 Conectar Google Sheets"**
4. Se abrirá una ventana de Google:
   - Selecciona tu cuenta
   - Puede aparecer "Esta app no está verificada" → clic en "Avanzado" → "Ir a Dashboard THINK (no seguro)"
   - Acepta los permisos solicitados
5. ¡Listo! Los datos se cargarán automáticamente

### Uso diario

1. Abre el dashboard
2. Si ya autenticaste antes, los datos se cargan automáticamente
3. Los datos se actualizan cada 5 minutos
4. Usa el botón 🔄 para actualizar manualmente en cualquier momento

---

## 📊 Funcionalidades del Dashboard

### Vista General (KPIs)
- **Proyectos Activos**: Cuenta de proyectos con status "En curso"
- **Facturación Prevista**: Suma total de todas las previsiones
- **Proyectos Críticos**: Proyectos que requieren atención urgente
- **Margen Previsto**: Diferencia entre facturación y costes

### Vista "Por Persona"
- Proyectos agrupados por responsable (columna PROJECT)
- Cada tarjeta muestra:
  - Cliente y marca
  - Estado del proyecto
  - Barra de progreso basada en fases completadas
  - Fecha de finalización
  - Facturación y margen
  - Observaciones (si hay)

### Vista "Facturación"
- Tabla con previsión de facturación por mes
- Se agrupa según la fecha de "Fin" de cada proyecto
- Muestra: Proyectos, Facturación, Costes, Margen

### Vista "Tareas Críticas"
- Lista de proyectos que requieren atención inmediata
- **Criterios de criticidad**:
  1. Estado "En curso" + Fecha Fin dentro de 7 días
  2. Observaciones con palabras: "urgente", "crítico", "problema", "incidencia"
- Muestra: Responsable, Fecha fin, Días restantes, Observaciones

### Filtros
- **Responsable**: Filtra por nombre en columna PROJECT
- **Cliente**: Busca por nombre de cliente
- **Estado**: Filtra por status (En curso, Completado, etc.)
- Los filtros afectan todas las vistas y los KPIs

---

## 🔧 Solución de Problemas

### Error: "No se puede conectar a Google Sheets"
- Verifica que el Client ID en `config.js` sea correcto
- Asegúrate de haber habilitado Google Sheets API
- Revisa que añadiste los orígenes autorizados correctamente

### Error: "No data found in spreadsheet"
- Verifica el SPREADSHEET_ID en `config.js`
- Asegúrate de que el nombre de la pestaña sea correcto
- Comprueba que la hoja tenga datos (al menos la fila de encabezados)

### Los datos no se actualizan
- Haz clic en el botón de actualización 🔄
- Verifica tu conexión a internet
- Si persiste, desconecta y vuelve a conectar

### "Esta app no está verificada"
- Es normal para apps en desarrollo
- Clic en "Avanzado" → "Ir a [nombre de tu app] (no seguro)"
- Solo tú y los usuarios de prueba que añadiste pueden acceder

---

## 📝 Notas Importantes

1. **Privacidad**: Tus datos nunca salen de Google Sheets. La app solo lee, no modifica.

2. **Offline**: El dashboard necesita conexión a internet para cargar datos.

3. **Límites de API**: Google permite hasta 300 lecturas por minuto (más que suficiente).

4. **Navegadores compatibles**: Chrome, Firefox, Edge, Safari (últimas versiones).

5. **Actualización automática**: Los datos se refrescan cada 5 minutos automáticamente.

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo compartir el dashboard con mi equipo?**
R: Sí, pero cada persona debe:
- Tener el dashboard en su computadora
- Estar añadida como "usuario de prueba" en Google Cloud Console
- Autenticarse con su propia cuenta de Google
- Tener acceso al Google Sheets

**P: ¿El dashboard modifica mi Google Sheets?**
R: No, el dashboard tiene permisos de solo lectura (`spreadsheets.readonly`). No puede modificar nada.

**P: ¿Puedo personalizar los colores o el diseño?**
R: Sí, edita el archivo `style.css`. Las variables CSS están al inicio del archivo.

**P: ¿Qué pasa si cambio la estructura del Sheets?**
R: Si añades o eliminas columnas, puede que necesites actualizar el código en `app.js`.

---

## 🆘 Soporte

Si encuentras algún problema que no está documentado aquí, revisa:
1. La consola del navegador (F12 → Console) para ver errores
2. Verifica que todos los archivos estén en la misma carpeta
3. Asegúrate de que el archivo `config.js` esté correctamente configurado
