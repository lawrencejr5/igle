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
exports.remove_activity = exports.get_user_activities = exports.create_activity = void 0;
const activity_1 = __importDefault(require("../models/activity"));
const create_activity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const { type, title, message, metadata } = req.body;
        if (!type || !title)
            return res.status(404).json({ msg: "Invalid input fields" });
        const activity = yield activity_1.default.create({
            type,
            user,
            title,
            message,
            metadata,
        });
        res.status(200).json({ msg: "Activity registered", activity });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.create_activity = create_activity;
const get_user_activities = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const activities = yield activity_1.default.find({ user });
        res
            .status(200)
            .json({ msg: "Success", row_count: activities.length, activities });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.get_user_activities = get_user_activities;
const remove_activity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const { activity_id } = req.query;
        if (!activity_id)
            return res.status(404).json({ msg: "Activity id not provided" });
        const deleted_activity = yield activity_1.default.findByIdAndDelete(activity_id, {
            user,
        });
        res.status(200).json({ msg: "Activity deleted", deleted_activity });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.remove_activity = remove_activity;
