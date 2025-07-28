const WebPMux = require("node-webpmux");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/inventory/bills");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and PDFs are allowed."));
    }
  },
});

const uploadLogo = (req, res) => {
  try {
    res.json({
      logo: req.file.filename,
      message: "File uploaded successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadStaff = (req, res) => {
  try {
    res.json({
      photo: req.files["photo"] ? req.files["photo"][0].filename : null,
      front_image: req.files["front_image"]
        ? req.files["front_image"][0].filename
        : null,
      back_image: req.files["back_image"]
        ? req.files["back_image"][0].filename
        : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadBillFiles = (req, res) => {
  upload.array("bill_files", 10)(req, res, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "File upload failed", error: err });
    }
    const fileNames = req.files.map(
      (file) => `${file.filename}`
    );
    res.status(200).json({
      message: "Files uploaded successfully",
      fileNames,
    });
  });
};

module.exports = {
  uploadLogo,
  uploadStaff,
  uploadBillFiles,
};
