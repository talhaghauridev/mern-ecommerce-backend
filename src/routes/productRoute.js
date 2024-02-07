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
  .route("/review")
  .get(getProductReviews)
  .patch(isAuthenticationUser, deleteReview);

module.exports = router;
