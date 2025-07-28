import express from "express";
import { getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrder } from "../controllers/orderController.js";
import { isAuthenticationUser, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();
router.route("/order/:id").get(isAuthenticationUser, getSingleOrder);
router.route("/orders/me").get(isAuthenticationUser, myOrders);

router.route("/admin/orders").get(isAuthenticationUser, authorizeRoles("admin"), getAllOrders);
router
   .route("/admin/order/:id")
   .put(isAuthenticationUser, authorizeRoles("admin"), updateOrder)
   .delete(isAuthenticationUser, authorizeRoles("admin"), deleteOrder);
export default router;
