import { Server, Socket } from "socket.io";

import User from "../models/user";

import { ride_socket_events } from "./ride";
import { user_socket_events } from "./user";

export const handle_socket_events = (io: Server, socket: Socket) => {
  io.on("connection", async (socket) => {
    user_socket_events(io, socket);
    ride_socket_events(io, socket);

    socket.on("disconnect", async () => {
      await User.findOneAndUpdate(
        { socket_id: socket.id },
        { socket_id: null, online: false }
      );
    });
  });
};
