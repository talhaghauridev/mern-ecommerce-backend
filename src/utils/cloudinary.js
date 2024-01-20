const ErrorHandler = require("./errorhandler");
const { v2 } = require("cloudinary");

const uploadCloudinary = async (file, folder) => {
  try {
    if (!file) {
      throw new ErrorHandler("File not provided", 400);
    }

    const response = await v2.uploader.upload(file, {
      folder,
      resource_type: "auto",
    });

    if (!response) {
      throw new ErrorHandler("Error in upload file", 400);
    }

    return response;
  } catch (error) {
    console.log(error);

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
    console.log(error);
    throw new ErrorHandler(error, 400);
  }
};

module.exports = {
  uploadCloudinary,
  uploadUpdateCloudinary,
};
