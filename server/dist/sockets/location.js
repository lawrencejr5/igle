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
exports.location_socket_events = void 0;
const get_id_1 = require("../utils/get_id");
const driver_1 = __importDefault(require("../models/driver"));
const location_socket_events = (io, socket) => {
    socket.on("driver_location", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { rider_id, driver_id, coordinates } = payload;
        // console.log(coordinates);
        const user_socket = yield (0, get_id_1.get_user_socket_id)(rider_id);
        const driver = yield driver_1.default.findById(driver_id).select("current_location");
        if ((_a = driver === null || driver === void 0 ? void 0 : driver.current_location) === null || _a === void 0 ? void 0 : _a.coordinates) {
            const [lat, lng] = driver.current_location.coordinates;
            if (coordinates &&
                Math.abs(coordinates[0] - lat) < 0.00005 &&
                Math.abs(coordinates[1] - lng) < 0.00005) {
                return; // Avoid unnecessary DB writes and socket emits if movement is negligible
            }
        }
        const updated = yield driver_1.default.findByIdAndUpdate(driver_id, {
            "current_location.coordinates": coordinates,
        }, { new: true });
        console.log(updated === null || updated === void 0 ? void 0 : updated.current_location.coordinates);
        if (user_socket)
            io.to(user_socket).emit("driver_location_update", {
                driver_id,
                coordinates,
            });
    }));
};
exports.location_socket_events = location_socket_events;
