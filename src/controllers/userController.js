import cloudinary from "cloudinary";
import crypto from "crypto";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import { uploadCloudinary, uploadUpdateCloudinary } from "../utils/cloudinary.js";
import ErrorHandler from "../utils/errorhandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// Register a User
const registerUser = catchAsyncError(async (req, res, next) => {
   const { name, email, password, avatar } = req.body;

   if (!name || !email || !password) {
      return next(new ErrorHandler("Please fill all fields", 400));
   }

   const existUser = await User.findOne({ email });
   if (existUser) {
      return next(new ErrorHandler("User is already exist in this email", 401));
   }

   const response = await uploadCloudinary(avatar, "avatars");

   const user = await User.create({
      name,
      email,
      password,
      avatar: {
         public_id: response?.public_id,
         url: response?.secure_url
      }
   });

   if (!user) {
      return next(new ErrorHandler("User created error", 400));
   }
   const newUser = await User.findById(user?._id).select("-password");

   if (!newUser) {
      return next(new ErrorHandler("User not found", 404));
   }
   res.status(200).json({
      success: true,
      user: newUser,
      token: user?.getJWTToken()
   });
});

// Login User

const loginUser = catchAsyncError(async (req, res, next) => {
   const { email, password } = req.body;
   if (!email || !password) {
      return next(new ErrorHandler("Please Enter Email & Password", 400));
   }
   const user = await User.findOne({ email }).select("+password");
   if (!user) {
      return next(new ErrorHandler(" Invalid email or password ", 401));
   }

   const isPasswordMatched = await user.comparePassword(password);
   if (!isPasswordMatched) {
      return next(new ErrorHandler(" Invalid email or password ", 401));
   }

   const loggedUser = await User.findById(user?._id).select("-password");

   if (!loggedUser) {
      return next(new ErrorHandler("User not found", 404));
   }
   res.status(200).json({
      success: true,
      user: loggedUser,
      token: user?.getJWTToken()
   });
});

// Logout User

const logoutUser = catchAsyncError(async (req, res, next) => {
   res.status(200).json({
      success: true,
      message: "Logout user successfully"
   });
});

//Forgot Password

const forgotPassword = catchAsyncError(async (req, res, next) => {
   const { email } = req.body;

   if (!email) {
      return next(new ErrorHandler("Please provide email", 400));
   }
   const user = await User.findOne({ email });
   if (!user) {
      return next(new ErrorHandler("User not found", 404));
   }

   //Get Reset Password Token

   const resetToken = await user.getResetPasswordToken();

   await user.save({ validateBeforeSave: false });

   const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
   const message = `Your Password reset token is : \n\n  ${resetPasswordUrl} \n\n if you have not requested tjis email then, please ignore it`;

   try {
      await sendEmail({
         email: user.email,
         subject: "Ecommerce  Password Recovery",
         message
      });
      res.status(200).json({
         success: true,
         message: `Email send to ${user.email} successfully `
      });
   } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      next(new ErrorHandler(error.message, 505));
   }
});

//Reset Password

const resetPassword = catchAsyncError(async (req, res, next) => {
   const { password, confirmPassword } = req.body;
   const { token } = req.params;

   const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

   let user;
   try {
      user = await User.findOne({
         resetPasswordToken,
         resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
         return next(new ErrorHandler("Reset Password Token is invalid or has expired", 400));
      }

      if (password !== confirmPassword) {
         return next(new ErrorHandler("Passwords do not match", 400));
      }
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });
      res.status(200).json({
         success: true,
         message: "Reset Password successfully",
         user: user
      });
   } catch (error) {
      console.log(error);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({
         validateBeforeSave: false
      });

      return next(new ErrorHandler(error, 400));
   }
});

//Get User Detial

const getUserDetials = catchAsyncError(async (req, res, next) => {
   const user = await User.findById(req.user._id);
   res.status(200).json({
      success: true,
      user
   });
});

// Update User Password

const updateUserPassword = catchAsyncError(async (req, res, next) => {
   const { oldPassword, confirmPassword, newPassword } = req.body;
   if (!(oldPassword || confirmPassword || newPassword)) {
      return next(new ErrorHandler("Please fill all fields"));
   }
   const user = await User.findById(req.user.id).select("+password");

   const isPasswordMatched = await user.comparePassword(oldPassword);

   if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
   }

   if (newPassword !== confirmPassword) {
      return next(new ErrorHandler("Password does not match", 400));
   }

   user.password = newPassword;

   await user.save({ validateBeforeSave: false });

   res.status(200).json({
      success: true,
      user: {},
      message: "User password updated successfully"
   });
});

// Update User Profile

const updateProfile = catchAsyncError(async (req, res, next) => {
   const { name, email, avatar } = req.body;

   if (!name && !email) {
      return next(new ErrorHandler("Please fill at least one field (name or email)", 400));
   }

   const newUserData = {
      name,
      email
   };

   if (avatar && avatar !== req.user?.avatar?.url) {
      const response = await uploadUpdateCloudinary(req.user?.avatar?.public_id, avatar, "avatars");

      newUserData.avatar = {
         public_id: response?.public_id,
         url: response?.secure_url
      };
   }

   await Product.updateMany({ "reviews.user": req.user._id }, { $set: { "reviews.$.name": newUserData.name } });

   const user = await User.findByIdAndUpdate(req.user._id, newUserData, {
      new: true
   });

   res.status(200).json({
      success: true,
      message: "User updated successfully"
   });
});

//Get all Users --Admin
const getAllUsers = catchAsyncError(async (req, res, next) => {
   const users = await User.find();

   res.status(200).json({
      success: true,
      users
   });
});

//Get Single User --Admin

const getSingleUser = catchAsyncError(async (req, res, next) => {
   const user = await User.findById(req.params.id);

   if (!user) {
      return next(new ErrorHandler(`User does not exit with id:${req.params.id}`));
   }
   res.status(200).json({
      success: true,
      user
   });
});

//Update User Role --Admin

const updateUserRole = catchAsyncError(async (req, res, next) => {
   const { name, email, role } = req.body;

   const newUserData = {
      name: name,
      email: email,
      role: role
   };

   const user = await User.findByIdAndUpdate(
      req.params.id,

      { $set: newUserData },
      {
         new: true
      }
   );

   res.status(200).json({
      success: true,
      message: "User Updated successfully"
   });
});

// Delete User --Admin

const deleteUser = catchAsyncError(async (req, res, next) => {
   const user = await User.findById(req.params.id);

   if (!user) {
      return next(new ErrorHandler(`User cannot exist with id: ${req.params.id}`, 400));
   }

   await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

   await User.findByIdAndDelete(user?._id);

   res.status(200).json({
      success: true
   });
});

export {
   deleteUser,
   forgotPassword,
   getAllUsers,
   getSingleUser,
   getUserDetials,
   loginUser,
   logoutUser,
   registerUser,
   resetPassword,
   updateProfile,
   updateUserPassword,
   updateUserRole
};
