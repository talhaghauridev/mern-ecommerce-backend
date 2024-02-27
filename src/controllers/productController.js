const catchAsyncError = require("../utils/catchAsyncError");
const { ApiFeature } = require("../utils/apiFeature");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const { uploadCloudinary } = require("../utils/cloudinary");
const { v2 } = require("cloudinary");

// Get All Product

const getAllProducts = catchAsyncError(async (req, res) => {
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();

  const apifeature = new ApiFeature(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);
  let products = await apifeature.query;

  const filteredProductCount = products.length;

  res.status(200).json({
    message: "Route is working fine",
    products,
    productCount,
    resultPerPage,
    filteredProductCount,
  });
});

//Get Product Detial

const getProductDetial = catchAsyncError(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product,
  });
});

// Create Product -- Admin

const createProduct = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
  let images = [];

  console.log("req.body.images", req.body.images);
  if (req.body.images && req.body.images.length > 0) {
    for (const image of req.body.images) {
      const uploadedImage = await uploadCloudinary(image, "products");
      images.push({
        public_Id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      });
    }
  }
  req.body.images = images;
  console.log("Upload Images", images);
  const product = await Product.create(req.body);
  res.status(200).json({
    success: true,
    message: "Product created successfully",
  });
});

// Update Product --Admin

const updateProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const existingImages = req.body.images.filter(
    (newImage) =>
      !product.images.some(
        (existingImage) => existingImage.url === newImage || newImage?.url
      )
  );

  const prevImages = product.images.filter((newImage) =>
    product.images.some(
      (existingImage) => existingImage.url === newImage || newImage?.url
    )
  );

  // const im =

  try {
    let images = [];

    for (const image of existingImages) {
      const uploadedImage = await uploadCloudinary(image, "products");
      images.push({
        public_Id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      });
    }

    const updatedImages = [...images, ...prevImages];
    req.body.images = updatedImages;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      {
        new: true,
        runValidators: true,
        useFindAndModify: false,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product update successful",
      data: updatedProduct,
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

  for (const image of product.images) {
    await v2.uploader.destroy(image.public_Id);
  }

  await Product.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Product delete successfully",
  });
});

//Get Admin Products -- Admin

const getAdminProducts = catchAsyncError(async (req, res) => {
  const products = await Product.find();
  res.status(200).json({
    success: true,
    products,
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
    comment,
  };

  const product = await Product.findById(productId);

  const existing = await product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (existing) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
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
    product,
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
    reviews: product.reviews,
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
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    reviews,
  });
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getProductDetial,
  productReview,
  getProductReviews,
  deleteReview,
  getAdminProducts,
};
