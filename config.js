// ===== Google Cloud Configuration =====
// IMPORTANTE: Reemplaza 'YOUR_CLIENT_ID_HERE' con tu Client ID real de Google Cloud Console
// 
// Pasos para obtener el Client ID:
// 1. Ve a https://console.cloud.google.com/
// 2. Crea un nuevo proyecto o selecciona uno existente
// 3. Habilita "Google Sheets API"
// 4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
// 5. Tipo de aplicación: "Aplicación web"
// 6. URIs de JavaScript autorizados: http://localhost y file://
// 7. Copia el Client ID generado y pégalo aquí

const CONFIG = {
    // Google API Configuration
    GOOGLE_CLIENT_ID: '54402589069-nhgmfjh461rcomg2o7n65uibkhm7oqm6.apps.googleusercontent.com',
    GOOGLE_API_KEY: '', // Opcional, no necesario para lectura con OAuth

    // Scopes - Solo lectura para Google Sheets
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets.readonly',

    // Discovery Docs
    DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],

    // Tu Google Sheets
    SPREADSHEET_ID: '1KDv8_yXkRouuHRMiqDP8wA-DR5ab8NXlDhD0qKiNl9o',
    SHEET_NAME: 'Hoja 1', // Cambia si tu pestaña tiene otro nombre
    RANGE: 'A:Z', // Todas las columnas A-Z (Ampliado para presentación)

    // Dashboard Settings
    REFRESH_INTERVAL: 300000, // 5 minutos en milisegundos
    CRITICAL_DAYS_THRESHOLD: 7, // Días para considerar proyecto crítico

    // Date Format
    DATE_LOCALE: 'es-ES',

    // Currency
    CURRENCY: 'EUR',
    CURRENCY_SYMBOL: '€'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
