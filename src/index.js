const app = require("./app");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary");
const connectDB = require("./db/index");
const Stripe = require("stripe");
const bodyParser = require('body-parser');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 5000;
//Confing

dotenv.config({ path: "./.env" });
app.use(bodyParser.json());
// Connecting to Database

app.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        "whsec_f1310f308ed52e56f3498b0b0eb852da2ced78abf3674219ad104432d1532614"
      );
    } catch (err) {
      console.error("Webhook Error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        // Handle successful payment
        break;
      // Add more cases for other events as needed
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  }
);

let server;
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`Server is working is http://localhost:${PORT}`);
  });
});

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
