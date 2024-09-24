"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = void 0;
const categoryModel_1 = __importDefault(require("../../../models/categoryModel"));
const getAllCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, sortBy = 'name', order = 'asc', page = 1, limit = 10, } = req.query;
        const searchQuery = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};
        const sortOrder = order === 'asc' ? 1 : -1;
        const categories = yield categoryModel_1.default.aggregate([
            { $match: Object.assign(Object.assign({}, searchQuery), { isActive: true }) },
            { $sort: { [sortBy]: sortOrder } },
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
            { $project: { name: 1, description: 1 } },
        ]);
        const totalCategories = yield categoryModel_1.default.countDocuments(Object.assign(Object.assign({}, searchQuery), { isActive: true }));
        const totalPages = Math.ceil(totalCategories / Number(limit));
        res.json({
            categories,
            pagination: {
                totalCategories,
                totalPages,
                currentPage: Number(page),
                pageSize: Number(limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAllCategories = getAllCategories;
