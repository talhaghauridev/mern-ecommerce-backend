const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorhandler");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// CheckOut
const checkPayment = catchAsyncError(async (req, res, next) => {
  try {
    const { items } = req.body;
    const lineItems = items?.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: {
          name: item.name,
        },
        unit_amount: Number(item.price) * 100,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/order/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cart`,
    });
console.log(session);

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 505));
  }
});

module.exports = {
  checkPayment,
};
