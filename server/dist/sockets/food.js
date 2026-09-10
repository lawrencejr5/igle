"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.food_socket_events = void 0;
const food_socket_events = (io, socket) => {
    // Vendor joins their restaurant socket room to receive instant food orders
    socket.on("join_restaurant_room", (data) => {
        if (data === null || data === void 0 ? void 0 : data.restaurant_id) {
            const room = `restaurant_${data.restaurant_id}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined vendor room: ${room}`);
        }
    });
    // Customer joins their specific food order tracking room
    socket.on("track_food_order", (data) => {
        if (data === null || data === void 0 ? void 0 : data.order_id) {
            const room = `food_order_${data.order_id}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined tracking room for order: ${room}`);
        }
    });
};
exports.food_socket_events = food_socket_events;
