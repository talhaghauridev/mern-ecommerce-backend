export const DB_NAME = "mern-stack-ecormmece";

export const CACHE_KEYS = {
   PRODUCT_DETAIL: (id) => `product:${id}`,
   ADMIN_PRODUCTS: "products:admin",
   PRODUCT_REVIEWS: (id) => `product:${id}:reviews`,
   PRODUCT_COUNT: "products:count",

   USER_DETAIL: (id) => `user:${id}`,
   USER_PROFILE: (id) => `user:${id}:profile`,

   ORDER_DETAIL: (id) => `order:${id}`,
   USER_ORDERS: (userId) => `user:${userId}:orders`,
   ADMIN_ORDERS: "orders:admin"
};

export const CACHE_TTL = {
   SHORT: 300, // 5 minutes
   MEDIUM: 600, // 10 minutes
   LONG: 1800, // 30 minutes
   VERY_LONG: 3600 // 1 hour
};
