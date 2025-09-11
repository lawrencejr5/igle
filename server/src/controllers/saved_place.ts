import { Request, Response } from "express";

import SavedPlace from "../models/saved_place";

export const save_place = async (req: Request, res: Response) => {
  const user = req.user?.id;
  const { place_header, place_id, place_name, place_sub_name, place_coords } =
    req.body;

  if (!user) return res.status(404).json({ msg: "User not found" });
  if (
    !place_header ||
    !place_id ||
    !place_name ||
    !place_sub_name ||
    !place_coords
  )
    return res.status(404).json({ msg: "Some fields are missing" });

  try {
    const savedPlace = await SavedPlace.findOneAndUpdate(
      { place_header, user },
      {
        user,
        place_header,
        place_id,
        place_name,
        place_sub_name,
        place_coords,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ msg: "Place has been saved", savedPlace });
  } catch (error) {
    res.status(500).json({ msg: "An error occured while saving places" });
  }
};

export const get_saved_places = async (req: Request, res: Response) => {
  const user = req.user?.id;

  if (!user) return res.status(404).json({ msg: "User not found" });

  try {
    const saved_places = await SavedPlace.find({ user });

    res
      .status(201)
      .json({ msg: "Success", rowCount: saved_places?.length, saved_places });
  } catch (error) {
    res.status(500).json({ msg: "An error occured while saving places" });
  }
};

export const delete_saved_place = async (req: Request, res: Response) => {
  const user = req.user?.id;
  if (!user) return res.status(404).json({ msg: "User not found" });

  const { place_header } = req.query;
  if (!place_header) return res.status(404).json({ msg: "place not found" });

  try {
    const deletedPlace = await SavedPlace.deleteOne({ user, place_header });

    if (!deletedPlace)
      return res.status(404).json({ msg: "No place was deleted" });

    res.status(201).json({ msg: "Place deleted" });
  } catch (error) {
    res.status(500).json({ msg: "An error occured while saving places" });
  }
};
