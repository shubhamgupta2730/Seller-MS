"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
// src/utils/productValidations.ts
const joi_1 = __importDefault(require("joi"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.createProductSchema = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().optional(),
    MRP: joi_1.default.number().greater(0).required().messages({
        'number.greater': 'MRP must be greater than 0',
    }),
    discount: joi_1.default.number().min(0).max(100).required().messages({
        'number.min': 'Discount must be between 0 and 100',
    }),
    quantity: joi_1.default.number().integer().greater(0).required().messages({
        'number.greater': 'Quantity must be greater than 0',
        'number.integer': 'Quantity must be a non-negative integer',
    }),
    categoryId: joi_1.default.string()
        .optional()
        .allow(null)
        .custom((value, helpers) => {
        if (value && !mongoose_1.default.Types.ObjectId.isValid(value)) {
            return helpers.error('any.invalid');
        }
        return value;
    }),
}).messages({
    'any.invalid': 'Invalid categoryId',
    'any.required': 'Missing required fields',
});
