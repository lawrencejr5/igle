import { io } from "socket.io-client";

let userSocket: any;
let driverSocket: any;

const SOCKET_URL = "http://192.168.250.123:5000";
// const SOCKET_URL = "https://igleapi.onrender.com";

export const initDriverSocket = (driver_id: string) => {
  if (!driverSocket) {
    driverSocket = io(SOCKET_URL, {
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
    userSocket = io(SOCKET_URL, {
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
  }
  return userSocket;
};

export const getUserSocket = () => userSocket;
export const getDriverSocket = () => driverSocket;
