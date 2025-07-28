import express from "express";
import { isAuthenticationUser } from "../middlewares/auth.js";
import { checkPayment } from "../controllers/paymentController.js";
const router = express.Router();

router.route("/checkout").post(isAuthenticationUser, checkPayment);

export default router;
