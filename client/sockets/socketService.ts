import { io } from "socket.io-client";

let userSocket: any;
let driverSocket: any;

export const initDriverSocket = (driver_id: string) => {
  if (!driverSocket) {
    driverSocket = io("http://192.168.10.123:5000", {
      transports: ["websocket"],
      forceNew: true,
    });

    driverSocket.on("connect", () => {
      console.log("Connected as Driver:", driverSocket.id);
      driverSocket.emit("register_driver", {
        socket_id: driverSocket.id,
        driver_id: driver_id,
      });
    });
  }
  return driverSocket;
};

export const initUserSocket = (user_id: string) => {
  if (!userSocket) {
    userSocket = io("http://192.168.10.123:5000", {
      transports: ["websocket"],
      forceNew: true,
    });

    userSocket.on("connect", () => {
      console.log("Connected as User:", userSocket.id);
      userSocket.emit("register_user", {
        socket_id: userSocket.id,
        user_id: user_id,
      });
    });

    const onRideAccepted = async (data: any) => {
      // The listener should be responsible for updating the state
      console.log("Ride accepted by driver:", data);
    };

    // Register the listener once when the component mounts
    userSocket.on("ride_accepted", onRideAccepted);
  }
  return userSocket;
};

export const getUserSocket = () => userSocket;
export const getDriverSocket = () => driverSocket;
