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
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({
      logo: req.file.filename,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload logo error:", error);
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

const sharp = require("sharp");
const axios = require("axios");
const uploadCampaignImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const slugify = (text) => {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
    };

    const restaurantSlug = slugify(req.body.restaurantName || "restaurant");
    const campaignSlug = slugify(req.body.campaignName || "campaign");
    const uniqueFilename = `${restaurantSlug}-${campaignSlug}-${Date.now()}.jpg`;

    // 1. Convert to progressive JPEG buffer using sharp (for WhatsApp preview compatibility)
    const processedBuffer = await sharp(req.file.buffer)
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    // 2. Check if ImageKit keys are configured (and not placeholders)
    const hasImageKit =
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_PRIVATE_KEY !== "your_private_key_here";

    if (hasImageKit) {
      try {
        const ImageKit = require("@imagekit/nodejs");
        const { toFile } = ImageKit;
        const imagekit = new ImageKit({
          publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
          privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
          urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });

        const wrappedFile = await toFile(processedBuffer, uniqueFilename);
        const ikResponse = await imagekit.files.upload({
          file: wrappedFile,
          fileName: uniqueFilename,
          folder: "/campaigns"
        });

        return res.json({
          success: true,
          url: ikResponse.url, // Full public CDN URL from ImageKit
          isImageKit: true,
          filename: uniqueFilename,
        });
      } catch (ikError) {
        console.error("ImageKit upload failed, falling back to local:", ikError.message || ikError);
      }
    }

    // 3. Fallback: Save locally
    const uploadPath = path.join(__dirname, "../uploads/campaigns");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    await sharp(processedBuffer).toFile(path.join(uploadPath, uniqueFilename));

    res.json({
      success: true,
      url: `/uploads/campaigns/${uniqueFilename}`, // Relative local path fallback
      isImageKit: false,
      filename: uniqueFilename,
    });
  } catch (error) {
    console.error("Upload campaign image error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadLogo,
  uploadStaff,
  uploadBillFiles,
  uploadCampaignImage,
};
