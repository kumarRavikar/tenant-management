type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  }

  info(message: string, ...optionalParams: unknown[]): void {
    console.log(this.formatMessage('info', message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(this.formatMessage('warn', message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    console.error(this.formatMessage('error', message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message), ...optionalParams);
    }
  }
}

export const logger = new Logger();

