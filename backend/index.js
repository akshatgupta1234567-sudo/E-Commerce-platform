const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const connectDB = require("./config/db");

const app = express();
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => {
  res.send("commerce platform backend is running");
});

app.get("/api/health", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "unavailable",
    database: connected ? "connected" : "disconnected",
  });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Image files must be 5 MB or smaller"
      : "Unable to accept the uploaded file";
    return res.status(400).json({ message });
  }
  if (error.message.startsWith("Upload a ")) {
    return res.status(400).json({ message: error.message });
  }
  console.error("API REQUEST ERROR:", error);
  return res.status(500).json({ message: "Unexpected server error" });
});

const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set JWT_SECRET to a random secret of at least 32 characters");
  }
  await connectDB();
  const port = Number(process.env.PORT) || 5000;
  return app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Unable to start the API:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };
