// ===========================================
// Frontend Logger
// ===========================================

class FrontendLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000; // Keep last 1000 logs in memory
    }

    log(level, message, data = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(logEntry);

        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '');

        // Store in localStorage for persistence
        this.saveLogs();
    }

    info(message, data) {
        this.log('info', message, data);
    }

    warn(message, data) {
        this.log('warn', message, data);
    }

    error(message, data) {
        this.log('error', message, data);
    }

    saveLogs() {
        try {
            // Keep only last 100 logs in localStorage to avoid quota issues
            const logsToSave = this.logs.slice(-100);
            localStorage.setItem('frontend_logs', JSON.stringify(logsToSave));
        } catch (e) {
            console.error('Failed to save logs to localStorage:', e);
        }
    }

    getLogs() {
        return this.logs;
    }

    downloadLogs() {
        const logsText = this.logs.map(log =>
            `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.data ? ' - ' + JSON.stringify(log.data) : ''}`
        ).join('\n');

        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `frontend-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearLogs() {
        this.logs = [];
        localStorage.removeItem('frontend_logs');
    }
}

// Create global logger instance
const logger = new FrontendLogger();

// Load saved logs from localStorage
try {
    const savedLogs = localStorage.getItem('frontend_logs');
    if (savedLogs) {
        logger.logs = JSON.parse(savedLogs);
    }
} catch (e) {
    console.error('Failed to load logs from localStorage:', e);
}

// Log page load
logger.info('Application loaded');

// Log errors globally
window.addEventListener('error', (event) => {
    logger.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
    });
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
    });
});

// Make logger available globally
window.logger = logger;

export { logger };
