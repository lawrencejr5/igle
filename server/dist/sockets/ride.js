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
exports.ride_socket_events = void 0;
const ride_socket_events = (io, socket) => {
    socket.on("ride_request", (payload) => __awaiter(void 0, void 0, void 0, function* () {
        io.emit("new_ride_request", payload);
    }));
    socket.on("ride_accept", (data) => {
        const { ride_id, driver_id, rider_socket_id } = data;
        console.log("Driver accepted ride:", ride_id);
        // Send ride_accepted event only to that rider
        io.to(rider_socket_id).emit("ride_accepted", {
            ride_id,
            driver_id,
            message: "Your ride has been accepted",
        });
    });
};
exports.ride_socket_events = ride_socket_events;
