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
exports.user_socket_events = void 0;
const user_1 = __importDefault(require("../models/user"));
const driver_1 = __importDefault(require("../models/driver"));
const user_socket_events = (io, socket) => {
    socket.on("register_user", (data) => __awaiter(void 0, void 0, void 0, function* () {
        yield user_1.default.findByIdAndUpdate(data.user_id, {
            socket_id: socket.id,
            is_online: true,
        });
    }));
    socket.on("register_driver", (data) => __awaiter(void 0, void 0, void 0, function* () {
        const { driver_id, vehicle } = data;
        const vehicleRoom = `drivers_${vehicle}`;
        socket.join(vehicleRoom);
        yield driver_1.default.findByIdAndUpdate(driver_id, {
            socket_id: socket.id,
            is_online: true,
        });
    }));
};
exports.user_socket_events = user_socket_events;
