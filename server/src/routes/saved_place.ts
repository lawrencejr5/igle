import { Router } from "express";
const SavedPlaceRouter = Router();

import { auth } from "../middleware/auth";

import { get_saved_places, save_place } from "../controllers/saved_place";

SavedPlaceRouter.use(auth);

SavedPlaceRouter.get("/", get_saved_places);
SavedPlaceRouter.post("/", save_place);

export default SavedPlaceRouter;
