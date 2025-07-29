import ErrorHandler from "./errorhandler.js";
import { v2 } from "cloudinary";
import dotenv from "dotenv";
import { cloudinaryConfig } from "../config/index.js";

dotenv.config();

v2.config(cloudinaryConfig);

const uploadCloudinary = async (file, folder) => {
   try {
      if (!file) {
         throw new ErrorHandler("File not provided", 400);
      }

      const response = await v2.uploader.upload(file, {
         folder: `ecommerce-backend/${folder}`,
         resource_type: "auto"
      });

      if (!response) {
         throw new ErrorHandler("Error in upload file", 400);
      }

      return response;
   } catch (error) {
      throw new ErrorHandler(error, 400);
   }
};

const uploadUpdateCloudinary = async (public_id, file, folder) => {
   try {
      await v2.uploader.destroy(public_id);
      const response = await uploadCloudinary(file, folder);
      if (!response) {
         throw new ErrorHandler("Error in upload file", 400);
      }
      return response;
   } catch (error) {
      throw new ErrorHandler(error, 400);
   }
};

const removeCloudinaryFolder = async (folderPath) => {
   try {
      // Get all resources in the folder
      const { resources } = await v2.search.expression(`folder:${folderPath}/*`).max_results(500).execute();

      // Delete each resource
      const deletePromises = resources.map((resource) => v2.uploader.destroy(resource.public_id));

      await Promise.all(deletePromises);

      // Delete the folder itself
      await v2.api.delete_folder(folderPath);

      return true;
   } catch (error) {
      console.error("Error deleting Cloudinary folder:", error);
      throw new ErrorHandler("Failed to delete images from Cloudinary", 400);
   }
};

export { uploadCloudinary, uploadUpdateCloudinary, removeCloudinaryFolder };
