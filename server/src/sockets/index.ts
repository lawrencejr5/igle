import { Server, Socket } from "socket.io";

import { ride_socket_events } from "./ride";

export const handle_socket_events = (io: Server, socket: Socket) => {
  io.on("connection", (socket) => {
    console.log("Connection was made to socket by:", socket.id);
    ride_socket_events(io, socket);

    socket.on("disconnect", () => {
      console.log("Disconnection was made from the socket by:", socket.id);
    });
  });
};
