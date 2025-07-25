import express from "express";
const app = express();

import http from "http";
import { Server as SocketServer } from "socket.io";

import dotenv from "dotenv";
dotenv.config();

import cors from "cors";

import { connect_db } from "./config/connect_db";
import { not_found } from "./middleware/not_found";

import UserRouter from "./routes/user";
import DriverRouter from "./routes/driver";
import RideRouter from "./routes/ride";
import TransactionRouter from "./routes/transaction";
import WalletRouter from "./routes/wallet";

import { handle_socket_events } from "./sockets";

app.use(cors());
app.use(express.json());

app.use("/api/v1/users", UserRouter);
app.use("/api/v1/drivers", DriverRouter);
app.use("/api/v1/rides", RideRouter);
app.use("/api/v1/transactions", TransactionRouter);
app.use("/api/v1/wallet", WalletRouter);

app.use(not_found);

const port = process.env.PORT || "5001";
const mongo_url = process.env.MONGO_URI as string;

const http_server = http.createServer(app);

const io = new SocketServer(http_server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  handle_socket_events(io, socket);
});

export { io };

const start_server = async (): Promise<void> => {
  try {
    await connect_db(mongo_url);
    http_server.listen(port, () =>
      console.log(`Connected! Server running at port ${port}...`)
    );
  } catch (err) {
    console.log(err);
  }
};
start_server();
