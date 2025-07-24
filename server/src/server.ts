import express from "express";
const app = express();

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

const start_server = async (): Promise<void> => {
  try {
    await connect_db(mongo_url);
    app.listen(port, () =>
      console.log(`Connected! Server running at port ${port}...`)
    );
  } catch (err) {
    console.log(err);
  }
};
start_server();
