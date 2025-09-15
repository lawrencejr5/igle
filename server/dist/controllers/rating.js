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
exports.get_user_ratings = exports.get_driver_ratings = exports.get_ride_ratings = exports.create_rating = void 0;
const rating_1 = __importDefault(require("../models/rating"));
const create_rating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { rating, review, ride, driver } = req.body;
        if (!user || !rating || !ride || !driver)
            return res.status(400).json({ msg: "Missing required fields" });
        const newRating = yield rating_1.default.create({
            rating,
            review,
            ride,
            user,
            driver,
        });
        res.status(201).json({ msg: "Rating submitted", rating: newRating });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.create_rating = create_rating;
const get_ride_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        if (!ride_id)
            return res.status(400).json({ msg: "Ride id not provided" });
        const ratings = yield rating_1.default.find({ ride: ride_id });
        res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.get_ride_ratings = get_ride_ratings;
const get_driver_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driver_id } = req.query;
        if (!driver_id)
            return res.status(400).json({ msg: "Driver id not provided" });
        const ratings = yield rating_1.default.find({ driver: driver_id });
        res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.get_driver_ratings = get_driver_ratings;
const get_user_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const ratings = yield rating_1.default.find({ user });
        res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.get_user_ratings = get_user_ratings;
