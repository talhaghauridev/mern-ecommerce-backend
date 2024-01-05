const express = require("express");
const {
  createOrder,
  getSingleOrder,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");
const { isAuthenticationUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();
("");
router.route("/order/new").post(isAuthenticationUser, createOrder);
router
  .route("/order/:id")
  .get(isAuthenticationUser, authorizeRoles("admin"), getSingleOrder);
router.route("/orders/me").get(isAuthenticationUser, myOrders);

router
  .route("/admin/orders")
  .get(isAuthenticationUser, authorizeRoles("admin"), getAllOrders);
router
  .route("/admin/order/:id")
  .put(isAuthenticationUser, authorizeRoles("admin"), updateOrder)
  .delete(isAuthenticationUser, authorizeRoles("admin"), deleteOrder);
module.exports = router;
