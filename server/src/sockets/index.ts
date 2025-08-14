import { Server, Socket } from "socket.io";

import User from "../models/user";
import Driver from "../models/driver";

import { ride_socket_events } from "./ride";
import { user_socket_events } from "./user";
import { location_socket_events } from "./location";

export const handle_socket_events = (io: Server, socket: Socket) => {
  user_socket_events(io, socket);
  ride_socket_events(io, socket);
  location_socket_events(io, socket);

  socket.on("disconnect", async () => {
    await User.findOneAndUpdate(
      { socket_id: socket.id },
      { socket_id: null, is_online: false }
    );
    await Driver.findOneAndUpdate(
      { socket_id: socket.id },
      { socket_id: null, is_online: false, is_available: false }
    );
  });
};
