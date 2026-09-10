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
exports.get_user_ratings = exports.get_restaurant_ratings = exports.get_driver_ratings = exports.get_food_order_ratings = exports.get_ride_ratings = exports.create_rating = void 0;
const rating_1 = __importDefault(require("../models/rating"));
const driver_1 = __importDefault(require("../models/driver"));
const restaurant_1 = __importDefault(require("../models/restaurant"));
const server_1 = require("../server");
const get_id_1 = require("../utils/get_id");
// 1. Create Rating (Rider -> Driver OR Customer -> Restaurant)
const create_rating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { rating, review, ride, driver, food_order, restaurant } = req.body;
        if (!user || !rating) {
            return res.status(400).json({ msg: "User authentication and rating score are required" });
        }
        if (!driver && !restaurant) {
            return res.status(400).json({ msg: "Target driver or restaurant is required for rating" });
        }
        const newRating = yield rating_1.default.create({
            rating: Number(rating),
            review: review || "",
            user,
            ride: ride || undefined,
            driver: driver || undefined,
            food_order: food_order || undefined,
            restaurant: restaurant || undefined,
        });
        // If rating a driver
        if (driver) {
            const driverRatings = yield rating_1.default.find({ driver });
            let driverAverage = 0;
            if (driverRatings.length > 0) {
                const total = driverRatings.reduce((sum, r) => sum + r.rating, 0);
                driverAverage = total / driverRatings.length;
                driverAverage = Math.round(driverAverage * 10) / 10;
                if (driverAverage % 1 === 0)
                    driverAverage = Math.floor(driverAverage);
            }
            const driverData = yield driver_1.default.findById(driver);
            if (driverData) {
                driverData.rating = driverAverage;
                driverData.num_of_reviews = driverRatings.length;
                yield driverData.save();
                const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driver);
                if (driverSocket) {
                    server_1.io.to(driverSocket).emit("driver_reviewed", {
                        msg: "You received a new rating",
                        rating: driverAverage,
                    });
                }
            }
        }
        // If rating a restaurant
        if (restaurant) {
            const restaurantRatings = yield rating_1.default.find({ restaurant });
            let restaurantAverage = 5.0;
            if (restaurantRatings.length > 0) {
                const total = restaurantRatings.reduce((sum, r) => sum + r.rating, 0);
                restaurantAverage = total / restaurantRatings.length;
                restaurantAverage = Math.round(restaurantAverage * 10) / 10;
                if (restaurantAverage % 1 === 0)
                    restaurantAverage = Math.floor(restaurantAverage);
            }
            const restaurantData = yield restaurant_1.default.findById(restaurant);
            if (restaurantData) {
                restaurantData.rating = restaurantAverage;
                restaurantData.num_of_reviews = restaurantRatings.length;
                yield restaurantData.save();
                if (restaurantData.user) {
                    const vendorSocket = yield (0, get_id_1.get_user_socket_id)(restaurantData.user);
                    if (vendorSocket) {
                        server_1.io.to(vendorSocket).emit("restaurant_reviewed", {
                            msg: "Your restaurant received a new review",
                            rating: restaurantAverage,
                        });
                    }
                }
            }
        }
        return res.status(201).json({
            msg: "Rating submitted successfully",
            rating: newRating,
        });
    }
    catch (error) {
        console.error("create_rating error:", error);
        return res.status(500).json({ msg: "An error occurred submitting rating", error: error.message });
    }
});
exports.create_rating = create_rating;
// 2. Get Ride Ratings
const get_ride_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        if (!ride_id)
            return res.status(400).json({ msg: "Ride id not provided" });
        const ratings = yield rating_1.default.find({ ride: ride_id }).populate("user", "name profile_pic");
        return res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        return res.status(500).json({ msg: "An error occurred" });
    }
});
exports.get_ride_ratings = get_ride_ratings;
// 3. Get Food Order Ratings
const get_food_order_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { order_id } = req.query;
        if (!order_id)
            return res.status(400).json({ msg: "Order id not provided" });
        const ratings = yield rating_1.default.find({ food_order: order_id }).populate("user", "name profile_pic");
        return res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        return res.status(500).json({ msg: "An error occurred" });
    }
});
exports.get_food_order_ratings = get_food_order_ratings;
// 4. Get Driver Ratings
const get_driver_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { driver_id } = req.query;
        if (!driver_id)
            return res.status(400).json({ msg: "Driver id not provided" });
        const ratings = yield rating_1.default.find({ driver: driver_id })
            .populate("user", "name profile_pic")
            .sort({ createdAt: -1 });
        let average = 0;
        if (ratings.length > 0) {
            const total = ratings.reduce((sum, r) => sum + r.rating, 0);
            average = total / ratings.length;
            average = Math.round(average * 10) / 10;
            if (average % 1 === 0)
                average = Math.floor(average);
        }
        return res.status(200).json({
            msg: "Success",
            reviews: ratings,
            average_rating: average,
            ratings_count: ratings.length,
        });
    }
    catch (error) {
        return res.status(500).json({ msg: "An error occurred" });
    }
});
exports.get_driver_ratings = get_driver_ratings;
// 5. Get Restaurant Ratings
const get_restaurant_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurant_id } = req.query;
        if (!restaurant_id)
            return res.status(400).json({ msg: "Restaurant id not provided" });
        const ratings = yield rating_1.default.find({ restaurant: restaurant_id })
            .populate("user", "name profile_pic")
            .sort({ createdAt: -1 });
        let average = 5.0;
        if (ratings.length > 0) {
            const total = ratings.reduce((sum, r) => sum + r.rating, 0);
            average = total / ratings.length;
            average = Math.round(average * 10) / 10;
            if (average % 1 === 0)
                average = Math.floor(average);
        }
        return res.status(200).json({
            msg: "Success",
            reviews: ratings,
            average_rating: average,
            ratings_count: ratings.length,
        });
    }
    catch (error) {
        return res.status(500).json({ msg: "An error occurred fetching restaurant ratings" });
    }
});
exports.get_restaurant_ratings = get_restaurant_ratings;
// 6. Get User Ratings
const get_user_ratings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const ratings = yield rating_1.default.find({ user }).sort({ createdAt: -1 });
        return res.status(200).json({ msg: "Success", ratings });
    }
    catch (error) {
        return res.status(500).json({ msg: "An error occurred" });
    }
});
exports.get_user_ratings = get_user_ratings;
