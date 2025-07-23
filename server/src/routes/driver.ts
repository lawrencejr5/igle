import express, { Router } from "express";
const app = express();

import {
  create_driver,
  update_location,
  get_driver,
} from "../controllers/driver";

import { auth } from "../middleware/auth";

const DriverRouter = Router();

app.use(auth);

DriverRouter.post("/", create_driver);
DriverRouter.patch("/location/:id", update_location);
DriverRouter.get("/:id", get_driver);

export default DriverRouter;
