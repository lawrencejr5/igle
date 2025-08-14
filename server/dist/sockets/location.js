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
Object.defineProperty(exports, "__esModule", { value: true });
exports.location_socket_events = void 0;
const get_id_1 = require("../utils/get_id");
const location_socket_events = (io, socket) => {
    socket.on("driver_location", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        const { rider_id, driver_id, coordinates } = payload;
        const user_socket = yield (0, get_id_1.get_user_socket_id)(rider_id);
        if (user_socket)
            io.to(user_socket).emit("driver_location_update", {
                driver_id,
                coordinates,
            });
    }));
};
exports.location_socket_events = location_socket_events;
