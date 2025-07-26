import { Server, Socket } from "socket.io";

export const ride_socket_events = (io: Server, socket: Socket) => {
  socket.on("ride_request", (payload) => {
    io.emit("new_ride_request", payload);
  });

  socket.on("ride_accept", (data) => {
    io.to(data.ride_socket_id).emit("Ride accepted", data);
  });
};
