const cloudianry = require("cloudinary").v2;
require("dotenv").config();

cloudianry.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret,
});

// for uploading image to cloudinary search cloudinary npm package
// use it in the controller to upload image to cloudinary and get the url of the image
// save it to the database

module.exports = cloudianry;
