import express from "express";
const app = express();

import dotenv from "dotenv";
dotenv.config();

import { connect_db } from "./config/connect_db";

const port = process.env.PORT || "5000";
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
