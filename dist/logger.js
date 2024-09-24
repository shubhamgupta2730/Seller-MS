"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.logger = void 0;
const winston_1 = require("winston");
const path_1 = __importDefault(require("path"));
const { combine, timestamp, printf, errors } = winston_1.format;
// Define custom format
const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} ${level}: ${stack || message}`;
});
// Create the logger instance
const logger = (0, winston_1.createLogger)({
    level: 'info', // Set the default log level
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), // Capture stack trace for errors
    customFormat // Use custom format for logs
    ),
    transports: [
        new winston_1.transports.Console(), // Log to console
        new winston_1.transports.File({
            filename: path_1.default.join(__dirname, '..', 'logs', 'error.log'),
            level: 'error',
        }), // Log errors to file
        new winston_1.transports.File({
            filename: path_1.default.join(__dirname, '..', 'logs', 'combined.log'),
        }), // Log all messages to combined file
    ],
});
exports.logger = logger;
// Define the stream for morgan
const stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.stream = stream;
