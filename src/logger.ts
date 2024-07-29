import { createLogger, format, transports } from 'winston';
import path from 'path';

const { combine, timestamp, printf, errors } = format;

// Define custom format
const customFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

// Create the logger instance
const logger = createLogger({
  level: 'info', // Set the default log level
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // Capture stack trace for errors
    customFormat // Use custom format for logs
  ),
  transports: [
    new transports.Console(), // Log to console
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'error.log'),
      level: 'error',
    }), // Log errors to file
    new transports.File({
      filename: path.join(__dirname, '..', 'logs', 'combined.log'),
    }), // Log all messages to combined file
  ],
});

// Define the stream for morgan
const stream: { write: (message: string) => void } = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger, stream };
