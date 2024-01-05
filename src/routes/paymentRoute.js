const express = require("express");
const { isAuthenticationUser } = require("../middlewares/auth");
const {
  processPayment,
  sendStripeApiKey,
  checkPayment,
} = require("../controllers/paymentController");
const router = express.Router();

router.route("/payment/process").post(isAuthenticationUser, processPayment);
router.route("/checkout").post( checkPayment);
router.route("/stripeapikey").get(isAuthenticationUser, sendStripeApiKey);

module.exports = router;
