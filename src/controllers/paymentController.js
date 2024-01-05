const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorhandler");

const processPayment = catchAsyncError(async (req, res, next) => {
  const myPayment = await stripe.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: "Online Store",
    },
  });

  res
    .status(200)
    .json({ success: true, client_secret: myPayment.client_secret });
});

const sendStripeApiKey = catchAsyncError(async (req, res, next) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
});

//CheckOut
const checkPayment = catchAsyncError(async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {},
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "inr",
            },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 1500,
              currency: "inr",
            },
            display_name: "Next day air",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },
              maximum: {
                unit: "business_day",
                value: 1,
              },
            },
          },
        },
      ],

      payment_method_types: ["card"], // Corrected typo here
      mode: "payment",
      line_items: req.body.items.map((item) => {
        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
            },
            unit_amount: item.price * 100,
          },
          quantity: item.quanity,
        };
      }),
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cart",
    });

    res.status(200).json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, 505));
  }
});

module.exports = {
  processPayment,
  sendStripeApiKey,
  checkPayment,
};
