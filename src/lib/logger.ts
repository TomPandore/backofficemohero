/**
 * Service de journalisation personnalisé pour l'application.
 * Permet de tracer les actions importantes et de faciliter le débogage.
 */

type LogLevel = 'info' | 'error' | 'warn' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogSize = 100;
  private enableConsoleOutput: boolean;

  constructor(enableConsoleOutput = true) {
    this.enableConsoleOutput = enableConsoleOutput;
  }

  log(message: string, data?: any) {
    this.addEntry('info', message, data);
    if (this.enableConsoleOutput) {
      console.log(`[INFO] ${message}`, data || '');
    }
  }

  error(message: string, data?: any) {
    this.addEntry('error', message, data);
    if (this.enableConsoleOutput) {
      console.error(`[ERROR] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any) {
    this.addEntry('warn', message, data);
    if (this.enableConsoleOutput) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  }

  debug(message: string, data?: any) {
    this.addEntry('debug', message, data);
    if (this.enableConsoleOutput) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }

  private addEntry(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.safeStringify(data) : undefined
    };

    this.logs.push(entry);
    
    // Limiter la taille des logs
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
  }

  private safeStringify(obj: any): any {
    try {
      // Éviter les erreurs de circularité dans les objets
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }
        // Limiter la longueur des chaînes
        if (typeof value === 'string' && value.length > 1000) {
          return value.substring(0, 1000) + '... [truncated]';
        }
        return value;
      }));
    } catch (e) {
      return `[Non-serializable: ${e instanceof Error ? e.message : String(e)}]`;
    }
  }

  dumpLogs() {
    console.group('Application Logs');
    this.logs.forEach(entry => {
      const color = this.getColorForLevel(entry.level);
      console.log(
        `%c${entry.timestamp} [${entry.level.toUpperCase()}]%c ${entry.message}`,
        `color: ${color}; font-weight: bold;`,
        'color: inherit;'
      );
      if (entry.data) {
        console.log(entry.data);
      }
    });
    console.groupEnd();
  }

  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mohero_logs_${new Date().toISOString().replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case 'info': return '#2563eb';
      case 'error': return '#dc2626';
      case 'warn': return '#f59e0b';
      case 'debug': return '#6b7280';
      default: return 'inherit';
    }
  }
}

export const logger = new Logger(true);

// Initialiser le logger
console.log('%c[MOHERO LOGGER] Initialized', 'color: green; font-weight: bold');
logger.log('Logger initialisé'); 