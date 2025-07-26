import { Server, Socket } from "socket.io";
import Ride from "../models/ride";

export const ride_socket_events = (io: Server, socket: Socket) => {
  socket.on("ride_request", async (payload) => {
    io.emit("new_ride_request", payload);
  });

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
