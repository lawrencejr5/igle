import { Router } from "express";

import { auth } from "../middleware/auth";

import {
  add_history,
  delete_history,
  get_user_history,
} from "../controllers/history";

const HistoryRouter = Router();

HistoryRouter.use(auth);

HistoryRouter.get("/", get_user_history);
HistoryRouter.post("/", add_history);
HistoryRouter.delete("/", delete_history);

export default HistoryRouter;
