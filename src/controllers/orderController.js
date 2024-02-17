const catchAsyncError = require("../utils/catchAsyncError");
const Order = require("../models/orderModal");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");

const createOrder = async (customer, data) => {
  const Items = JSON.parse(customer.metadata.cart);
  const shippingInfo = JSON.parse(customer.metadata.shippingInfo);

  console.log("Cart Items", Items);
  console.log("shippingInfo Items", shippingInfo);

  const orderItems = Items?.map((item) => ({
    product: item._id,
    name: item.name,
    price: item.price,
    image:
      item.images[0]?.url ||
      "https://res.cloudinary.com/datkbb6pe/image/upload/v1698064367/avatar/bk7uohfge0ahhlwyzto6.png",
    stock: item.stock,
    quantity: item.quantity || 1,
  }));

  try {
    const order = await Order.create({
      shippingInfo: {
        ...shippingInfo,
        phoneNo: shippingInfo.phoneNumber,
      },
      orderItems: orderItems,
      itemsPrice: data.amount_subtotal,
      taxPrice: 10,
      shippingPrice: data.amount_total,
      totalPrice: data.amount_total,
      paidAt: new Date(),
      user: customer.metadata.userId,
      paymentInfo: {
        id: data.payment_intent,
        status: data.payment_status,
      },
      orderStatus: "Processing",
    });
  } catch (error) {
    console.log(error);
  }
};

// Get My Orders

const myOrders = catchAsyncError(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });
  console.log(orders);
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
    length: orders?.length,
  });
});

// Update Order Status --Admin
async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock -= quantity;
  await product.save({ validateBeforeSave: false });
  console.log(product);
}
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
  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
  });
});

//Delete Order --Admin

const deleteOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new ErrorHandler(" You have already dilvered this order", 404));
  }
  await order.deleteOne(order);

  res.status(200).json({
    success: true,
    message: `Order deleted successfully`,
  });
});

module.exports = {
  myOrders,
  getSingleOrder,
  getAllOrders,
  updateOrder,
  deleteOrder,
  createOrder,
};
