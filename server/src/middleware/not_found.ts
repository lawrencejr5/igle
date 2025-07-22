import { NextFunction, Request, Response } from "express";

export const not_found = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.status(404).json({ msg: "Route not found" });
    next();
  } catch (err) {
    res.status(500).json({ msg: "Internal server error" });
    console.log(err);
  }
};
