export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;

  static setLevel(level: LogLevel): void {
    this.level = level;
  }

  static error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  static warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log(LogLevel.WARN, message, ...args);
    }
  }

  static info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log(LogLevel.INFO, message, ...args);
    }
  }

  static debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log(LogLevel.DEBUG, message, ...args);
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }

  private static log(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.DEBUG:
        console.debug(prefix, message, ...args);
        break;
    }
  }
}