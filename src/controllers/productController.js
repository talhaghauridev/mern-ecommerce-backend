import { v2 } from "cloudinary";
import { CACHE_KEYS, CACHE_TTL } from "../constants.js";
import Product from "../models/productModel.js";
import cacheManager from "../utils/cacheManager.js";
import catchAsyncError from "../utils/catchAsyncError.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import ErrorHandler from "../utils/errorhandler.js";
import ApiFeature from "./../utils/apifeature.js";

// Get All Product

const getAllProducts = catchAsyncError(async (req, res) => {
   const resultPerPage = 8;
   const productCount = await Product.countDocuments();

   const apiFeature = new ApiFeature(Product.find(), req.query).search().filter();
   const filteredProductCount = await apiFeature.query.clone().countDocuments();
   apiFeature.pagination(resultPerPage);
   let products = await apiFeature.query;

   res.status(200).json({
      message: "Route is working fine",
      products,
      productCount,
      resultPerPage,
      filteredProductCount
   });
});

//Get Product Detail

const getProductDetial = catchAsyncError(async (req, res, next) => {
   const productId = req.params.id;

   // Try to get from cache
   const cachedProduct = cacheManager.get(CACHE_KEYS.PRODUCT_DETAIL(productId));
   if (cachedProduct) {
      return res.status(200).json({
         success: true,
         product: cachedProduct
      });
   }

   const product = await Product.findById(productId);

   if (!product) {
      return next(new ErrorHandler("Product not found", 404));
   }

   // Cache the product for 10 minutes
   cacheManager.set(CACHE_KEYS.PRODUCT_DETAIL(productId), product, CACHE_TTL.MEDIUM);

   res.status(200).json({
      success: true,
      product
   });
});

// Create Product -- Admin

const createProduct = catchAsyncError(async (req, res, next) => {
   req.body.user = req.user.id;
   let images = [];

   if (req.body.images && req.body.images.length > 0) {
      for (const image of req.body.images) {
         const uploadedImage = await uploadCloudinary(image, "products");
         images.push({
            public_Id: uploadedImage.public_id,
            url: uploadedImage.secure_url
         });
      }
   }
   req.body.images = images;
   const product = await Product.create(req.body);
   res.status(200).json({
      success: true,
      message: "Product created successfully"
   });
});

// Update Product --Admin

const updateProduct = catchAsyncError(async (req, res, next) => {
   const product = await Product.findById(req.params.id);
   if (!product) {
      return next(new ErrorHandler("Product not found", 404));
   }

   // Invalidate product caches when updating
   cacheManager.del(CACHE_KEYS.PRODUCT_DETAIL(req.params.id));
   cacheManager.del(CACHE_KEYS.ADMIN_PRODUCTS);

   // Determine updated image URLs from request
   const updatedImageUrls = Array.isArray(req.body.images) ? req.body.images : [req.body.images];

   // Remove images deleted by user
   const imagesToRemove = product.images.filter((pi) => !updatedImageUrls.includes(pi.url));
   for (const img of imagesToRemove) {
      await v2.uploader.destroy(img.public_Id);
   }

   // Keep existing images
   const keptImages = product.images.filter((pi) => updatedImageUrls.includes(pi.url));

   try {
      // Upload new images
      const uploadedImages = [];
      const existingUrls = product.images.map((pi) => pi.url);
      const toUpload = updatedImageUrls.filter((url) => !existingUrls.includes(url));
      for (const dataUrl of toUpload) {
         const uploaded = await uploadCloudinary(dataUrl, "products");
         uploadedImages.push({ public_Id: uploaded.public_id, url: uploaded.secure_url });
      }

      // Final image array
      const finalImages = [...uploadedImages, ...keptImages];
      req.body.images = finalImages;

      const updatedProduct = await Product.findByIdAndUpdate(
         req.params.id,
         { ...req.body },
         {
            new: true,
            runValidators: true,
            useFindAndModify: false
         }
      );

      res.status(200).json({
         success: true,
         message: "Product update successful",
         data: updatedProduct
      });
   } catch (error) {
      console.error("Error uploading images to Cloudinary:", error);
      next(new ErrorHandler("Error updating product", 500));
   }
});

