const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetial,
  productReview,
  getProductReviews,
  deleteReview,
  getAdminProducts,
} = require("../controllers/productController");
const { isAuthenticationUser, authorizeRoles } = require("../middlewares/auth");

const router = express.Router();

router.route("/products").get(getAllProducts);
router
  .route("/product/new")
  .post(isAuthenticationUser, authorizeRoles("admin"), createProduct);
router
  .route("/product/:id")
  .put(isAuthenticationUser, authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticationUser, authorizeRoles("admin"), deleteProduct)
  .get(getProductDetial);

router.route("/review").put(isAuthenticationUser, productReview);

router
  .route("/admin/products")
  .get(isAuthenticationUser, authorizeRoles("admin"), getAdminProducts);

router
  .route("/reviews")
  .get(isAuthenticationUser,authorizeRoles("admin"),getProductReviews)
  .patch(isAuthenticationUser,authorizeRoles("admin"), deleteReview);

module.exports = router;
