import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log the incoming request
  logger.info(
    `Incoming request: ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`
  );

  // Capture response details
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInMs = duration[0] * 1000 + duration[1] / 1e6;
    logger.info(
      `Response status: ${res.statusCode} - Response time: ${durationInMs.toFixed(2)}ms`
    );
  });

  next();
};

export default requestLogger;
