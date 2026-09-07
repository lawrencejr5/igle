import { Router } from "express";
import {
  get_user_basket,
  add_item_to_basket,
  update_basket_item_quantity,
  remove_item_from_basket,
  clear_basket,
} from "../controllers/basket";
import { auth } from "../middleware/auth";

const BasketRouter = Router();

BasketRouter.use(auth);

BasketRouter.get("/", get_user_basket);
BasketRouter.post("/add", add_item_to_basket);
BasketRouter.patch("/items/:itemId", update_basket_item_quantity);
BasketRouter.delete("/items/:itemId", remove_item_from_basket);
BasketRouter.delete("/", clear_basket);

export default BasketRouter;
