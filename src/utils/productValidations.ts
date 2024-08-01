// src/utils/productValidations.ts
import Joi from 'joi';
import mongoose from 'mongoose';

export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  MRP: Joi.number().greater(0).required().messages({
    'number.greater': 'MRP must be greater than 0',
  }),
  discount: Joi.number().min(0).max(100).required().messages({
    'number.min': 'Discount must be between 0 and 100',
  }),
  quantity: Joi.number().integer().greater(0).required().messages({
    'number.greater': 'Quantity must be greater than 0',
    'number.integer': 'Quantity must be a non-negative integer',
  }),
  categoryId: Joi.string()
    .optional()
    .allow(null)
    .custom((value, helpers) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }),
}).messages({
  'any.invalid': 'Invalid categoryId',
  'any.required': 'Missing required fields',
});
