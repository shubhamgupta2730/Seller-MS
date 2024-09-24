"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const logger_1 = require("./logger");
// import morgan from 'morgan';
// import requestLogger from './middleware/requestLogger';
const sellerRoutes_1 = __importDefault(require("./routes/sellerRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Skip logging during tests
// const skip = () => {
//   const env = process.env.NODE_ENV || 'development';
//   return env === 'test';
// };
// Connect to database
(0, db_1.default)();
// Middleware
app.use(express_1.default.json());
// Define the stream object with the expected write function
// const stream = {
//   write: (message: string) => {
//     logger.info(message.trim());
//   },
// };
// Use morgan middleware for logging HTTP requests
// app.use(morgan('combined', { stream, skip }));
// app.use(requestLogger);
// Routes
app.use('/api/v1/seller', sellerRoutes_1.default);
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on http://localhost:${PORT}`);
});