// Delete Product -- Admin

const deleteProduct = catchAsyncError(async (req, res, next) => {
   const id = req.params.id;
   const product = await Product.findById(id);

   if (!product) {
      return next(new ErrorHandler("Product not found", 404));
   }

   // Invalidate all related caches when deleting a product
   cacheManager.del(CACHE_KEYS.PRODUCT_DETAIL(id));
   cacheManager.del(CACHE_KEYS.PRODUCT_REVIEWS(id));
   cacheManager.del(CACHE_KEYS.ADMIN_PRODUCTS);

   for (const image of product.images) {
      await v2.uploader.destroy(image.public_Id);
   }

   await Product.findByIdAndDelete(id);

   return res.status(200).json({
      success: true,
      message: "Product delete successfully"
   });
});

//Get Admin Products -- Admin

const getAdminProducts = catchAsyncError(async (req, res) => {
   // Try to get from cache
   const cachedProducts = cacheManager.get(CACHE_KEYS.ADMIN_PRODUCTS);
   if (cachedProducts) {
      return res.status(200).json({
         success: true,
         products: cachedProducts
      });
   }

   const products = await Product.find();

   // Cache for 5 minutes as admin data might change more frequently
   cacheManager.set(CACHE_KEYS.ADMIN_PRODUCTS, products, CACHE_TTL.SHORT);

   res.status(200).json({
      success: true,
      products
   });
});

//Create new Review and Update the Review

const productReview = catchAsyncError(async (req, res, next) => {
   const { rating, comment, productId } = req.body;
   if (!(rating || comment || productId)) {
      return next(new ErrorHandler("Please fill all fields"));
   }
   const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment
   };

   // Invalidate related caches when a review is added/updated
   cacheManager.del(CACHE_KEYS.PRODUCT_DETAIL(productId));
   cacheManager.del(CACHE_KEYS.PRODUCT_REVIEWS(productId));

   const product = await Product.findById(productId);

   const existing = await product.reviews.find((rev) => rev.user.toString() === req.user._id.toString());

   if (existing) {
      product.reviews.forEach((rev) => {
         if (rev.user.toString() === req.user._id.toString()) ((rev.rating = rating), (rev.comment = comment));
      });
   } else {
      product.reviews.push(review);
      product.numOfReviews = product.reviews.length;
   }
   let avg = 0;
   product.ratings = product.reviews.forEach((rev) => {
      avg += rev.rating;
   });
   product.ratings = avg / product.reviews.length;
   await product.save({ validateBeforeSave: false });
   res.status(200).json({
      success: true,
      product
   });
});

//Get All Reviews of the Product -- Admin

const getProductReviews = catchAsyncError(async (req, res, next) => {
   const product = await Product.findById(req.query.productId);
   if (!product) {
      return next(new ErrorHandler("Product not found", 404));
   }
   res.status(200).json({
      success: true,
      reviews: product.reviews
   });
});

//Delete Review -- Admin

const deleteReview = catchAsyncError(async (req, res, next) => {
   const product = await Product.findById(req.query.productId);

   if (!product) {
      return next(new ErrorHandler("Product not found", 404));
   }

   const reviews = product.reviews.filter((rev) => {
      return rev._id.toString() !== req.query._id.toString();
   });
   let avg = 0;
   reviews.forEach((rev) => {
      avg += rev.rating;
   });

   let ratings = 0;
   if (reviews.length === 0) {
      ratings = 0;
   } else {
      ratings = avg / reviews.length;
   }

   const numOfReviews = reviews.length;

   await Product.findByIdAndUpdate(
      req.query.productId,
      {
         reviews,
         ratings,
         numOfReviews
      },
      {
         new: true,
         runValidators: true,
         useFindAndModify: false
      }
   );

   res.status(200).json({
      success: true,
      reviews
   });
});

export {
   createProduct,
   deleteProduct,
   deleteReview,
   getAdminProducts,
   getAllProducts,
   getProductDetial,
   getProductReviews,
   productReview,
   updateProduct
};
