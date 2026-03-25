import { Server, Socket } from "socket.io";

import { get_user_socket_id } from "../utils/get_id";

import Driver from "../models/driver";

export const location_socket_events = (io: Server, socket: Socket) => {
  socket.on("driver_location", async (payload) => {
    const { rider_id, driver_id, coordinates } = payload;
    // console.log(coordinates);
    const user_socket = await get_user_socket_id(rider_id);
    const driver = await Driver.findById(driver_id).select("current_location");
    if (driver?.current_location?.coordinates) {
      const [lat, lng] = driver.current_location.coordinates;
      if (
        coordinates &&
        Math.abs(coordinates[0] - lat) < 0.00005 &&
        Math.abs(coordinates[1] - lng) < 0.00005
      ) {
        return; // Avoid unnecessary DB writes and socket emits if movement is negligible
      }
    }
    const updated = await Driver.findByIdAndUpdate(
      driver_id,
      {
        "current_location.coordinates": coordinates,
      },
      { new: true },
    );
    console.log(updated?.current_location.coordinates);

    if (user_socket)
      io.to(user_socket).emit("driver_location_update", {
        driver_id,
        coordinates,
      });
  });
};
