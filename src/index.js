const app = require("./app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDB = require("./db/index");
const bodyParser = require("body-parser");
const express = require("express");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 5000;
//Confing

dotenv.config({ path: "./.env" });
app.use(bodyParser.json());
// Connecting to Database

let server;
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Server is working is http://localhost:${PORT}`);
  });
});

app.get("/", (req, res, next) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

const endpointSecret = "whsec_1FlLoylkFokbhI082NEiL8C4BDOd8ioJ";

app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  (request, response) => {
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          endpointSecret
        );
      } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
      }

      // Handle the event
      switch (event.type) {
        case "checkout.session.async_payment_failed":
          const checkoutSessionAsyncPaymentFailed = event.data.object;
          // Then define and call a function to handle the event checkout.session.async_payment_failed
          break;
        case "checkout.session.completed":
          const checkoutSessionCompleted = event.data.object;
          // Then define and call a function to handle the event checkout.session.completed
          console.log("Webhooks", checkoutSessionCompleted);
          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      // Return a 200 response to acknowledge receipt of the event
      response.send();
    } catch (error) {
      console.log(error);
    }
  }
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

process.on("unhandledRejection", (err) => {
  console.log(`Error ${err.message}`);
  console.log(`Sutting down the server due to Unhandel Promise Rejection`);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
