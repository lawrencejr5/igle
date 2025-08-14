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
exports.handle_socket_events = void 0;
const user_1 = __importDefault(require("../models/user"));
const driver_1 = __importDefault(require("../models/driver"));
const ride_1 = require("./ride");
const user_2 = require("./user");
const location_1 = require("./location");
const handle_socket_events = (io, socket) => {
    (0, user_2.user_socket_events)(io, socket);
    (0, ride_1.ride_socket_events)(io, socket);
    (0, location_1.location_socket_events)(io, socket);
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        yield user_1.default.findOneAndUpdate({ socket_id: socket.id }, { socket_id: null, is_online: false });
        yield driver_1.default.findOneAndUpdate({ socket_id: socket.id }, { socket_id: null, is_online: false, is_available: false });
    }));
};
exports.handle_socket_events = handle_socket_events;
