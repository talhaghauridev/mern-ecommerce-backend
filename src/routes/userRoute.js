import express from "express";
import {
   registerUser,
   loginUser,
   logoutUser,
   forgotPassword,
   resetPassword,
   getUserDetials,
   getSingleUser,
   getAllUsers,
   updateProfile,
   updateUserPassword,
   updateUserRole,
   deleteUser
} from "../controllers/userController.js";
import { isAuthenticationUser, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);

router.route("/logout").get(logoutUser);

router.route("/me").get(isAuthenticationUser, getUserDetials);
router.route("/password/update").put(isAuthenticationUser, updateUserPassword);
router.route("/me/update").put(isAuthenticationUser, updateProfile);
router.route("/admin/users").get(isAuthenticationUser, authorizeRoles("admin"), getAllUsers);
router
   .route("/admin/user/:id")
   .get(isAuthenticationUser, authorizeRoles("admin"), getSingleUser)
   .patch(isAuthenticationUser, authorizeRoles("admin"), updateUserRole)
   .delete(isAuthenticationUser, authorizeRoles("admin"), deleteUser);

export default router;
