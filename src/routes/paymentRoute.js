const express = require("express");
const { isAuthenticationUser } = require("../middlewares/auth");
const { checkPayment } = require("../controllers/paymentController");
const router = express.Router();

router.route("/checkout").post(isAuthenticationUser, checkPayment);

module.exports = router;
