// ===== Main Dashboard Application =====

class ProjectDashboard {
    constructor() {
        this.projects = [];
        this.filteredProjects = [];
        this.refreshInterval = null;
        this.isLoading = false;
    }

    /**
     * Initialize dashboard
     */
    async init() {
        try {
            // Show loading
            this.showLoading(true);

            // Initialize Google API
            await googleAPI.initialize();

            // Setup event listeners
            this.setupEventListeners();

            // Check if already authenticated
            if (googleAPI.checkAuth()) {
                await this.loadProjects();
                this.updateConnectionStatus(true);
            } else {
                this.updateConnectionStatus(false);
            }

            this.showLoading(false);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showError('Error al inicializar el dashboard. Por favor, recarga la página.');
            this.showLoading(false);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Connect button
        document.getElementById('connect-btn')?.addEventListener('click', () => this.handleConnect());

        // Disconnect button
        document.getElementById('disconnect-btn')?.addEventListener('click', () => this.handleDisconnect());

        // Refresh button
        document.getElementById('refresh-btn')?.addEventListener('click', () => this.handleRefresh());

        // Filters - Check existence
        if (document.getElementById('filter-person')) {
            document.getElementById('filter-person').addEventListener('input', () => this.applyFilters());
            document.getElementById('filter-client').addEventListener('input', () => this.applyFilters());
            document.getElementById('filter-status').addEventListener('change', () => this.applyFilters());
            document.getElementById('clear-filters-btn').addEventListener('click', () => this.clearFilters());
        }

        // View toggles
        document.querySelectorAll('[data-view]').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
        });
    }

    /**
     * Handle connect to Google Sheets
     */
    async handleConnect() {
        try {
            this.showLoading(true);
            await googleAPI.authenticate();
            await this.loadProjects();
            this.updateConnectionStatus(true);
            this.startAutoRefresh();
            this.showNotification('Conectado a Google Sheets correctamente', 'success');
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Error al conectar con Google Sheets. Verifica tus credenciales.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect() {
        googleAPI.signOut();
        this.stopAutoRefresh();
        this.updateConnectionStatus(false);
        this.projects = [];
        this.renderDashboard();
        this.showNotification('Desconectado de Google Sheets', 'info');
    }

    /**
     * Handle manual refresh
     */
    async handleRefresh() {
        if (!googleAPI.checkAuth()) {
            this.showError('Debes conectarte primero a Google Sheets');
            return;
        }
        await this.loadProjects();
        this.showNotification('Datos actualizados', 'success');
    }

    /**
     * Load projects from Google Sheets
     */
    async loadProjects() {
        try {
            this.showLoading(true);
            this.projects = await googleAPI.fetchSheetData();

            // Process projects
            // Pass index to create unique IDs
            this.projects = this.projects.map((p, i) => this.processProject(p, i));

            // Apply filters and render
            this.applyFilters();

            // Update last refresh time
            this.updateLastRefreshTime();

        } catch (error) {
            console.error('Error loading projects:', error);
            this.showError('Error al cargar los proyectos. Verifica el ID de la hoja.');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Process project data
     */
    processProject(project, index) {
        // Normalize Status
        const rawStatus = project.Status ? project.Status.toString().trim() : '';
        // Standardize variations
        if (rawStatus.toLowerCase().includes('curso')) project.Status = 'En curso';
        else if (rawStatus.toLowerCase().includes('completado')) project.Status = 'Completado';
        else if (rawStatus.toLowerCase().includes('pendiente')) project.Status = 'Pendiente';
        else if (rawStatus.toLowerCase().includes('producción') || rawStatus.toLowerCase().includes('produccion')) project.Status = 'Producción';
        else if (rawStatus.toLowerCase().includes('diseño')) project.Status = 'Diseño';
        else project.Status = rawStatus || 'N/A';

        // EXTRACT TYPE (Column F - Index 5)
        // Ensure we handle cases where _rawRow might not be available or index 5 is empty
        if (project._rawRow && project._rawRow[5]) {
            project.Type = project._rawRow[5].toString().trim();
        } else {
            // Fallback or try property if header is named 'Tipo'
            project.Type = project['Tipo'] || project['Tipo de proyecto'] || 'OTROS';
        }

        // Parse dates
        project.PreviosDate = this.parseSpanishDate(project.Previos);
        project.DiseñoDate = this.parseSpanishDate(project.Diseño);
        project.ProduccionDate = this.parseSpanishDate(project.Produccion);
        project.EjecuciónDate = this.parseSpanishDate(project.Ejecución);
        project.FinDate = this.parseSpanishDate(project.Fin);

        // Parse amounts
        project.FacturacionAmount = this.parseAmount(project['Previsión facturación']);
        project.CostesAmount = this.parseAmount(project['Costes asociados a proyecto']);
        project.EstructuraAmount = this.parseAmount(project['Coste estructura']);

        // Calculate totals
        project.TotalCost = project.CostesAmount + project.EstructuraAmount;
        project.Margin = project.FacturacionAmount - project.TotalCost;
        project.MarginPercent = project.FacturacionAmount > 0
            ? (project.Margin / project.FacturacionAmount * 100)
            : 0;

        // Calculate progress
        project.Progress = this.calculateProgress(project);

        // Check if critical
        project.IsCritical = this.isCritical(project);

        // Add ID (index)
        project.id = index.toString();

        // SMART SCAN: Extract presentation
        project.presentationHtml = '';
        if (project._rawRow) {
            if (project._rawRow[16]) {
                project.presentationHtml = project._rawRow[16];
            } else {
                for (let i = 16; i < 26; i++) {
                    const cell = project._rawRow[i];
                    if (cell && (typeof cell === 'string') && (cell.includes('http') || cell.includes('<iframe'))) {
                        project.presentationHtml = cell;
                        break;
                    }
                }
            }
        }

        return project;
    }

    // ... (keep helper methods like parseSpanishDate, etc.) same as before ... 
    // Moving to render methods update 

    renderTeamKPIs() {
        const container = document.getElementById('team-stats-container');
        if (!container) return;

        const teamStats = {};
        // Calculate Total Billing for correct % calculation
        const totalBilling = this.filteredProjects.reduce((sum, p) => sum + p.FacturacionAmount, 0);

        this.filteredProjects.forEach(p => {
            let person = p.PROJECT || 'Sin Asignar';
            person = person.trim().split(' ')[0].toUpperCase();
            if (!teamStats[person]) {
                teamStats[person] = { count: 0, billing: 0, totalProgress: 0 };
            }
            teamStats[person].count++;
            teamStats[person].billing += p.FacturacionAmount;
            teamStats[person].totalProgress += p.Progress;
        });

        let html = `
            <div class="stats-card" style="background: var(--color-bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; height: 100%; display: flex; flex-direction: column;">
                <h3 style="color: var(--color-accent-yellow); margin-bottom: 20px; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    👤 EQUIPO: CARGA DE TRABAJO (POR FACTURACIÓN)
                </h3>
                <div class="team-list" style="display: flex; flex-direction: column; gap: 15px; flex-grow: 1;">
        `;

        Object.keys(teamStats).sort().forEach(person => {
            const stats = teamStats[person];
            // CORRECTED: Workload % is now based on BILLING, not count
            const workloadPercent = totalBilling > 0 ? (stats.billing / totalBilling * 100) : 0;
            const avgProgress = stats.count > 0 ? (stats.totalProgress / stats.count) : 0;

            html += `
                <div class="member-row" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 6px; border-left: 3px solid var(--color-accent-blue); display: flex; align-items: center; justify-content: space-between;">
                    
                    <div style="flex-grow: 1;">
                        <span style="display: block; font-weight: 800; color: #fff; font-size: 1.1rem; margin-bottom: 4px;">${person}</span>
                        <!-- New Billing Line -->
                        <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 2px;">
                            Fact. Prevista: <span style="color: #fff; font-weight: 600;">${this.formatCurrencyCompact(stats.billing)}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">
                            Ejecución Promedio: <span style="color: #ddd;">${Math.round(avgProgress)}%</span>
                        </div>
                    </div>

                    <div style="text-align: right; min-width: 80px;">
                        <span style="display: block; font-size: 0.7rem; color: #666; text-transform: uppercase;">Carga</span>
                        <span style="font-size: 1.8rem; font-weight: 900; color: var(--color-accent-blue); line-height: 1;">${Math.round(workloadPercent)}%</span>
                    </div>

                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    renderProjectTypeKPIs() {
        const container = document.getElementById('type-stats-container');
        if (!container) return;

        const typeStats = {};
        let totalBillingSystem = 0;

        this.filteredProjects.forEach(p => {
            // Use proper Type extracted from Column F
            let type = p.Type ? p.Type.toUpperCase() : 'OTROS';
            if (type === '') type = 'OTROS';

            if (!typeStats[type]) {
                typeStats[type] = { billing: 0, count: 0 };
            }
            typeStats[type].billing += p.FacturacionAmount;
            typeStats[type].count++;
            totalBillingSystem += p.FacturacionAmount;
        });

        const sortedTypes = Object.keys(typeStats).sort((a, b) => typeStats[b].billing - typeStats[a].billing);

        let html = `
            <div class="stats-card" style="background: var(--color-bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; height: 100%;">
                <h3 style="color: var(--color-accent-blue); margin-bottom: 20px; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    📊 TIPO DE PROYECTO
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="text-align: left; color: #666; border-bottom: 1px solid #333;">
                            <th style="padding-bottom: 10px; font-weight: 500;">TIPO</th>
                            <th style="padding-bottom: 10px; font-weight: 500; text-align: right;">IMPORTE</th>
                            <th style="padding-bottom: 10px; font-weight: 500; text-align: right;">% PESO</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sortedTypes.forEach(type => {
            const stats = typeStats[type];
            const weightPercent = totalBillingSystem > 0 ? (stats.billing / totalBillingSystem * 100) : 0;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px 0; font-weight: 600; color: #ddd;">${type}</td>
                    <td style="padding: 12px 0; text-align: right; color: #fff;">${this.formatCurrencyCompact(stats.billing)}</td>
                    <td style="padding: 12px 0; text-align: right;">
                        <span style="background: rgba(93, 120, 255, 0.1); color: var(--color-accent-blue); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
                            ${Math.round(weightPercent)}%
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    parseSpanishDate(dateStr) {
        if (!dateStr || dateStr.trim() === '') return null;
        try {
            const months = { 'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 };
            const parts = dateStr.toLowerCase().split('-');
            if (parts.length !== 2) return null;
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = new Date().getFullYear();
            return new Date(year, month, day);
        } catch (error) { return null; }
    }

    parseAmount(amountStr) {
        if (!amountStr) return 0;
        const cleaned = amountStr.toString().replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
        return parseFloat(cleaned) || 0;
    }

    calculateProgress(project) {
        const today = new Date();
        const phases = ['PreviosDate', 'DiseñoDate', 'ProduccionDate', 'EjecuciónDate', 'FinDate'];
        let completed = 0;
        phases.forEach(phase => { if (project[phase] && project[phase] <= today) completed++; });
        return (completed / phases.length) * 100;
    }

    isCritical(project) {
        if (!project.FinDate) return false;
        const today = new Date();
        const daysUntilEnd = Math.ceil((project.FinDate - today) / (1000 * 60 * 60 * 24));
        const isNearDeadline = project.Status === 'En curso' && daysUntilEnd <= CONFIG.CRITICAL_DAYS_THRESHOLD && daysUntilEnd >= 0;
        const urgentKeywords = ['urgente', 'crítico', 'problema', 'incidencia'];
        const hasUrgentNote = project.Observaciones && urgentKeywords.some(kw => project.Observaciones.toLowerCase().includes(kw));
        return isNearDeadline || hasUrgentNote;
    }

    applyFilters() {
        const personFilter = document.getElementById('filter-person')?.value.toLowerCase() || '';
        const clientFilter = document.getElementById('filter-client')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';

        this.filteredProjects = this.projects.filter(project => {
            const matchesPerson = !personFilter || (project.PROJECT && project.PROJECT.toLowerCase().includes(personFilter));
            const matchesClient = !clientFilter || (project.Cliente && project.Cliente.toLowerCase().includes(clientFilter));
            const matchesStatus = !statusFilter || project.Status === statusFilter;
            return matchesPerson && matchesClient && matchesStatus;
        });
        this.renderDashboard();
    }

    clearFilters() {
        if (document.getElementById('filter-person')) {
            document.getElementById('filter-person').value = '';
            document.getElementById('filter-client').value = '';
            document.getElementById('filter-status').value = '';
            this.applyFilters();
        }
    }

    renderDashboard() {
        this.renderKPIs();
        this.renderStatusDistribution(); // NEW: Status Breakdown
        this.renderProjectList();
        this.renderCalendar();
        this.renderBillingForecast();
        this.renderCriticalTasks();
        this.renderStatsSplitView();
        this.renderCriticalAlertsVisual();
    }

    renderKPIs() {
        // Active Count: Any non-completed, non-cancelled project
        const activeProjects = this.filteredProjects.filter(p => {
            const s = (p.Status || '').toLowerCase();
            return s !== 'completado' && s !== 'cancelado';
        }).length;

        const totalBilling = this.filteredProjects.reduce((sum, p) => sum + p.FacturacionAmount, 0);
        const criticalProjectsList = this.filteredProjects.filter(p => p.IsCritical);
        const criticalCount = criticalProjectsList.length;

        document.getElementById('kpi-active').textContent = activeProjects;
        document.getElementById('kpi-billing').textContent = this.formatCurrency(totalBilling);
        document.getElementById('kpi-critical').textContent = criticalCount;
        // Margin removal handled here (no update to kpi-margin as element removed)
    }

    /**
     * Render Status Distribution (Bar Chart) - REPLACES MARGIN
     */
    renderStatusDistribution() {
        const container = document.getElementById('status-distribution-container');
        if (!container) return;

        const statusCounts = {};
        let total = 0;

        // Group by Status
        this.filteredProjects.forEach(p => {
            let s = (p.Status || 'N/A').toLowerCase();
            if (s === '') s = 'n/a';
            // Capitalize
            s = s.charAt(0).toUpperCase() + s.slice(1);

            if (!statusCounts[s]) statusCounts[s] = 0;
            statusCounts[s]++;
            total++;
        });

        const sortedStatuses = Object.keys(statusCounts).sort((a, b) => statusCounts[b] - statusCounts[a]);

        let html = '';
        // Nice palette
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#64748B'];

        sortedStatuses.forEach((status, index) => {
            const count = statusCounts[status];
            const percent = total > 0 ? (count / total * 100) : 0;
            const color = colors[index % colors.length];

            html += `
                <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: #ccc;">
                    <span style="width: 85px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${status}</span>
                    <div style="flex-grow: 1; margin: 0 10px; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percent}%; background: ${color}; height: 100%;"></div>
                    </div>
                    <span style="width: 25px; text-align: right; font-size: 0.7rem; color: #fff;">${count}</span>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // NEW: Render Critical Warnings as Visual Boxes
    renderCriticalAlertsVisual() {
        const containerSection = document.getElementById('critical-visuals-section');
        const grid = document.getElementById('critical-alerts-container');

        if (!containerSection || !grid) return;

        const critical = this.filteredProjects.filter(p => p.IsCritical);

        if (critical.length > 0) {
            containerSection.style.display = 'block';

            grid.innerHTML = critical.map(p => {
                const obs = p.Observaciones || 'Sin observaciones detalladas';
                const days = p.FinDate ? Math.ceil((p.FinDate - new Date()) / (1000 * 60 * 60 * 24)) : '?';
                const daysColor = days < 5 ? 'var(--color-accent-red)' : 'var(--color-accent-yellow)';
                const clientName = (p.Cliente || '').trim();
                const brand = (p.Marca || '').trim();

                return `
                    <div style="background: rgba(255, 107, 107, 0.08); border: 1px solid var(--color-accent-red); padding: 15px; border-radius: 8px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <div>
                                <h4 style="color: white; margin: 0; font-size: 1rem; font-weight: 800;">${p['PUNTO VENTA'] || 'Sin Punto Venta'}</h4>
                                <div style="color: var(--color-accent-red); font-size: 0.9rem; margin-top: 4px;">${brand} <span style="color: #666;">|</span> ${clientName}</div>
                            </div>
                            <div style="background: ${daysColor}; color: #000; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 0.85rem; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                ${days} DÍAS
                            </div>
                        </div>
                        
                        <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; font-size: 0.85rem; color: #eee; border-left: 3px solid var(--color-accent-red); flex-grow: 1;">
                            ${obs}
                        </div>
                        
                        <button onclick="dashboard.openProjectModal('${p.id}')" style="margin-top: 12px; background: none; border: none; color: #aaa; cursor: pointer; text-decoration: underline; font-size: 0.8rem; align-self: flex-end;">
                           Ver Ficha Completa ↗
                        </button>
                    </div>
                `;
            }).join('');

        } else {
            containerSection.style.display = 'none';
        }
    }

    renderStatsSplitView() {
        this.renderTeamKPIs();
        this.renderProjectTypeKPIs();
    }

    renderTeamKPIs() {
        const container = document.getElementById('team-stats-container');
        if (!container) return;

        const teamStats = {};
        // Calculate Total Billing for correct % calculation
        // Fix: Use reduce properly
        const totalBilling = this.filteredProjects.reduce((sum, p) => sum + (p.FacturacionAmount || 0), 0);

        this.filteredProjects.forEach(p => {
            let person = p.PROJECT || 'Sin Asignar';
            person = person.trim().split(' ')[0].toUpperCase();
            if (!teamStats[person]) {
                teamStats[person] = { count: 0, billing: 0, totalProgress: 0 };
            }
            teamStats[person].count++;
            teamStats[person].billing += (p.FacturacionAmount || 0);
            teamStats[person].totalProgress += (p.Progress || 0);
        });

        let html = `
            <div class="stats-card" style="background: var(--color-bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; height: 100%; display: flex; flex-direction: column;">
                <h3 style="color: var(--color-accent-yellow); margin-bottom: 20px; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    👤 EQUIPO: CARGA DE TRABAJO (POR FACTURACIÓN)
                </h3>
                <div class="team-list" style="display: flex; flex-direction: column; gap: 15px; flex-grow: 1;">
        `;

        Object.keys(teamStats).sort().forEach(person => {
            const stats = teamStats[person];
            // CORRECTED: Workload % is now based on BILLING, not count
            const workloadPercent = totalBilling > 0 ? (stats.billing / totalBilling * 100) : 0;
            const avgProgress = stats.count > 0 ? (stats.totalProgress / stats.count) : 0;

            html += `
                <div class="member-row" style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 6px; border-left: 3px solid var(--color-accent-blue); display: flex; align-items: center; justify-content: space-between;">
                    
                    <div style="flex-grow: 1;">
                        <span style="display: block; font-weight: 800; color: #fff; font-size: 1.1rem; margin-bottom: 4px;">${person}</span>
                        <!-- New Billing Line -->
                        <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 2px;">
                            Fact. Prevista: <span style="color: #fff; font-weight: 600;">${this.formatCurrencyCompact(stats.billing)}</span>
                        </div>
                        <div style="font-size: 0.75rem; color: #666;">
                            Ejecución Promedio: <span style="color: #ddd;">${Math.round(avgProgress)}%</span>
                        </div>
                    </div>

                    <div style="text-align: right; min-width: 80px;">
                        <span style="display: block; font-size: 0.7rem; color: #666; text-transform: uppercase;">Carga</span>
                        <span style="font-size: 1.8rem; font-weight: 900; color: var(--color-accent-blue); line-height: 1;">${Math.round(workloadPercent)}%</span>
                    </div>

                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    renderProjectTypeKPIs() {
        const container = document.getElementById('type-stats-container');
        if (!container) return;

        const typeStats = {};
        let totalBillingSystem = 0;

        this.filteredProjects.forEach(p => {
            // Use proper Type extracted from Column F
            let type = p.Type ? p.Type.toUpperCase() : 'OTROS';
            if (type === '') type = 'OTROS';

            if (!typeStats[type]) {
                typeStats[type] = { billing: 0, count: 0 };
            }
            typeStats[type].billing += p.FacturacionAmount;
            typeStats[type].count++;
            totalBillingSystem += p.FacturacionAmount;
        });

        const sortedTypes = Object.keys(typeStats).sort((a, b) => typeStats[b].billing - typeStats[a].billing);

        let html = `
            <div class="stats-card" style="background: var(--color-bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 20px; height: 100%;">
                <h3 style="color: var(--color-accent-blue); margin-bottom: 20px; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
                    📊 TIPO DE PROYECTO
                </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="text-align: left; color: #666; border-bottom: 1px solid #333;">
                            <th style="padding-bottom: 10px; font-weight: 500;">TIPO</th>
                            <th style="padding-bottom: 10px; font-weight: 500; text-align: right;">IMPORTE</th>
                            <th style="padding-bottom: 10px; font-weight: 500; text-align: right;">% PESO</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        sortedTypes.forEach(type => {
            const stats = typeStats[type];
            const weightPercent = totalBillingSystem > 0 ? (stats.billing / totalBillingSystem * 100) : 0;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px 0; font-weight: 600; color: #ddd;">${type}</td>
                    <td style="padding: 12px 0; text-align: right; color: #fff;">${this.formatCurrencyCompact(stats.billing)}</td>
                    <td style="padding: 12px 0; text-align: right;">
                        <span style="background: rgba(93, 120, 255, 0.1); color: var(--color-accent-blue); padding: 3px 8px; border-radius: 4px; font-weight: 700;">
                            ${Math.round(weightPercent)}%
                        </span>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    }

    renderProjectList() {
        const container = document.getElementById('projects-container');
        if (!container) return;

        container.innerHTML = '';
        if (this.filteredProjects.length === 0) {
            container.innerHTML = '<p class="no-data">No hay proyectos que mostrar.</p>';
            return;
        }

        const sortedProjects = [...this.filteredProjects].sort((a, b) => {
            if (!a.FinDate) return 1;
            if (!b.FinDate) return -1;
            return a.FinDate - b.FinDate;
        });

        const activeCount = sortedProjects.filter(p => !p.Status.toLowerCase().includes('completado')).length;

        let html = `<div class="projects-grid">`;
        html += sortedProjects.map(p => this.renderProjectCard(p)).join('');
        html += '</div>';
        html += `<div style="margin-top: 20px; font-size: 0.8rem; color: #666; text-align: center;">Mostrando ${sortedProjects.length} proyectos</div>`;

        container.innerHTML = html;
    }

    renderProjectCard(project) {
        const statusClass = project.Status.toLowerCase().includes('en curso') ? 'status-active' : (project.Status.toLowerCase().includes('pendiente') ? 'status-pending' : 'status-completed');
        const criticalClass = project.IsCritical ? 'critical' : '';
        const cliente = project.Cliente || 'Sin cliente';
        const marca = project.Marca || '';
        const status = project.Status || 'N/A';
        const puntoVenta = project['PUNTO VENTA'] || 'N/A';
        const tipo = project.Tipo || 'N/A';
        const finDate = project.Fin || 'N/A';
        const observaciones = project.Observaciones || '';
        const responsable = project.PROJECT || 'Sin Asignar';

        let daysLeftBadge = '';
        if (project.FinDate) {
            const days = Math.ceil((project.FinDate - new Date()) / (1000 * 60 * 60 * 24));
            if (days >= 0 && days <= 15) {
                daysLeftBadge = `<span style="font-size: 0.8rem; color: var(--color-accent-red); font-weight: bold; margin-left: auto;">⏱️ ${days} días</span>`;
            }
        }

        return `
            <div class="project-card ${criticalClass}" data-project="${project.id}">
                <div class="project-header">
                    <h4>${cliente} - ${marca}</h4>
                    <span class="status-badge ${statusClass}">${status}</span>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 12px; font-size: 0.9rem; color: var(--color-accent-blue);">
                    <strong style="margin-right: 5px;">👤 ${responsable}</strong>
                    ${daysLeftBadge}
                </div>
                <div class="project-meta">
                    <span class="meta-item">📍 ${puntoVenta}</span>
                    <span class="meta-item">🏷️ ${tipo}</span>
                </div>
                <div class="project-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width: ${project.Progress}%"></div></div>
                    <span class="progress-text">${Math.round(project.Progress)}%</span>
                </div>
                <div class="project-dates">
                    <div class="date-item"><strong>Fin:</strong> ${finDate}</div>
                </div>
                <div class="project-financial">
                    <div class="financial-item"><span>💰 Facturación:</span><strong>${this.formatCurrency(project.FacturacionAmount)}</strong></div>
                    <div class="financial-item"><span>📊 Margen:</span><strong class="${project.Margin >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(project.Margin)}</strong></div>
                </div>
                ${observaciones ? `<div class="project-notes">💬 ${observaciones}</div>` : ''}
                <button class="btn btn-outline view-details-btn" onclick="dashboard.openProjectModal('${project.id}')" style="margin-top: 15px; width: 100%;">
                    👁️ VER VISUAL
                </button>
            </div>`;
    }
    renderCalendar() {
        const container = document.getElementById('calendar-container');
        if (!container) return;
        container.innerHTML = '';
        container.className = '';

        // Header with Export Button
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.marginBottom = '20px';

        const title = document.createElement('h2');
        title.style.margin = '0';
        title.textContent = 'CALENDARIO DE PROYECTOS';
        headerDiv.appendChild(title);

        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-outline'; // Reuse existing style
        exportBtn.style.width = 'auto'; // Auto width for this one
        exportBtn.innerHTML = '📧 COPIAR PARA EMAIL';
        exportBtn.onclick = () => this.exportCalendar();
        headerDiv.appendChild(exportBtn);

        container.appendChild(headerDiv);

        const wrapper = document.createElement('div');
        wrapper.className = 'calendar-wrapper';
        wrapper.id = 'calendar-export-target'; // ID for html2canvas
        wrapper.style.backgroundColor = '#1e1e1e'; // Ensure background for screenshot
        wrapper.style.padding = '20px';

        const today = new Date();
        // Render 3 Months
        for (let i = 0; i < 3; i++) {
            const currentMonthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);

            const monthBlock = document.createElement('div');
            monthBlock.className = 'month-block dashboard-section';
            monthBlock.style.marginBottom = '40px';
            monthBlock.style.display = 'block';
            monthBlock.style.pageBreakInside = 'avoid'; // specific for printing/export

            // Month Header
            const monthTitle = document.createElement('h3');
            monthTitle.className = 'month-title';
            monthTitle.textContent = currentMonthDate.toLocaleDateString(CONFIG.DATE_LOCALE, { month: 'long', year: 'numeric' });
            monthBlock.appendChild(monthTitle);

            // Grid
            const grid = document.createElement('div');
            grid.className = 'calendar-grid';

            // Days Header
            const daysOfWeek = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
            daysOfWeek.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-header-cell';
                header.textContent = day;
                grid.appendChild(header);
            });

            const year = currentMonthDate.getFullYear();
            const month = currentMonthDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startOffset = firstDay === 0 ? 6 : firstDay - 1;

            // Empty cells
            for (let j = 0; j < startOffset; j++) {
                const empty = document.createElement('div');
                empty.className = 'calendar-day empty';
                grid.appendChild(empty);
            }

            // Days
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDate = new Date(year, month, day);
                const dayEl = document.createElement('div');
                dayEl.className = 'calendar-day';

                const dayNum = document.createElement('div');
                dayNum.className = 'day-number';
                dayNum.textContent = day;

                if (dayDate.toDateString() === new Date().toDateString()) {
                    dayNum.style.color = 'var(--color-accent-yellow)';
                    dayNum.style.fontWeight = '900';
                    dayEl.style.border = '1px solid var(--color-accent-yellow)';
                }
                dayEl.appendChild(dayNum);

                // Find Events: PROMPT: "INICIO (Green) y ENTREGA (Red)"
                // We need to parse 'Previos' date if not already existing. 
                // Assuming 'PreviosDate' isn't parsed, we try to parse it here on the fly if needed, or rely on stored logic.
                // NOTE: filteredProjects should already have 'PreviosDate' if we parsed it. 
                // Let's check 'this.projects.map' in 'loadProjects' usually parses. 
                // If not, we do a quick check.

                this.filteredProjects.forEach(p => {
                    // Check Start (Inicio) - Green
                    // Attempt to parse if missing (safeguard)
                    let startDate = p.PreviosDate;
                    if (!startDate && p.Previos) startDate = this.parseSpanishDate(p.Previos);

                    if (startDate && startDate.toDateString() === dayDate.toDateString()) {
                        this.createEventPill(dayEl, p, 'INICIO', '#10B981'); // Green
                    }

                    // Check End (Entrega) - Red
                    if (p.FinDate && p.FinDate.toDateString() === dayDate.toDateString()) {
                        this.createEventPill(dayEl, p, 'ENTREGA', '#EF4444'); // Red
                    }
                });

                grid.appendChild(dayEl);
            }
            monthBlock.appendChild(grid);
            wrapper.appendChild(monthBlock);
        }
        container.appendChild(wrapper);
    }

    createEventPill(container, project, type, color) {
        const pill = document.createElement('div');
        pill.className = 'event-pill';
        pill.style.borderLeft = '3px solid ' + color;
        pill.style.backgroundColor = 'rgba(255,255,255,0.05)';
        pill.style.marginBottom = '2px';
        pill.style.padding = '2px 4px';
        pill.style.fontSize = '0.7rem';
        pill.style.cursor = 'pointer';
        pill.style.whiteSpace = 'nowrap';
        pill.style.overflow = 'hidden';
        pill.style.textOverflow = 'ellipsis';

        // LABEL: Point of Sale - Responsible
        const pv = (project['PUNTO VENTA'] || '').trim();
        const responsible = (project.PROJECT || '').split(' ')[0];
        const label = (pv ? pv : 'Sin PV') + ' - ' + (responsible || 'S/A');

        pill.textContent = label;
        pill.title = type + ': ' + label + ' (' + (project.Cliente || '') + ')';
        pill.onclick = (e) => { e.stopPropagation(); this.openProjectModal(project.id); };
        container.appendChild(pill);
    }

    exportCalendar() {
        const element = document.getElementById('calendar-export-target');
        if (!element || !window.html2canvas) {
            alert('Error: Librería de captura no cargada.');
            return;
        }

        // 1. Transparent Background
        html2canvas(element, {
            backgroundColor: null, // Transparent
            scale: 2 // High resolution
        }).then(canvas => {
            canvas.toBlob(blob => {
                if (!blob) return;
                try {
                    const item = new ClipboardItem({ 'image/png': blob });
                    navigator.clipboard.write([item]).then(() => {

                        // 2. Generate Detailed Email Body
                        const emailBody = this.generateDetailedEmailBody();
                        const subject = encodeURIComponent("📅 Calendario de Proyectos y Tareas - THINK BARCELONA");

                        const confirm = window.confirm('✅ Calendario (Transparente) copiado al portapapeles.\n\n¿Abrir correo con el resumen completo de tareas?');
                        if (confirm) {
                            window.location.href = `mailto:?subject=${subject}&body=${emailBody}`;
                        }
                    }).catch(err => {
                        console.error('Clipboard error:', err);
                        alert('No se pudo copiar automáticamente. Intenta guardar la imagen manualmente.');
                        this.downloadImage(canvas);
                    });
                } catch (e) {
                    this.downloadImage(canvas);
                }
            });
        });
    }

    generateDetailedEmailBody() {
        let text = "Hola equipo,\n\nAdjunto el calendario actualizado con las fechas clave de los proyectos en curso.\n\n📋 RESUMEN DETALLADO POR RESPONSABLE:\n\n";

        // Group by Responsible Person (Column C: PROJECT)
        const byPerson = {};

        this.filteredProjects.forEach(p => {
            const person = (p.PROJECT || 'Sin Asignar').trim();
            if (!byPerson[person]) byPerson[person] = [];
            byPerson[person].push(p);
        });

        // Sort People Alphabetically
        Object.keys(byPerson).sort().forEach(person => {
            text += `👤 ${person.toUpperCase()}\n`;
            text += `================================\n`;

            // Sort projects for this person (by End Date)
            const projects = byPerson[person].sort((a, b) => (a.FinDate || 0) - (b.FinDate || 0));

            projects.forEach(p => {
                const client = p.Cliente || 'Cliente';
                const brand = p.Marca ? `(${p.Marca})` : '';
                const pv = p['PUNTO VENTA'] || 'Sin PV';
                const type = p.Tipo || 'General';
                const status = (p.Status || 'N/A').toUpperCase();
                const dateStart = p.Previos || '-';
                const dateEnd = p.Fin || 'Sin fecha';
                const obs = p.Observaciones ? `   ⚠️ NOTA: ${p.Observaciones}` : '';

                // Icon based on status
                let icon = '🔹';
                if (status.includes('CURSO')) icon = '⚡';
                if (status.includes('PENDIENTE')) icon = '⏳';
                if (status.includes('COMPLETADO')) icon = '✅';
                if (p.IsCritical) icon = '🔥';

                // Rich Format as requested ("Ampliar info")
                text += `${icon} ${client} ${brand}\n`;
                text += `   📍 ${pv}  •  🏷️ ${type}\n`;
                text += `   📅 Inicio: ${dateStart}  ➜  🏁 Entrega: ${dateEnd}\n`;
                text += `   📊 Estado: ${status}\n`;
                if (obs) text += `${obs}\n`;
                text += `--------------------------------\n`;
            });
            text += `\n`;
        });

        text += "\nSaludos,\nGestión de Proyectos - THINK BARCELONA";
        return encodeURIComponent(text);
    }

    downloadImage(canvas) {
        const link = document.createElement('a');
        link.download = 'calendario-proyectos.png';
        link.href = canvas.toDataURL();
        link.click();
        alert('Imagen descargada. Adjúntala en tu correo.');
    }

    openProjectModal(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        document.getElementById('modal-project-title').textContent = project.Marca || project.Cliente || 'Sin nombre';
        document.getElementById('modal-client').textContent = project.Cliente || '-';
        document.getElementById('modal-brand').textContent = project.Marca || '-';
        document.getElementById('modal-person').textContent = project.PROJECT || '-';
        const statusSpan = document.getElementById('modal-status');
        statusSpan.textContent = project.Status || 'N/A';
        statusSpan.className = 'status badge ' + this.getStatusClass(project.Status);
        const inicioStr = project.Previos || '-';
        const finStr = project.Fin || '-';
        document.getElementById('modal-dates').innerHTML = 'Inicio: ' + inicioStr + ' <br> Fin: ' + finStr;
        document.getElementById('modal-notes').textContent = project.Observaciones || 'Sin observaciones';
        const presentationContainer = document.getElementById('modal-presentation-container');
        let embedContent = '';
        const rawContent = (project.presentationHtml || '').trim();
        if (rawContent.length > 5) {
            if (rawContent.toLowerCase().startsWith('http')) {
                const url = rawContent;
                embedContent = '<iframe loading="lazy" class="canva-embed" src="' + url + '" allowfullscreen="allowfullscreen" allow="fullscreen" style="width: 100%; height: 100%; border: none;"></iframe>';
            } else { embedContent = rawContent; }
            presentationContainer.innerHTML = embedContent;
            const fallbackHtml = rawContent.toLowerCase().startsWith('http') ? '<div style="text-align: center; margin-top: 10px;"><a href="' + rawContent + '" target="_blank" class="text-xs text-muted" style="color: #aaa; text-decoration: underline;">¿No carga? Abrir en nueva pestaña ↗️</a></div>' : '';
            if (!document.getElementById('presentation-fallback')) {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.id = 'presentation-fallback';
                fallbackDiv.innerHTML = fallbackHtml;
                presentationContainer.parentNode.appendChild(fallbackDiv);
            } else { document.getElementById('presentation-fallback').innerHTML = fallbackHtml; }
        } else {
            presentationContainer.innerHTML = '<div class="no-presentation"><p>No hay presentación visual vinculada a este proyecto.</p></div>';
            if (document.getElementById('presentation-fallback')) document.getElementById('presentation-fallback').innerHTML = '';
        }
        const modal = document.getElementById('project-modal');
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
        const closeBtn = modal.querySelector('.close-modal');
        const closeModal = () => { modal.style.display = 'none'; document.body.classList.remove('modal-open'); presentationContainer.innerHTML = ''; if (document.getElementById('presentation-fallback')) document.getElementById('presentation-fallback').innerHTML = ''; };
        closeBtn.onclick = closeModal;
        window.onclick = (event) => { if (event.target == modal) closeModal(); };
    }

    renderBillingForecast() {
        const container = document.getElementById('billing-container');
        if (!container) return;
        const byMonth = {};
        const clientStats = this.calculateClientStats();
        this.filteredProjects.forEach(p => {
            if (p.FinDate) {
                const monthKey = p.FinDate.getFullYear() + '-' + String(p.FinDate.getMonth() + 1).padStart(2, '0');
                if (!byMonth[monthKey]) byMonth[monthKey] = { billing: 0, costs: 0, projects: [] };
                byMonth[monthKey].billing += p.FacturacionAmount;
                byMonth[monthKey].costs += p.TotalCost;
                byMonth[monthKey].projects.push(p);
            }
        });
        let html = '<div style="display: grid; gap: 30px;">';
        html += '<div class="stats-card section-card"><h3>📅 PREVISIÓN MENSUAL: FACTURACIÓN & MARGEN</h3><table class="billing-table"><thead><tr><th>Mes</th><th>Proyectos</th><th>Facturación</th><th>Costes</th><th>Margen</th><th>%</th></tr></thead><tbody>';
        Object.keys(byMonth).sort().forEach(month => {
            const data = byMonth[month];
            const margin = data.billing - data.costs;
            const marginP = data.billing > 0 ? (margin / data.billing * 100) : 0;
            const marginClass = marginP >= 20 ? 'positive' : 'negative';
            html += '<tr><td>' + this.formatMonthYear(month) + '</td><td>' + data.projects.length + '</td><td>' + this.formatCurrency(data.billing) + '</td><td>' + this.formatCurrency(data.costs) + '</td><td class="' + marginClass + '">' + this.formatCurrency(margin) + '</td><td class="' + marginClass + '"><strong>' + Math.round(marginP) + '%</strong></td></tr>';
        });
        html += '</tbody></table></div>';
        html += '<div class="stats-card section-card"><h3>🏢 DETALLE POR CLIENTE: RENTABILIDAD</h3><table class="billing-table"><thead><tr><th>Cliente</th><th>Proy</th><th>Facturación</th><th>Margen</th><th>% Margen</th><th>Análisis</th></tr></thead><tbody>';
        Object.keys(clientStats).sort((a, b) => clientStats[b].billing - clientStats[a].billing).forEach(client => {
            const stats = clientStats[client];
            const marginPercent = stats.billing > 0 ? (stats.margin / stats.billing * 100) : 0;
            const marginClass = marginPercent >= 20 ? '#10B981' : (marginPercent > 0 ? 'var(--color-accent-yellow)' : 'var(--color-accent-red)');
            const barWidth = Math.min(Math.max(marginPercent, 0), 100);
            html += '<tr><td style="font-weight: bold;">' + client + '</td><td style="text-align: center;">' + stats.count + '</td><td>' + this.formatCurrency(stats.billing) + '</td><td style="color: ' + marginClass + '">' + this.formatCurrency(stats.margin) + '</td><td style="font-weight: bold; color: ' + marginClass + '">' + Math.round(marginPercent) + '%</td><td style="width: 150px;"><div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;"><div style="background: ' + marginClass + '; height: 100%; width: ' + barWidth + '%;"></div></div></td></tr>';
        });
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
    }

    renderCriticalTasks() {
        const container = document.getElementById('critical-container');
        if (!container) return;
        const critical = this.filteredProjects.filter(p => p.IsCritical);
        if (critical.length === 0) { container.innerHTML = '<p class="no-data">✅ No hay tareas críticas en este momento</p>'; return; }
        critical.sort((a, b) => (a.FinDate || Infinity) - (b.FinDate || Infinity));
        let html = '<div class="critical-list">';
        critical.forEach(p => {
            const daysLeft = p.FinDate ? Math.ceil((p.FinDate - new Date()) / (1000 * 60 * 60 * 24)) : null;
            html += '<div class="critical-item"><div class="critical-header"><h4>🚨 ' + p.Cliente + ' - ' + p.Marca + '</h4>' + (daysLeft !== null ? '<span class="days-left">' + daysLeft + ' días</span>' : '') + '</div><div class="critical-info"><p><strong>Responsable:</strong> ' + p.PROJECT + '</p><p><strong>Fecha fin:</strong> ' + p.Fin + '</p>' + (p.Observaciones ? '<p class="alert-note">⚠️ ' + p.Observaciones + '</p>' : '') + '</div></div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    calculateClientStats() {
        const clientStats = {};
        this.filteredProjects.forEach(p => {
            const clientName = (p.Cliente || 'Otros').trim();
            if (!clientStats[clientName]) clientStats[clientName] = { count: 0, billing: 0, margin: 0 };
            clientStats[clientName].count++;
            clientStats[clientName].billing += p.FacturacionAmount;
            clientStats[clientName].margin += p.Margin;
        });
        return clientStats;
    }

    groupBy(array, key) { return array.reduce((result, item) => { const group = item[key] || 'Sin asignar'; if (!result[group]) result[group] = []; result[group].push(item); return result; }, {}); }
    getStatusClass(status) { if (!status) return 'status-completed'; const s = status.toLowerCase(); if (s.includes('curso')) return 'status-active'; if (s.includes('pendiente')) return 'status-pending'; return 'status-completed'; }
    formatDate(date) { if (!date) return '-'; if (typeof date === 'string') return date; return date.toLocaleDateString(CONFIG.DATE_LOCALE); }
    formatCurrency(amount) { return new Intl.NumberFormat(CONFIG.DATE_LOCALE, { style: 'currency', currency: CONFIG.CURRENCY, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount); }
    formatCurrencyCompact(amount) { return new Intl.NumberFormat(CONFIG.DATE_LOCALE, { style: 'currency', currency: CONFIG.CURRENCY, notation: "compact", compactDisplay: "short" }).format(amount); }
    formatMonthYear(monthKey) { const [year, month] = monthKey.split('-'); const date = new Date(year, parseInt(month) - 1); return date.toLocaleDateString(CONFIG.DATE_LOCALE, { month: 'long', year: 'numeric' }); }
    updateConnectionStatus(connected) { const statusEl = document.getElementById('connection-status'); const connectBtn = document.getElementById('connect-btn'); const disconnectBtn = document.getElementById('disconnect-btn'); if (connected) { statusEl.textContent = '🟢 CONECTADO'; statusEl.className = 'status connected control-btn'; connectBtn.style.display = 'none'; disconnectBtn.style.display = 'flex'; } else { statusEl.textContent = '🔴 OFF-LINE'; statusEl.className = 'status disconnected control-btn'; connectBtn.style.display = 'flex'; disconnectBtn.style.display = 'none'; } }
    updateLastRefreshTime() { const timeEl = document.getElementById('last-refresh'); if (timeEl) { const now = new Date(); timeEl.textContent = 'Última actualización: ' + now.toLocaleTimeString(CONFIG.DATE_LOCALE); } }
    startAutoRefresh() { if (this.refreshInterval) return; this.refreshInterval = setInterval(() => { this.loadProjects(); }, CONFIG.REFRESH_INTERVAL); }
    stopAutoRefresh() { if (this.refreshInterval) { clearInterval(this.refreshInterval); this.refreshInterval = null; } }
    showLoading(show) { const loader = document.getElementById('loading-overlay'); if (loader) { loader.style.display = show ? 'flex' : 'none'; } }
    showNotification(message, type = 'info') { const notification = document.createElement('div'); notification.className = 'notification ' + type; notification.textContent = message; document.body.appendChild(notification); setTimeout(() => { notification.classList.add('show'); }, 10); setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); }, 3000); }
    showError(message) { this.showNotification(message, 'error'); }
    switchView(view) { document.querySelectorAll('[data-view]').forEach(btn => { btn.classList.toggle('active', btn.dataset.view === view); }); document.querySelectorAll('.dashboard-section').forEach(section => { section.style.display = section.id === (view + '-section') ? 'block' : 'none'; }); if (view === 'calendar') { this.renderCalendar(); } }
}

document.addEventListener('DOMContentLoaded', () => { window.dashboard = new ProjectDashboard(); dashboard.init(); });
