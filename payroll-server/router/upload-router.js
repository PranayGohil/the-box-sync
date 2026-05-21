const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  uploadLogo,
  uploadStaff,
  uploadBillFiles,
} = require("../controllers/upload-controller");

const uploadRouter = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, "../uploads");
    if (file.fieldname === "photo") {
      uploadPath = path.join(uploadPath, "staff/profile");
    } else if (
      file.fieldname === "front_image" ||
      file.fieldname === "back_image"
    ) {
      uploadPath = path.join(uploadPath, "staff/id_cards");
    } else if (file.fieldname.includes("dish_img")) {
      uploadPath = path.join(uploadPath, "menu/dishes");
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Route for uploading the logo
uploadRouter.post("/uploadlogo", upload.single("logo"), uploadLogo);

// Route for uploading staff details and photos
uploadRouter.post(
  "/uploadstaff",
  upload.fields([
    { name: "photo" },
    { name: "front_image" },
    { name: "back_image" },
  ]),
  uploadStaff
);

uploadRouter.post("/uploadbillfiles", uploadBillFiles);

uploadRouter.post(
  "/uploadmenuimages",
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const dir = path.join(__dirname, "../uploads/menu");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
      },
    }),
  }).array("dish_imgs"),
  (req, res) => {
    const filenames = req.files.map((f) => f.filename);
    res.json({ filenames }); // send array of filenames
  }
);

module.exports = uploadRouter;
