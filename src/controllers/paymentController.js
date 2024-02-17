const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorhandler");
const Stripe = require("stripe");
const { createOrder } = require("./orderController");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CheckOut
const checkPayment = catchAsyncError(async (req, res, next) => {
  try {
    const { items, userId, shippingInfo } = req.body;
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId,
        cart: JSON.stringify(items),
        shippingInfo: JSON.stringify(shippingInfo),
      },
    });
    const lineItems = items?.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
          metadata: {
            id: item._id,
          },
        },
        unit_amount: Number(item.price) * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/order/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 505));
  }
});

const endpointSecret = process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET;

// Handle Webhooks
const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody.toString(),
      sig,
      endpointSecret
    );

    switch (event.type) {
      case "checkout.session.completed":
        const data = event.data.object;
        const customer = await stripe.customers.retrieve(data.customer);
        // CREATE ORDER
        console.log("Customer", customer);
        await createOrder(customer, data);
        console.log("Check Session complete");
        console.log(event);
        break;
      // Add other cases for different webhook events
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send();
  } catch (err) {
    console.log(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

module.exports = {
  checkPayment,
  handleWebhook,
};
