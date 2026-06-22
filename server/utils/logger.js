/**
 * Centralized Logging System
 * Handles application-wide logging with different levels and transports
 */

const fs = require('fs');
const path = require('path');

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  TRACE: 'TRACE'
};

const LOG_LEVEL_PRIORITY = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

class Logger {
  constructor(options = {}) {
    this.minLevel = LOG_LEVEL_PRIORITY[options.level || 'INFO'];
    this.logDir = options.logDir || path.join(__dirname, '../../logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 10;
    this.context = options.context || 'APP';

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.errorLogFile = path.join(this.logDir, 'error.log');
    this.combinedLogFile = path.join(this.logDir, 'combined.log');
    this.securityLogFile = path.join(this.logDir, 'security.log');
  }

  /**
   * Format log message
   */

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      context: this.context,
      message,
      data,
      pid: process.pid
    };
  }

  /**
   * Write to file with rotation support
   */

  writeToFile(filePath, content) {
    try {
      // Check file size and rotate if needed
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxFileSize) {
          this.rotateLog(filePath);
        }
      }

      fs.appendFileSync(
        filePath,
        JSON.stringify(content) + '\n',
        { encoding: 'utf8' }
      );
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  /**
   * Rotate log files
   */
  rotateLog(filePath) {
    try {
      const dir = path.dirname(filePath);
      const name = path.basename(filePath, path.extname(filePath));
      const ext = path.extname(filePath);

      // Generate timestamp for rotated file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const rotatedPath = path.join(dir, `${name}.${timestamp}${ext}`);

      fs.renameSync(filePath, rotatedPath);

      // Clean old rotated files
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith(name))
        .sort()
        .reverse();

      if (files.length > this.maxFiles) {
        files.slice(this.maxFiles).forEach(f => {
          fs.unlinkSync(path.join(dir, f));
        });
      }
    } catch (error) {
      console.error('Failed to rotate log:', error.message);
    }
  }

  /**
   * Log message at specific level
   */
  log(level, message, data = {}) {
    const priority = LOG_LEVEL_PRIORITY[level] || LOG_LEVEL_PRIORITY.INFO;

    if (priority > this.minLevel) {
      return; // Skip if below min level
    }

    const logEntry = this.formatMessage(level, message, data);

    // Console output for development
    const color = {
      ERROR: '\x1b[31m',  // Red
      WARN: '\x1b[33m',   // Yellow
      INFO: '\x1b[32m',   // Green
      DEBUG: '\x1b[36m',  // Cyan
      TRACE: '\x1b[37m'   // White
    };

    const colorCode = color[level] || '';
    const resetColor = '\x1b[0m';

    console.log(
      `${colorCode}[${logEntry.timestamp}] ${level}${resetColor}`,
      message,
      Object.keys(data).length > 0 ? data : ''
    );

    // File logging
    this.writeToFile(this.combinedLogFile, logEntry);

    // Separate error log
    if (level === 'ERROR') {
      this.writeToFile(this.errorLogFile, logEntry);
    }
  }

  /**
   * Security-specific logging
   */
  security(message, data = {}) {
    const logEntry = this.formatMessage('SECURITY', message, {
      ...data,
      type: 'SECURITY_EVENT'
    });

    console.warn(`[${logEntry.timestamp}] SECURITY: ${message}`, data);
    this.writeToFile(this.securityLogFile, logEntry);
    this.writeToFile(this.combinedLogFile, logEntry);
  }

  // Convenience methods
  error(message, data) {
    this.log(LOG_LEVELS.ERROR, message, data);
  }

  warn(message, data) {
    this.log(LOG_LEVELS.WARN, message, data);
  }

  info(message, data) {
    this.log(LOG_LEVELS.INFO, message, data);
  }

  debug(message, data) {
    this.log(LOG_LEVELS.DEBUG, message, data);
  }

  trace(message, data) {
    this.log(LOG_LEVELS.TRACE, message, data);
  }
}

// Global logger instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  context: 'IMS-SaaS'
});

/**
 * Express middleware for request/response logging
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')?.substring(0, 100),
      userId: req.user?._id
    };

    if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path}`, logData);
    } else if (duration > 1000) {
      logger.info(`${req.method} ${req.path} (slow)`, logData);
    } else if (process.env.LOG_LEVEL === 'DEBUG') {
      logger.debug(`${req.method} ${req.path}`, logData);
    }
  });

  next();
};

/**
 * Error logging middleware
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack?.split('\n').slice(0, 5),
    method: req.method,
    path: req.path,
    userId: req.user?._id,
    ip: req.ip
  });

  next(err);
};

module.exports = {
  logger,
  Logger,
  requestLogger,
  errorLogger,
  LOG_LEVELS
};