const Product = require("../model/product");
const cloudinary = require("../config/cloudinary");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const localUploadDirectory = path.join(__dirname, "..", "uploads", "products");
const apiPublicUrl = (relativePath) =>
  `${(process.env.PUBLIC_API_URL || "").replace(/\/$/, "")}${relativePath}`;

const uploadImage = async (file) => {
  if (!file) return "";
  const hasCloudinaryConfig = [
    process.env.CLOUDINARY_CLOUD_NAME || process.env.cloudinary_cloud_name,
    process.env.CLOUDINARY_API_KEY || process.env.cloudinary_api_key,
    process.env.CLOUDINARY_API_SECRET || process.env.cloudinary_api_secret,
  ].every(Boolean);
  if (!hasCloudinaryConfig) {
    const extensionByMime = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/gif": ".gif",
    };
    const fileName = `${crypto.randomUUID()}${extensionByMime[file.mimetype]}`;
    const destination = path.join(localUploadDirectory, fileName);
    await fs.mkdir(localUploadDirectory, { recursive: true });
    await fs.rename(file.path, destination);
    return apiPublicUrl(`/uploads/products/${fileName}`);
  }

  try {
    const result = await cloudinary.uploader.upload(file.path);
    return result.secure_url;
  } finally {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
    }
    catch (error) {
    res.status(500).json({ message: "server error" });
    }
};


const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
        res.json(product);
    }
    else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
};

const createProduct = async (req, res) => {
    try {
    const { name, description, price, category, stock } = req.body;
    if (!req.file) {
      return res.status(400).json({ message: "A product image is required" });
    }
    const imageurls = await uploadImage(req.file);
    const newProduct = new Product({
        name,
        description,
        price,
        category,
        stock,
        imageurls
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: "server error" });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name ?? product.name;
      product.description = description ?? product.description;
      product.price = price ?? product.price;
      product.category = category ?? product.category;
      product.stock = stock ?? product.stock;
      if(req.file) {
          product.imageurls = await uploadImage(req.file);
      }
        const updatedProduct = await product.save();
        res.json(updatedProduct);
    }
     else {
        res.status(404).json({ message: "Product not found" });
    }
  }
  catch (error) {
    res.status(500).json({ message: "server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
     if (product) {
        await product.deleteOne();
        res.json({ message: "Product removed" });
    }
    else {
        res.status(404).json({ message: "Product not found" });
    }
  }
    catch (error) {
    res.status(500).json({ message: "server error" });
  }
};

module.exports = {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct
};
