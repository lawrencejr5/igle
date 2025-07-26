import { Server, Socket } from "socket.io";

import User from "../models/user";
import Driver from "../models/driver";

export const user_socket_events = (io: Server, socket: Socket) => {
  socket.on("register_user", async (data) => {
    await User.findByIdAndUpdate(data.user_id, {
      socket_id: data.socket_id,
      is_online: true,
    });
  });
  socket.on("register_driver", async (data) => {
    const { driver_id, socket_id } = data;

    await Driver.findByIdAndUpdate(driver_id, {
      socket_id,
      is_online: true,
    });
  });
};
