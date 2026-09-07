import { Server, Socket } from "socket.io";

export const food_socket_events = (io: Server, socket: Socket) => {
  // Vendor joins their restaurant socket room to receive instant food orders
  socket.on("join_restaurant_room", (data: { restaurant_id: string }) => {
    if (data?.restaurant_id) {
      const room = `restaurant_${data.restaurant_id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined vendor room: ${room}`);
    }
  });

  // Customer joins their specific food order tracking room
  socket.on("track_food_order", (data: { order_id: string }) => {
    if (data?.order_id) {
      const room = `food_order_${data.order_id}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined tracking room for order: ${room}`);
    }
  });
};
