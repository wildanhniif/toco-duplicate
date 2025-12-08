// utils/uploadToCloudinary.js
const cloudinary = require("../config/cloudinary");
const fs = require("fs");

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name (e.g., 'products', 'stores')
 * @param {object} options - Additional Cloudinary upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (
  filePath,
  folder = "products",
  options = {}
) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `toco-seller/${folder}`,
      resource_type: "auto",
      quality: "auto:good", // Auto quality optimization
      fetch_format: "auto", // Auto format selection (WebP for supported browsers)
      ...options,
    });

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    // Delete local file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of file objects with path property
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} - Array of upload results
 */
const uploadMultipleToCloudinary = async (files, folder = "products") => {
  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file.path, folder)
  );
  return Promise.all(uploadPromises);
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<object>} - Delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

/**
 * Upload file buffer to Cloudinary (for memory storage)
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} folder - Cloudinary folder name
 * @param {object} options - Additional Cloudinary upload options
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadBufferToCloudinary = (
  buffer,
  folder = "products",
  options = {}
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `toco-seller/${folder}`,
        resource_type: "auto",
        quality: "auto:good",
        fetch_format: "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array<string>} publicIds - Array of Cloudinary public_ids
 * @returns {Promise<object>} - Delete result
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error("Error deleting multiple from Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
};
