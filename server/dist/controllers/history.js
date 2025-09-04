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
exports.delete_history = exports.get_user_history = exports.add_history = void 0;
const history_1 = __importDefault(require("../models/history"));
const mongoose_1 = __importDefault(require("mongoose"));
// Create a new history entry
const add_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { place_id, place_name, place_sub_name } = req.body;
        if (!place_id || !place_name || !place_sub_name) {
            res.status(400).json({ msg: "place_id and place_name are required." });
            return;
        }
        const history = yield history_1.default.create({
            place_id,
            place_name,
            place_sub_name,
            user: user_id,
        });
        res.status(201).json({ msg: "History added successfully.", history });
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to add history.", err: err.message });
    }
});
exports.add_history = add_history;
const get_user_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const histories = yield history_1.default.aggregate([
            { $match: { user: new mongoose_1.default.Types.ObjectId(user_id) } }, // ✅ cast to ObjectId
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: "$place_id",
                    latest: { $first: "$$ROOT" },
                },
            },
            { $replaceRoot: { newRoot: "$latest" } },
            { $limit: 5 },
            { $sort: { createdAt: -1 } },
        ]);
        res
            .status(200)
            .json({ msg: "success", rowCount: histories.length, histories });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_history = get_user_history;
// Delete a history entry
const delete_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { place_id } = req.query;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const history = yield history_1.default.deleteMany({
            user: user_id,
            place_id,
        });
        if (!history) {
            res.status(404).json({ msg: "History not found." });
            return;
        }
        res.status(200).json({ msg: "History deleted successfully." });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.delete_history = delete_history;
