import { Server, Socket } from "socket.io";

import { get_user_socket_id } from "../utils/get_id";

export const location_socket_events = (io: Server, socket: Socket) => {
  socket.on("driver_location", async (payload) => {
    const { rider_id, driver_id, coordinates } = payload;
    const user_socket = await get_user_socket_id(rider_id);
    if (user_socket)
      io.to(user_socket).emit("driver_location_update", {
        driver_id,
        coordinates,
      });
  });
};
