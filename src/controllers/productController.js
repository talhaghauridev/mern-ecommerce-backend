const catchAsyncError = require("../utils/catchAsyncError");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const ApiFeature = require("../utils/apiFeature");
const { default: mongoose } = require("mongoose");

// Create Product -- Admin

const createProduct = catchAsyncError(async (req, res, next) => {
  req.body.user = req.user.id;
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
  await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Product update successfully ",
  });
});

// Delete Product -- Admin

const deleteProduct = catchAsyncError(async (req, res, next) => {
  const id = req.params.id;
  const product = await Product.findById(id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  await Product.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "Product delete successfully",
  });
});

// Get All Product

const getAllProducts = catchAsyncError(async (req, res) => {
  const resultPerPage = 8;
  const productCount = await Product.countDocuments();
  const apifeature = new ApiFeature(Product.find(), req.query)
    .search()
    .filter();

  let products = await apifeature.query;

  const filteredProductCount = products?.length;
  apifeature.pagination(resultPerPage);

  // products = await apifeature.query;
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
  const id = req.params.id;
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product,
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

//Get All Reviews of the Product

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

//Delete Review

const deleteReview = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  // const productS = await Product.findByIdAndUpdate(
  //   req.query.productId,
  //   {
  //     $pull: {
  //       reviews: { _id: req.query._id },
  //     },
  //   },
  //   {
  //     new: true,
  //   }
  // );

  const reviews = product.reviews.filter((rev) => {
    rev._id.toString() !== req.query._id.toString();
  });
  console.log(reviews);
  let avg = 0;
  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  const ratings = avg / reviews.length;
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

  console.log(reviews);
  res.status(200).json({
    success: true,
    reviews
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
};
