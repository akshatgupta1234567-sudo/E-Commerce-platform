const path = require("path");
const multer = require("multer");

const upload = multer({
  dest: path.join(__dirname, "..", "uploads"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return callback(new Error("Upload a PNG, JPEG, WebP, or GIF image"));
    }
    return callback(null, true);
  },
});

module.exports = upload;
