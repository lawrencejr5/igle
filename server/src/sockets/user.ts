import { Server, Socket } from "socket.io";

import User from "../models/user";

export const user_socket_events = (io: Server, socket: Socket) => {
  socket.on("register_user", async (data) => {
    await User.findByIdAndUpdate(data.user_id, {
      socket_id: data.socket_id,
      online: true,
    });
  });
};
