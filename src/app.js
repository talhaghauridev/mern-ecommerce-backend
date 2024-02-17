const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const errorMiddlewars = require("./middlewares/error");
const dotenv = require("dotenv");
const product = require("./routes/productRoute");
const user = require("./routes/userRoute");
const order = require("./routes/orderRoute");
const payment = require("./routes/paymentRoute");
const Order = require("./models/orderModal");
const Stripe = require("stripe");
const { corsConfig, bodyParserConfig } = require("./config");
const { handleWebhook } = require("./controllers/paymentController");
dotenv.config({ path: "./.env" });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors(corsConfig));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json(bodyParserConfig));
app.use(express.json());
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

module.exports = app;
