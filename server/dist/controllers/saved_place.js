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
exports.delete_saved_place = exports.get_saved_places = exports.save_place = void 0;
const saved_place_1 = __importDefault(require("../models/saved_place"));
const save_place = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { place_header, place_id, place_name, place_sub_name, place_coords } = req.body;
    if (!user)
        return res.status(404).json({ msg: "User not found" });
    if (!place_header ||
        !place_id ||
        !place_name ||
        !place_sub_name ||
        !place_coords)
        return res.status(404).json({ msg: "Some fields are missing" });
    try {
        const savedPlace = yield saved_place_1.default.findOneAndUpdate({ place_header, user }, {
            user,
            place_header,
            place_id,
            place_name,
            place_sub_name,
            place_coords,
        }, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        res.status(201).json({ msg: "Place has been saved", savedPlace });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured while saving places" });
    }
});
exports.save_place = save_place;
const get_saved_places = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!user)
        return res.status(404).json({ msg: "User not found" });
    try {
        const saved_places = yield saved_place_1.default.find({ user });
        res
            .status(201)
            .json({ msg: "Success", rowCount: saved_places === null || saved_places === void 0 ? void 0 : saved_places.length, saved_places });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured while saving places" });
    }
});
exports.get_saved_places = get_saved_places;
const delete_saved_place = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!user)
        return res.status(404).json({ msg: "User not found" });
    const { place_header } = req.query;
    if (!place_header)
        return res.status(404).json({ msg: "place not found" });
    try {
        const deletedPlace = yield saved_place_1.default.deleteOne({ user, place_header });
        if (!deletedPlace)
            return res.status(404).json({ msg: "No place was deleted" });
        res.status(201).json({ msg: "Place deleted" });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured while saving places" });
    }
});
exports.delete_saved_place = delete_saved_place;
