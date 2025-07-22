import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { TokenPayload } from "../config/user.type";

const jwt_secret = process.env.JWT_SECRET;

export const auth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, authorization denied." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, jwt_secret as string) as TokenPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid." });
  }
};
