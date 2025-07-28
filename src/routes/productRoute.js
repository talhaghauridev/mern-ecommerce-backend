import express from "express";
import {
   getAllProducts,
   createProduct,
   updateProduct,
   deleteProduct,
   getProductDetial,
   productReview,
   getProductReviews,
   deleteReview,
   getAdminProducts
} from "../controllers/productController.js";
import { isAuthenticationUser, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.route("/products").get(getAllProducts);
router.route("/product/new").post(isAuthenticationUser, authorizeRoles("admin"), createProduct);
router
   .route("/product/:id")
   .put(isAuthenticationUser, authorizeRoles("admin"), updateProduct)
   .delete(isAuthenticationUser, authorizeRoles("admin"), deleteProduct)
   .get(getProductDetial);

router.route("/review").put(isAuthenticationUser, productReview);

router.route("/admin/products").get(isAuthenticationUser, authorizeRoles("admin"), getAdminProducts);

router
   .route("/reviews")
   .get(isAuthenticationUser, authorizeRoles("admin"), getProductReviews)
   .patch(isAuthenticationUser, authorizeRoles("admin"), deleteReview);

export default router;
