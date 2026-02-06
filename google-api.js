// ===== Google Sheets API Integration =====

class GoogleSheetsAPI {
    constructor() {
        this.isSignedIn = false;
        this.tokenClient = null;
        this.gapiInited = false;
        this.gisInited = false;
    }

    /**
     * Initialize Google API and OAuth
     */
    async initialize() {
        try {
            await this.loadGoogleAPIs();
            await this.initializeGapiClient();
            await this.initializeGis();
            return true;
        } catch (error) {
            console.error('Error initializing Google APIs:', error);
            throw error;
        }
    }

    /**
     * Load Google API scripts
     */
    loadGoogleAPIs() {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if (window.gapi && window.google) {
                resolve();
                return;
            }

            // Load GAPI
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            gapiScript.onload = () => {
                // Load GIS
                const gisScript = document.createElement('script');
                gisScript.src = 'https://accounts.google.com/gsi/client';
                gisScript.async = true;
                gisScript.defer = true;
                gisScript.onload = resolve;
                gisScript.onerror = reject;
                document.head.appendChild(gisScript);
            };
            gapiScript.onerror = reject;
            document.head.appendChild(gapiScript);
        });
    }

    /**
     * Initialize GAPI client
     */
    async initializeGapiClient() {
        return new Promise((resolve, reject) => {
            gapi.load('client', async () => {
                try {
                    await gapi.client.init({
                        apiKey: CONFIG.GOOGLE_API_KEY || '',
                        discoveryDocs: CONFIG.DISCOVERY_DOCS,
                    });
                    this.gapiInited = true;
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });
        });
    }

    /**
     * Initialize Google Identity Services
     */
    initializeGis() {
        return new Promise((resolve) => {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CONFIG.GOOGLE_CLIENT_ID,
                scope: CONFIG.SCOPES,
                callback: '', // Will be defined later
            });
            this.gisInited = true;
            resolve();
        });
    }

    /**
     * Authenticate user with Google
     */
    authenticate() {
        return new Promise((resolve, reject) => {
            if (!this.gisInited) {
                reject(new Error('GIS not initialized'));
                return;
            }

            this.tokenClient.callback = async (response) => {
                if (response.error !== undefined) {
                    reject(response);
                    return;
                }
                this.isSignedIn = true;
                resolve(response);
            };

            // Check if already has valid token
            if (gapi.client.getToken() === null) {
                // Prompt user to select account
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                // Skip account selection
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        });
    }

    /**
     * Sign out user
     */
    signOut() {
        const token = gapi.client.getToken();
        if (token !== null) {
            google.accounts.oauth2.revoke(token.access_token);
            gapi.client.setToken('');
            this.isSignedIn = false;
        }
    }

    /**
     * Fetch data from Google Sheets
     */
    async fetchSheetData() {
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: CONFIG.SPREADSHEET_ID,
                range: `${CONFIG.SHEET_NAME}!${CONFIG.RANGE}`,
            });

            const data = response.result.values;

            if (!data || data.length === 0) {
                throw new Error('No data found in spreadsheet');
            }

            return this.parseSheetData(data);
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            throw error;
        }
    }

    /**
     * Parse raw sheet data into structured objects
     */
    parseSheetData(data) {
        // First row contains headers
        const headers = data[0];

        // Remaining rows are data
        const rows = data.slice(1);

        // Convert to array of objects
        const projects = rows.map(row => {
            const project = {};

            headers.forEach((header, index) => {
                project[header] = row[index] || '';
            });
            project._rawRow = row; // Store raw data for index-based access

            return project;
        });

        return projects;
    }

    /**
     * Check if user is authenticated
     */
    checkAuth() {
        return this.isSignedIn && gapi.client.getToken() !== null;
    }
}

// Create global instance
const googleAPI = new GoogleSheetsAPI();
