export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static logLevel: LogLevel = process.env.DEBUG === 'true' ? LogLevel.DEBUG : LogLevel.INFO;
  
  static log(level: LogLevel, message: string, data?: any) {
    if (level < this.logLevel) return;
    
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    
    // Log to stderr to avoid interfering with MCP communication
    console.error(`[${timestamp}] [${levelStr}] ${message}${logData}`);
  }

  static debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  static info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  static warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  static error(message: string, error?: any) {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error;
    this.log(LogLevel.ERROR, message, errorData);
  }
}