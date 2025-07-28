export const DB_NAME = "mern-stack-ecormmece";

// Cache Keys for different entities
export const CACHE_KEYS = {
   // Product related keys
   PRODUCT_DETAIL: (id) => `product:${id}`,
   ADMIN_PRODUCTS: "products:admin",
   PRODUCT_REVIEWS: (id) => `product:${id}:reviews`,
   PRODUCT_COUNT: "products:count",

   // User related keys
   USER_DETAIL: (id) => `user:${id}`,
   USER_PROFILE: (id) => `user:${id}:profile`,

   // Order related keys
   ORDER_DETAIL: (id) => `order:${id}`,
   USER_ORDERS: (userId) => `user:${userId}:orders`,
   ADMIN_ORDERS: "orders:admin"
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
   SHORT: 300, // 5 minutes
   MEDIUM: 600, // 10 minutes
   LONG: 1800, // 30 minutes
   VERY_LONG: 3600 // 1 hour
};
