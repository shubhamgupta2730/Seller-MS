"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
const requestLogger = (req, res, next) => {
    // Log the incoming request
    logger_1.logger.info(`Incoming request: ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`);
    // Capture response details
    const start = process.hrtime();
    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationInMs = duration[0] * 1000 + duration[1] / 1e6;
        logger_1.logger.info(`Response status: ${res.statusCode} - Response time: ${durationInMs.toFixed(2)}ms`);
    });
    next();
};
exports.default = requestLogger;
