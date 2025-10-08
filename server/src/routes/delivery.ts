import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  request_delivery,
  retry_delivery,
  rebook_delivery,
  get_available_deliveries,
  accept_delivery,
  cancel_delivery,
  get_delivery_data,
  get_user_deliveries,
  update_delivery_status,
  pay_for_delivery,
  get_user_active_deliveries,
} from "../controllers/delivery";

const DeliveryRouter = Router();

DeliveryRouter.use(auth);

DeliveryRouter.get("/active", get_user_active_deliveries);
DeliveryRouter.post("/request", request_delivery);
DeliveryRouter.patch("/retry", retry_delivery);
DeliveryRouter.post("/rebook", rebook_delivery);
DeliveryRouter.get("/available", get_available_deliveries);
DeliveryRouter.patch("/accept", accept_delivery);
DeliveryRouter.patch("/cancel", cancel_delivery);
DeliveryRouter.get("/data", get_delivery_data);
DeliveryRouter.get("/user", get_user_deliveries);
DeliveryRouter.patch("/status", update_delivery_status);
DeliveryRouter.post("/pay", pay_for_delivery);

export default DeliveryRouter;
