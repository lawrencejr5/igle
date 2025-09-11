import { Router } from "express";
const SavedPlaceRouter = Router();

import { auth } from "../middleware/auth";

import {
  delete_saved_place,
  get_saved_places,
  save_place,
} from "../controllers/saved_place";

SavedPlaceRouter.use(auth);

SavedPlaceRouter.get("/", get_saved_places);
SavedPlaceRouter.post("/", save_place);
SavedPlaceRouter.delete("/", delete_saved_place);

export default SavedPlaceRouter;
