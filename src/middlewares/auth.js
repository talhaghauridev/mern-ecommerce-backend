import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import User from "../models/userModel.js";

export const isAuthenticationUser = catchAsyncError(async (req, res, next) => {
   const authorizationHeader = req.headers.authorization;

   if (!authorizationHeader) {
      return next(new ErrorHandler("Please Login to access to resources", 401));
   }

   // Extract the token from the Authorization header
   const token = authorizationHeader.replace("Bearer ", "");

   if (!token) {
      return next(new ErrorHandler("Please Login to access to resources", 401));
   }

   try {
      const decodeData = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decodeData.id);
      next();
   } catch (error) {
      return next(new ErrorHandler("Invalid token. Please log in again.", 401));
   }
});

export const authorizeRoles = (...roles) => {
   return (req, res, next) => {
      console.log(roles);

      if (!roles.includes(req.user.role)) {
         return next(new ErrorHandler(`Role:${req.user.role} is not allowed to access this resources`, 403));
      }
      next();
   };
};
