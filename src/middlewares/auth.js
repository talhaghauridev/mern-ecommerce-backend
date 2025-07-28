import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorhandler.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import User from "../models/userModel.js";
import cacheManager from "../utils/cacheManager.js";
import { CACHE_KEYS, CACHE_TTL } from "../constants.js";

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

      // Try to get user from cache first
      const cachedUser = cacheManager.get(CACHE_KEYS.USER_DETAIL(decodeData.id));

      if (cachedUser) {
         console.log("User found in cache:", cachedUser);
         req.user = cachedUser;
         return next();
      }

      // If not in cache, get from database
      const user = await User.findById(decodeData.id).select("-password -resetPasswordToken -resetPasswordExpire");
      if (!user) {
         return next(new ErrorHandler("User not found", 401));
      }

      cacheManager.set(CACHE_KEYS.USER_DETAIL(decodeData.id), user, CACHE_TTL.MEDIUM);

      req.user = user;
      next();
   } catch (error) {
      console.error("JWT verification failed:", error);
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
