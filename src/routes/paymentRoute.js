const express = require("express");
const { isAuthenticationUser } = require("../middlewares/auth");
const {
  checkPayment,
  handleWebhook,
} = require("../controllers/paymentController");
const router = express.Router();

router.route("/checkout").post(isAuthenticationUser, checkPayment);

// Webhook Route
// router.post(
//   "/webhooks",
//   express.raw({ type: "application/json" }),
//   handleWebhook
// );

module.exports = router;
