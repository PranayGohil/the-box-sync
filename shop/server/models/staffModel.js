const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const addStaff = new Schema({
  staff_id: {
    type: String,
  },
  f_name: {
    type: String,
  },
  l_name: {
    type: String,
  },
  birth_date: {
    type: String,
  },
  joining_date: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  phone_no: {
    type: Number,
  },
  email: {
    type: String,
  },
  gender: {
    type: String,
  },
  pincode: {
    type: String,
  },
  position: {
    type: String,
  },
  salary: {
    type: Number,
  },
  salary_structure: {
    earnings: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      conveyance: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      special: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      pf_percentage: { type: Number, default: 12 },
      esi_percentage: { type: Number, default: 0 },
      pt: { type: Number, default: 200 }
    }
  },
  overtime_rate: {
    type: Number,
    default: 0,
  },
  photo: {
    type: String,
  },
  document_type: {
    type: String,
  },
  id_number: {
    type: String,
  },
  front_image: {
    type: String,
  },
  back_image: {
    type: String,
  },
  face_encoding: {
    type: [Number],
    default: [],
  },
  face_embeddings: {
    type: [Number],
    default: [],
  },
  user_id: {
    type: String,
  },
  password: {
    type: String,
    select: false,
  },
  // ── Compliance & Bank Details ──────────────────────────────────────────────
  bank_account: {
    account_number: { type: String, default: "" },
    bank_name: { type: String, default: "" },
    ifsc_code: { type: String, default: "" },
    branch: { type: String, default: "" }
  },
  uan_number: { type: String, default: "" },    // EPF Universal Account Number
  esi_ip_number: { type: String, default: "" }, // ESI Insurance Number
});

// Indexes
addStaff.index({ user_id: 1, position: 1 });
addStaff.index({ user_id: 1, email: 1 }, { sparse: true });
addStaff.index({ user_id: 1, staff_id: 1 }, { sparse: true });
addStaff.index({ user_id: 1 });

const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const secretKey = process.env.JWT_SECRETKEY || "Secret-X-D!g!talTr!polyStud!o_N_TheB0xSync_2o24";
const key = crypto.scryptSync(secretKey, "salt", 32);
const iv = Buffer.alloc(16, 0);

function encrypt(text) {
  if (!text) return text;
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decrypt(text) {
  if (!text) return text;
  try {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return text;
  }
}

addStaff.pre("save", async function (next) {
  const staff = this;
  if (!staff.isModified("password") || !staff.password) {
    return next();
  }
  try {
    // Encrypt the password using AES
    staff.password = encrypt(staff.password);
    return next();
  } catch (error) {
    return next(error);
  }
});

addStaff.methods.comparePassword = async function (candidatePassword) {
  const passwordInDb = this.password;
  if (!passwordInDb) return false;
  if (passwordInDb.startsWith("$2a$") || passwordInDb.startsWith("$2b$")) {
    return bcrypt.compare(candidatePassword, passwordInDb);
  }
  const decryptedPassword = decrypt(passwordInDb);
  return candidatePassword === decryptedPassword;
};

const Staff = mongoose.model("staff", addStaff);
Staff.encrypt = encrypt;
Staff.decrypt = decrypt;
module.exports = Staff;