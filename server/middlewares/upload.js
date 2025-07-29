// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, "../uploads");

    switch (file.fieldname) {
      case "logo":
        uploadPath = path.join(uploadPath, "branding/logo");
        break;
      case "photo":
        uploadPath = path.join(uploadPath, "staff/profile");
        break;
      case "front_image":
      case "back_image":
        uploadPath = path.join(uploadPath, "staff/id_cards");
        break;
      case "bill_files":
        uploadPath = path.join(uploadPath, "inventory/bills");
        break;
      default:
        if (file.fieldname.includes("dish_img")) {
          uploadPath = path.join(uploadPath, "menu/dishes");
        } else {
          uploadPath = path.join(uploadPath, "misc");
        }
    }

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
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
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
