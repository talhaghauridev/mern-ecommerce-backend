import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, "PLease Enter product Name"]
   },
   description: {
      type: String,
      required: [true, "Please Enter product Descripton"]
   },
   price: {
      type: Number,
      required: [true, "Please Enter product Price"],
      maxLength: [8, "Price cannot exceed 8 characters"]
   },
   ratings: {
      type: Number,
      default: 0
   },

   images: [
      {
         public_Id: {
            type: String,
            required: true
         },
         url: {
            type: String,
            required: true
         }
      }
   ],
   category: {
      type: String,
      required: [true, "Please Enter  product Category"],
      lowercase: true
   },
   stock: {
      type: Number,
      required: [true, "Please Enter product stock"],
      maxLength: [4, "Stock cannot exceed 4 characters"],
      default: 1
   },
   numOfReviews: {
      type: String,
      default: 0
   },
   reviews: [
      {
         user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true
         },
         name: {
            type: String,
            required: true
         },
         rating: {
            type: Number,
            required: true
         },
         comment: {
            type: String,
            required: true
         },
         createdAt: {
            type: Date, // Add a field for creation date
            default: Date.now // Default value is the current date/time
         }
      }
   ],
   user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true
   },
   createAt: {
      type: Date,
      default: Date.now
   }
});

export default mongoose.model("Product", productSchema);
