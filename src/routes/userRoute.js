const express = require("express");
const {
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
} = require("../controllers/userController");
const { isAuthenticationUser, authorizeRoles } = require("../middlewares/auth");

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

module.exports = router;
