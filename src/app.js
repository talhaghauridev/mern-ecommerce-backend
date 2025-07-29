import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fileUpload from "express-fileupload";
import { bodyParserConfig, corsConfig } from "./config/index.js";
import { handleWebhook } from "./controllers/paymentController.js";
import errorMiddlewars from "./middlewares/error.js";
import order from "./routes/orderRoute.js";
import payment from "./routes/paymentRoute.js";
import product from "./routes/productRoute.js";
import user from "./routes/userRoute.js";

const app = express();
app.use(cors(corsConfig));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json(bodyParserConfig));
app.use(cookieParser());
app.use(fileUpload());

// Routes
app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);
app.post("/webhooks", express.raw({ type: "application/json" }), handleWebhook);

// Middlewares for Errors
app.use(errorMiddlewars);

export default app;
