const catchAsyncError = require("../utils/catchAsyncError");
const Order = require("../models/orderModal");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");


// Create Order
const createOrder = catchAsyncError(async (req, res, next) => {
  try {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    // Validate required fields

    if (
      !(shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice)
    ) {
      return next(new ErrorHandler("Please fill all fields", 400));
    }
    const requiredFields = ["address", "city", "state", "country"];

    // Extracting shippingInfo details
    const extractedShippingInfo = {
      address: shippingInfo.address,
      city: shippingInfo.city,
      state: shippingInfo.state,
      country: shippingInfo.country,
      pinCode: shippingInfo.pinCode ,
      phoneNo: shippingInfo.phoneNo, 
    };

    // Extracting orderItems details
    const extractedOrderItems = orderItems?.map((item) => ({
      product: item.product,
      name: item.name,
      price: item.price,
      image: item.image,
      stock: item.stock,
      quantity: item.quanity || 1,
    }));

    // Extracting paymentInfo details
    const extractedPaymentInfo = paymentInfo
      ? {
          id: paymentInfo.id || "",
          status: paymentInfo.status || "",
        }
      : null;

    // Create order using extracted data
    const order = new Order({
      shippingInfo: extractedShippingInfo,
      orderItems: extractedOrderItems,
      paymentInfo: extractedPaymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Get My Orders

const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  res.status(201).json({
    success: true,
    orders,
  });
});

//Get Single Order --Admin

const getSingleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Product not found in this id ", 404));
  }
  res.status(201).json({
    success: true,
    order,
  });
});


//Get All Orders --Admin

const getAllOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find();
  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

// Update Order Status --Admin

const updateOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler(" You have already dilvered this order", 404));
  }

  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler(" You have already dilvered this order", 404));
  }
  order.orderItems.forEach(async (o) => {
    await updateStock(o.product, o.quantity);
  });
  order.orderStatus = req.body.status;
  if (req.body.status === "Develivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
}

//Delete Order --Admin
const deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler(" You have already dilvered this order", 404));
  }
  await order.deleteOne(order);

  res.status(200).json({
    success: true,
  });
});

module.exports = {
  createOrder,
  myOrders,getSingleOrder,
  getAllOrders,updateOrder,deleteOrder

}
