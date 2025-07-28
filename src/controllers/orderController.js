import catchAsyncError from "../utils/catchAsyncError.js";
import Order from "../models/orderModal.js";
import Product from "../models/productModel.js";
import ErrorHandler from "../utils/errorhandler.js";
import cacheManager from "../utils/cacheManager.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants.js";

// Order Items
const orderItemsFixed = (orders) => {
   return orders.map((order) => ({
      ...order.toObject(),
      orderItems: order.orderItems.map(({ product, name, price, quantity }) => ({
         name,
         price,
         quantity,
         image: product?.images[0]?.url || null
      }))
   }));
};

//Create Order
const createOrder = async (customer, data) => {
   const Items = JSON.parse(customer.metadata.cart);
   const shippingInfo = JSON.parse(customer.metadata.shippingInfo);

   console.log("Cart Items", Items);
   console.log("shippingInfo Items", shippingInfo);

   const orderItems = Items?.map((item) => ({
      product: item.product,
      name: item.name,
      price: item.price,
      stock: item.stock,
      quantity: item.quantity
   }));

   try {
      const order = await Order.create({
         shippingInfo: {
            ...shippingInfo,
            phoneNo: shippingInfo.phoneNumber
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
            status: data.payment_status
         },
         orderStatus: "Processing"
      });
   } catch (error) {
      console.log(error);
   }
};

// Get My Orders
const myOrders = catchAsyncError(async (req, res, next) => {
   // Try to get from cache first
   const cacheKey = CACHE_KEYS.USER_ORDERS(req.user._id);
   const cachedOrderItems = cacheManager.get(cacheKey);
   if (cachedOrderItems) {
      return res.status(201).json({
         success: true,
         orders: cachedOrderItems
      });
   }

   const orders = await Order.find({ user: req.user._id }).populate({
      path: "orderItems.product",
      select: "images"
   });

   const orderItems = orderItemsFixed(orders);

   // Cache only the processed order items
   cacheManager.set(cacheKey, orderItems, CACHE_TTL.SHORT);

   res.status(201).json({
      success: true,
      orders: orderItems
   });
});

//Get Single Order --Admin

const getSingleOrder = catchAsyncError(async (req, res, next) => {
   // Try to get from cache first
   const cachedOrderData = cacheManager.get(CACHE_KEYS.ORDER_DETAIL(req.params.id));
   if (cachedOrderData) {
      return res.status(201).json({
         success: true,
         order: cachedOrderData
      });
   }

   const order = await Order.findById(req.params.id).populate({
      path: "orderItems.product",
      select: "images"
   });

   if (!order) {
      return next(new ErrorHandler("Product not found in this id ", 404));
   }

   // Process order data before caching
   const orderData = orderItemsFixed([order])[0];

   // Cache only the essential order data
   cacheManager.set(CACHE_KEYS.ORDER_DETAIL(req.params.id), orderData, CACHE_TTL.MEDIUM);

   res.status(201).json({
      success: true,
      order: orderData
   });
});

//Get All Orders --Admin

const getAllOrders = catchAsyncError(async (req, res, next) => {
   try {
      // Try to get from cache first
      const cachedData = cacheManager.get(CACHE_KEYS.ADMIN_ORDERS);
      if (cachedData) {
         const { orders, totalAmount } = cachedData;
         return res.status(200).json({
            success: true,
            totalAmount,
            orders,
            length: orders.length
         });
      }

      const orders = await Order.find().populate({
         path: "orderItems.product",
         select: "images"
      });
      let totalAmount = 0;
      orders.forEach((order) => {
         totalAmount += order.totalPrice;
      });

      const orderItems = orderItemsFixed(orders);

      // Cache only essential data
      cacheManager.set(
         CACHE_KEYS.ADMIN_ORDERS,
         {
            orders: orderItems,
            totalAmount
         },
         CACHE_TTL.SHORT
      );

      res.status(200).json({
         success: true,
         totalAmount,
         orders: orderItems,
         length: orders.length
      });
   } catch (error) {
      console.log("Error fetching all orders:", error);
      res.status(400).json({
         message: error.message
      });
   }
});

// Update Order Status --Admin
async function updateStock(id, quantity) {
   const product = await Product.findById(id);
   product.stock -= quantity;
   await product.save({ validateBeforeSave: false });
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

   // Invalidate the order cache since status changed
   cacheManager.del(CACHE_KEYS.ORDER_DETAIL(req.params.id));
   // Also invalidate orders list cache since this would affect it
   cacheManager.delByPattern(CACHE_KEYS.ORDERS_PATTERN);

   res.status(200).json({
      success: true,
      message: "Order updated successfully"
   });
});

//Delete Order --Admin

const deleteOrder = catchAsyncError(async (req, res, next) => {
   const order = await Order.findById(req.params.id);
   if (!order) {
      return next(new ErrorHandler(" You have already dilvered this order", 404));
   }

   // Get the user ID before deleting the order
   const userId = order.user;

   await order.deleteOne(order);

   // Invalidate all related caches
   cacheManager.del(CACHE_KEYS.ORDER_DETAIL(req.params.id));
   cacheManager.del(CACHE_KEYS.USER_ORDERS(userId));
   cacheManager.delByPattern(CACHE_KEYS.ORDERS_PATTERN);

   res.status(200).json({
      success: true,
      message: `Order deleted successfully`
   });
});

export { myOrders, getSingleOrder, getAllOrders, updateOrder, deleteOrder, createOrder };
