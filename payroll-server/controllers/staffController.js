const Staff = require("../models/staffModel");
const StaffAttendance = require("../models/staffAttendanceModel");
const PayrollConfig = require("../models/PayrollConfig");
const { sendEmail } = require("../utils/emailService");
const html_to_pdf = require('html-pdf-node');
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Helper to convert and compress image to webp
const convertToWebp = async (file) => {
  if (!file) return null;
  
  const originalPath = file.path;
  const ext = path.extname(originalPath);
  const directory = path.dirname(originalPath);
  const baseName = path.basename(originalPath, ext);
  
  const newFilename = `${baseName}.webp`;
  const destinationPath = path.join(directory, newFilename);
  
  try {
    await sharp(originalPath)
      .resize({
        width: 1200,
        height: 1200,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(destinationPath);
      
    // Delete the original file
    fs.unlink(originalPath, (err) => {
      if (err) console.error(`Error deleting original file: ${originalPath}`, err);
    });
    
    return newFilename;
  } catch (error) {
    console.error("Error converting image to webp:", error);
    // Fallback to original filename if sharp fails
    return file.filename;
  }
};

// ── Helper: get today's date in IST (YYYY-MM-DD) ─────────────────────────────
const getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// Helper: Compile all text and salary bifurcation placeholders for staff member
const getStaffFieldMap = (staff, config) => {
  const fields = {
    first_name: staff.f_name || '',
    last_name: staff.l_name || '',
    full_name: `${staff.f_name || ''} ${staff.l_name || ''}`.trim(),
    job_title: staff.position || '',
    joining_date: staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN') : '',
    staff_id: staff.staff_id || '',
    email: staff.email || '',
    phone: staff.phone_no ? String(staff.phone_no) : '',
    gross_salary: staff.salary ? String(staff.salary) : '0',
    
    // Default earnings
    basic_salary: '0',
    hra: '0',
    conveyance: '0',
    medical_allowance: '0',
    special_allowance: '0',
    other_allowance: '0',
    
    // Default deductions
    pf_deduction: '0',
    esi_deduction: '0',
    pt_deduction: '0'
  };

  if (staff.salary_structure) {
    const earnings = staff.salary_structure.custom_earnings || {};
    const getVal = (obj, key) => {
      if (!obj) return 0;
      if (typeof obj.get === 'function') return obj.get(key) || 0;
      return obj[key] || 0;
    };

    fields.basic_salary = String(getVal(earnings, 'basic'));
    fields.hra = String(getVal(earnings, 'hra'));
    fields.conveyance = String(getVal(earnings, 'conveyance'));
    fields.medical_allowance = String(getVal(earnings, 'medical'));
    fields.special_allowance = String(getVal(earnings, 'special'));
    fields.other_allowance = String(getVal(earnings, 'other'));

    if (config?.custom_earnings) {
      config.custom_earnings.forEach(earning => {
        if (!['basic', 'hra', 'conveyance', 'medical', 'special', 'other'].includes(earning.id)) {
          fields[earning.id] = String(getVal(earnings, earning.id));
        }
      });
    }

    const statConfig = config?.statutory_config || {};
    const baseVal = getVal(earnings, 'basic') || staff.salary || 0;
    const grossVal = staff.salary || 0;

    if (statConfig.pf && statConfig.pf.is_mandatory) {
      const limit = statConfig.pf.salary_limit || 0;
      let pfBase = baseVal;
      if (limit > 0 && pfBase > limit) pfBase = limit;
      fields.pf_deduction = String(parseFloat((pfBase * (statConfig.pf.employee_percentage / 100)).toFixed(2)));
    }

    if (statConfig.esi && statConfig.esi.is_mandatory) {
      const limit = statConfig.esi.gross_limit || 21000;
      if (grossVal <= limit) {
        fields.esi_deduction = String(parseFloat((grossVal * (statConfig.esi.employee_percentage / 100)).toFixed(2)));
      }
    }

    if (statConfig.pt && statConfig.pt.is_applicable) {
      let ptAmount = 0;
      for (const slab of (statConfig.pt.slabs || [])) {
        if (grossVal >= (slab.min_salary || 0) && (!slab.max_salary || grossVal <= slab.max_salary)) {
          ptAmount = slab.amount;
          break;
        }
      }
      fields.pt_deduction = String(ptAmount);
    }
  }
  
  return fields;
};

// ── GET /staff/get-positions ──────────────────────────────────────────────────
const getStaffPositions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const positions = await Staff.distinct("position", { user_id: userId });
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /staff/get-all ────────────────────────────────────────────────────────
const getStaffData = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 50;

    const projection = {
      staff_id: 1,
      f_name: 1,
      l_name: 1,
      email: 1,
      phone_no: 1,
      position: 1,
      role: 1,
      salary: 1,
      photo: 1,
      joining_date: 1,
      department: 1,
      department_node_id: 1,
      branch_id: 1,
      resignation: 1,
    };

    const [data, total] = await Promise.all([
      Staff.find({ user_id: userId })
        .select(projection)
        .sort({ f_name: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Staff.countDocuments({ user_id: userId }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /staff/get/:id ────────────────────────────────────────────────────────
const getStaffDataById = async (req, res) => {
  try {
    const staffId = req.params.id;
    
    let adminUserId;
    let isStaff = false;
    let loggedInStaffId = null;

    if (req.user && typeof req.user === "object") {
        if (req.user.Role === "Staff") {
            adminUserId = req.user._id;
            isStaff = true;
            loggedInStaffId = req.user.staff_id;
        } else {
            adminUserId = req.user._id || req.user;
        }
    } else {
        adminUserId = req.user;
    }

    if (isStaff && staffId !== loggedInStaffId) {
        return res.status(403).json({ success: false, message: "Forbidden: You can only access your own profile." });
    }

    const staff = await Staff.findOne({ _id: staffId, user_id: adminUserId }).select("+password").lean();

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    if (staff.password) {
      if (staff.password.startsWith("$2a$") || staff.password.startsWith("$2b$")) {
        staff.password = "********";
      } else {
        staff.password = Staff.decrypt(staff.password);
      }
    } else {
      staff.password = "";
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /staff/add ───────────────────────────────────────────────────────────
const addStaff = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    console.log("addStaff called. req.body keys:", Object.keys(req.body));
    console.log("req.body.password:", req.body.password ? `Received (len: ${req.body.password.length})` : "NOT received/empty");
    const staffData = {
      ...req.body,
      user_id: userId,
    };

    // Support mapping face_descriptor or face_encoding from frontend
    const faceDataRaw = req.body.face_descriptor || req.body.face_encoding;
    if (faceDataRaw) {
      try {
        staffData.face_encoding = typeof faceDataRaw === "string" ? JSON.parse(faceDataRaw) : faceDataRaw;
      } catch (error) {
        console.error("Error parsing face_encoding/face_descriptor:", error);
        return res.status(400).json({ error: "Invalid face encoding data" });
      }
    }

    if (staffData.salary_structure && typeof staffData.salary_structure === "string") {
      try {
        staffData.salary_structure = JSON.parse(staffData.salary_structure);
      } catch (e) {
        console.error("Invalid salary_structure JSON");
      }
    }

    if (staffData.increment_plan && typeof staffData.increment_plan === "string") {
      try {
        staffData.increment_plan = JSON.parse(staffData.increment_plan);
      } catch (e) {
        console.error("Invalid increment_plan JSON");
      }
    }

    if (staffData.custom_weekly_offs && typeof staffData.custom_weekly_offs === "string") {
      try {
        staffData.custom_weekly_offs = JSON.parse(staffData.custom_weekly_offs);
      } catch (e) {
        console.error("Invalid custom_weekly_offs JSON");
      }
    }

    if (staffData.leave_policy_configuration && typeof staffData.leave_policy_configuration === "string") {
      try {
        staffData.leave_policy_configuration = JSON.parse(staffData.leave_policy_configuration);
      } catch (e) {
        console.error("Invalid leave_policy_configuration JSON");
      }
    }

    if (staffData.bank_account && typeof staffData.bank_account === "string") {
      try {
        staffData.bank_account = JSON.parse(staffData.bank_account);
      } catch (e) {
        console.error("Invalid bank_account JSON");
      }
    }

    if (req.files?.photo?.[0]) {
      const webpFilename = await convertToWebp(req.files.photo[0]);
      staffData.photo = `/staff/profile/${webpFilename}`;
    }
    if (req.files?.front_image?.[0]) {
      const webpFilename = await convertToWebp(req.files.front_image[0]);
      staffData.front_image = `/staff/id_cards/${webpFilename}`;
    }
    if (req.files?.back_image?.[0]) {
      const webpFilename = await convertToWebp(req.files.back_image[0]);
      staffData.back_image = `/staff/id_cards/${webpFilename}`;
    }
    if (req.files?.pan_image?.[0]) {
      const webpFilename = await convertToWebp(req.files.pan_image[0]);
      staffData.pan_image = `/staff/id_cards/${webpFilename}`;
    }

    const staff = await Staff.create(staffData);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// ── PUT /staff/edit/:id ───────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user;
    console.log("updateStaff called. req.body keys:", Object.keys(req.body));
    console.log("req.body.password:", req.body.password ? `Received (len: ${req.body.password.length})` : "NOT received/empty");

    const existingStaff = await Staff.findOne({ _id: id, user_id: userId }).select("+password");
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const staffData = { ...req.body };

    const removeFile = (relativePath) => {
      if (!relativePath) return;
      const filename = path.basename(relativePath);
      let folder = "";
      if (relativePath.includes("/staff/profile")) folder = "staff/profile";
      else if (relativePath.includes("/staff/id_cards")) folder = "staff/id_cards";
      const fullPath = path.join(__dirname, "..", "uploads", folder, filename);
      fs.unlink(fullPath, (err) => {
        if (err) console.error(`Error deleting file: ${fullPath}`, err);
      });
    };

    if (req.files?.photo?.[0]) {
      removeFile(existingStaff.photo);
      const webpFilename = await convertToWebp(req.files.photo[0]);
      staffData.photo = `/staff/profile/${webpFilename}`;
    }
    if (req.files?.front_image?.[0]) {
      removeFile(existingStaff.front_image);
      const webpFilename = await convertToWebp(req.files.front_image[0]);
      staffData.front_image = `/staff/id_cards/${webpFilename}`;
    }
    if (req.files?.back_image?.[0]) {
      removeFile(existingStaff.back_image);
      const webpFilename = await convertToWebp(req.files.back_image[0]);
      staffData.back_image = `/staff/id_cards/${webpFilename}`;
    }

    const faceDataRaw = req.body.face_descriptor || req.body.face_encoding;
    if (faceDataRaw) {
      try {
        staffData.face_encoding = typeof faceDataRaw === "string" ? JSON.parse(faceDataRaw) : faceDataRaw;
      } catch (error) {
        console.error("Error parsing face_encoding/face_descriptor:", error);
        return res.status(400).json({ error: "Invalid face encoding data" });
      }
    }

    if (staffData.salary_structure && typeof staffData.salary_structure === "string") {
      try {
        staffData.salary_structure = JSON.parse(staffData.salary_structure);
      } catch (e) {
        console.error("Invalid salary_structure JSON");
      }
    }

    if (staffData.increment_plan && typeof staffData.increment_plan === "string") {
      try {
        staffData.increment_plan = JSON.parse(staffData.increment_plan);
      } catch (e) {
        console.error("Invalid increment_plan JSON");
      }
    }

    if (staffData.custom_weekly_offs && typeof staffData.custom_weekly_offs === "string") {
      try {
        staffData.custom_weekly_offs = JSON.parse(staffData.custom_weekly_offs);
      } catch (e) {
        console.error("Invalid custom_weekly_offs JSON");
      }
    }

    if (staffData.leave_policy_configuration && typeof staffData.leave_policy_configuration === "string") {
      try {
        staffData.leave_policy_configuration = JSON.parse(staffData.leave_policy_configuration);
      } catch (e) {
        console.error("Invalid leave_policy_configuration JSON");
      }
    }

    if (staffData.bank_account && typeof staffData.bank_account === "string") {
      try {
        staffData.bank_account = JSON.parse(staffData.bank_account);
      } catch (e) {
        console.error("Invalid bank_account JSON");
      }
    }

    if (staffData.password) {
      if (staffData.password === "********") {
        delete staffData.password;
      } else {
        const decryptedExisting = Staff.decrypt(existingStaff.password);
        if (staffData.password === decryptedExisting) {
          delete staffData.password;
        }
      }
    } else {
      delete staffData.password;
    }

    Object.assign(existingStaff, staffData);
    const updatedStaff = await existingStaff.save();

    res.json({ success: true, message: "Staff updated successfully", staff: updatedStaff });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// ── DELETE /staff/delete/:id ──────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const userId = req.user?._id || req.user;

    const staffData = await Staff.findOne({ _id: staffId, user_id: userId });
    if (!staffData) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const deleteIfExists = (relativePath, folder) => {
      if (!relativePath) return;
      const filename = path.basename(relativePath);
      const fullPath = path.join(__dirname, "..", "uploads", folder, filename);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    };

    deleteIfExists(staffData.photo, "staff/profile");
    deleteIfExists(staffData.front_image, "staff/id_cards");
    deleteIfExists(staffData.back_image, "staff/id_cards");

    await Staff.deleteOne({ _id: staffId, user_id: userId });

    // NOTE: You may also want to delete the staff's attendance records:
    // const Attendance = require("../models/attendanceModel");
    // await Attendance.deleteMany({ staff_id: staffId });

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

// ── GET /staff/face-data ──────────────────────────────────────────────────────
const getAllFaceEncodings = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const today = getTodayIST();

    const query = {
      user_id: userId,
      face_encoding: { $exists: true, $ne: null, $not: { $size: 0 } },
    };

    if (req.user && typeof req.user === "object" && req.user.Role === "Staff") {
      query._id = req.user.staff_id;
    }

    const staff = await Staff.find(query)
      .select("_id staff_id f_name l_name email position photo face_encoding")
      .lean();

    if (staff.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch today's attendance records for all matched staff in a single query
    const staffIds = staff.map((s) => s._id);
    const todayRecords = await StaffAttendance.find({
      staff_id: { $in: staffIds },
      date: today,
    }).lean();

    // Build a map: staffId (string) → attendance record
    const attendanceMap = {};
    todayRecords.forEach((record) => {
      attendanceMap[record.staff_id.toString()] = record;
    });

    // Merge todayAttendance into each staff member
    const result = staff.map((s) => ({
      ...s,
      todayAttendance: attendanceMap[s._id.toString()] || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching encodings:", err);
    res.status(500).json({ success: false, error: "Failed to fetch face encodings" });
  }
};

// ── GET /staff/get-next-id ────────────────────────────────────────────────────
const getNextStaffIdController = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const lastStaff = await Staff.findOne({ user_id: userId })
      .sort({ _id: -1 })
      .select("staff_id")
      .lean();
      
    const lastId = lastStaff ? lastStaff.staff_id : null;
    
    const getNextStaffId = (lastId) => {
      if (!lastId) return "STF001";
      
      const match = lastId.match(/^(.*?)(\d+)$/);
      if (!match) {
        return `${lastId}001`;
      }
      
      const prefix = match[1];
      const numberStr = match[2];
      const nextNumber = parseInt(numberStr, 10) + 1;
      const paddedNumber = String(nextNumber).padStart(numberStr.length, '0');
      
      return `${prefix}${paddedNumber}`;
    };
    
    const nextId = getNextStaffId(lastId);
    res.json({ success: true, data: nextId });
  } catch (error) {
    console.error("Error generating next staff ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /staff/send-joining-letter/:id ──────────────────────────────────────
const sendJoiningLetter = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const staffId = req.params.id;

    // 1. Fetch Staff Details
    const staff = await Staff.findOne({ _id: staffId, user_id: userId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    if (!staff.email) {
      return res.status(400).json({ success: false, message: "Staff does not have a registered email address." });
    }

    const defaultJoiningLetter = `<p><strong>Subject: Offer of Employment</strong></p><p><br></p><p>Dear [First Name],</p><p><br></p><p>We are thrilled to offer you the position of <strong>[Job Title]</strong> with our company. Your expected joining date is <strong>[Date of Joining]</strong>. Your starting basic salary will be <strong>[Basic Salary]</strong>.</p><p><br></p><p>Your Staff ID is: <strong>[Staff ID]</strong></p><p><br></p><p>Welcome to the team!</p><p><br></p><p>Sincerely,</p><p>Management</p>`;

    // 2. Fetch Payroll Config for template
    const config = await PayrollConfig.findOne({ user_id: userId });
    let pdfBuffer = null;

    if (config?.document_templates?.joining_letter_pdf) {
      const templatePath = path.join(__dirname, '..', config.document_templates.joining_letter_pdf);
      if (fs.existsSync(templatePath)) {
        try {
          const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
          const tempDoc = await PDFDocument.load(fs.readFileSync(templatePath));
          
          const pdfFields = config.document_templates.joining_letter_pdf_fields || [];
          if (pdfFields && pdfFields.length > 0) {
            console.log(`Rendering PDF fields: ${pdfFields.length} fields found.`);
            const pages = tempDoc.getPages();
            
            const fieldsMap = getStaffFieldMap(staff, config);
            const font = await tempDoc.embedFont(StandardFonts.Helvetica);
            
            pdfFields.forEach(field => {
              const pageIndex = (field.page || 1) - 1;
              if (pageIndex >= 0 && pageIndex < pages.length) {
                const targetPage = pages[pageIndex];
                const textVal = fieldsMap[field.field_key] || '';
                const fontSize = Number(field.font_size) || 11;
                
                // Calculate width to cover text and draw white background rectangle
                const textWidth = font.widthOfTextAtSize(textVal, fontSize);
                targetPage.drawRectangle({
                  x: Number(field.x) || 100,
                  y: (Number(field.y) || 500) - 2,
                  width: textWidth + 4,
                  height: fontSize + 4,
                  color: rgb(1, 1, 1),
                });
                
                targetPage.drawText(textVal, {
                  x: Number(field.x) || 100,
                  y: Number(field.y) || 500,
                  size: fontSize,
                  font: font
                });
              }
            });
            pdfBuffer = Buffer.from(await tempDoc.save());
          } else {
            const form = tempDoc.getForm();
            const fields = form.getFields();
            
            if (fields && fields.length > 0) {
              fields.forEach(field => {
                const name = field.getName().toLowerCase();
                let textVal = '';
                if (name.includes('first_name') || name.includes('f_name') || name.includes('firstname')) {
                  textVal = staff.f_name || '';
                } else if (name.includes('last_name') || name.includes('l_name') || name.includes('lastname')) {
                  textVal = staff.l_name || '';
                } else if (name.includes('name') || name.includes('recipient') || name.includes('employee')) {
                  textVal = `${staff.f_name} ${staff.l_name}`;
                } else if (name.includes('title') || name.includes('position') || name.includes('role') || name.includes('designation')) {
                  textVal = staff.position || '';
                } else if (name.includes('date') || name.includes('joining') || name.includes('doj')) {
                  textVal = staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN') : '';
                } else if (name.includes('salary') || name.includes('basic') || name.includes('gross') || name.includes('compensation') || name.includes('pay')) {
                  textVal = staff.salary ? staff.salary.toString() : '';
                } else if (name.includes('staff_id') || name.includes('payroll_id') || name.includes('id') || name.includes('staffid')) {
                  textVal = staff.staff_id || '';
                }
                if (textVal && typeof field.setText === 'function') {
                  field.setText(textVal);
                }
              });
              form.flatten();
              pdfBuffer = Buffer.from(await tempDoc.save());
            }
          }
        } catch (pdfFormErr) {
          console.warn("Error filling fillable PDF form, falling back to overlay:", pdfFormErr);
        }
        
        if (!pdfBuffer) {
          try {
            let template = config?.document_templates?.joining_letter_template || defaultJoiningLetter;
            
            const placeholders = {
              "\\[First Name\\]": staff.f_name || "",
              "\\[Last Name\\]": staff.l_name || "",
              "\\[Job Title\\]": staff.position || "",
              "\\[Date of Joining\\]": staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN') : "",
              "\\[Basic Salary\\]": staff.salary ? staff.salary.toString() : "",
              "\\[Staff ID\\]": staff.staff_id || "",
            };
            for (const [key, value] of Object.entries(placeholders)) {
              const regex = new RegExp(key, 'g');
              template = template.replace(regex, value);
            }
            
            const fullHtml = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  html, body { background: transparent !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                  .ql-align-center { text-align: center; }
                  .ql-align-right { text-align: right; }
                  .ql-align-justify { text-align: justify; }
                  h1, h2, h3 { color: #222; }
                </style>
              </head>
              <body>
                ${template}
              </body>
              </html>
            `;
            
            const options = { 
              format: 'A4', 
              margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
              omitBackground: true
            };
            const file = { content: fullHtml };
            const htmlPdfBuffer = await html_to_pdf.generatePdf(file, options);
            
            const { PDFDocument } = require('pdf-lib');
            const templateDoc = await PDFDocument.load(fs.readFileSync(templatePath));
            const htmlDoc = await PDFDocument.load(htmlPdfBuffer);
            const finalDoc = await PDFDocument.create();
            
            const templatePages = templateDoc.getPages();
            const htmlPages = htmlDoc.getPages();
            const embeddedTemplatePages = await finalDoc.embedPages(templatePages);
            const embeddedHtmlPages = await finalDoc.embedPages(htmlPages);
            
            const maxPages = Math.max(htmlPages.length, templatePages.length);
            for (let i = 0; i < maxPages; i++) {
              let width = 595.276;
              let height = 841.89;
              
              if (htmlPages[i]) {
                const size = htmlPages[i].getSize();
                width = size.width;
                height = size.height;
              } else if (templatePages[i]) {
                const size = templatePages[i].getSize();
                width = size.width;
                height = size.height;
              }
              
              const newPage = finalDoc.addPage([width, height]);
              
              let templateIndex = i;
              if (templateIndex >= templatePages.length) {
                templateIndex = templatePages.length - 1;
              }
              if (templateIndex >= 0 && embeddedTemplatePages[templateIndex]) {
                newPage.drawPage(embeddedTemplatePages[templateIndex], { x: 0, y: 0, width, height });
              }
              if (embeddedHtmlPages[i]) {
                newPage.drawPage(embeddedHtmlPages[i], { x: 0, y: 0, width, height });
              }
            }
            pdfBuffer = Buffer.from(await finalDoc.save());
          } catch (overlayErr) {
            console.error("Error overlaying template PDF background:", overlayErr);
          }
        }
      }
    }

    if (!pdfBuffer) {
      // Legacy Fallback (HTML template only)
      let template = config?.document_templates?.joining_letter_template || defaultJoiningLetter;
      const placeholders = {
        "\\[First Name\\]": staff.f_name || "",
        "\\[Last Name\\]": staff.l_name || "",
        "\\[Job Title\\]": staff.position || "",
        "\\[Date of Joining\\]": staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-IN') : "",
        "\\[Basic Salary\\]": staff.salary ? staff.salary.toString() : "",
        "\\[Staff ID\\]": staff.staff_id || "",
      };

      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(key, 'g');
        template = template.replace(regex, value);
      }

      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .ql-align-center { text-align: center; }
            .ql-align-right { text-align: right; }
            .ql-align-justify { text-align: justify; }
            h1, h2, h3 { color: #222; }
          </style>
        </head>
        <body>
          ${template}
        </body>
        </html>
      `;

      const options = { format: 'A4', margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } };
      const file = { content: fullHtml };
      pdfBuffer = await html_to_pdf.generatePdf(file, options);
    }

    // 5. Send Email
    const subject = `Joining Letter - ${staff.f_name} ${staff.l_name}`;
    const textBody = `Dear ${staff.f_name},\n\nPlease find attached your joining letter.\n\nWelcome to the team!\n\nBest regards,\nManagement`;

    await sendEmail({
      to: staff.email,
      subject: subject,
      text: textBody,
      html: `<p>Dear ${staff.f_name},</p><p>Please find attached your joining letter.</p><p>Welcome to the team!</p><p>Best regards,<br>Management</p>`,
      attachments: [
        {
          filename: `Joining_Letter_${staff.f_name}_${staff.l_name}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    return res.status(200).json({ success: true, message: "Joining letter sent successfully" });
  } catch (error) {
    console.error("Error in sendJoiningLetter:", error);
    return res.status(500).json({ success: false, message: "Failed to send joining letter." });
  }
};

// ── Resignation Controllers ──────────────────────────────────────────────

const submitResignation = async (req, res) => {
  try {
    const userId = req.user._id; // Using authMiddleware
    const staffId = req.params.id; // Or we can derive from auth if staff is logged in, but let's assume staffId is passed
    const { reason } = req.body;

    const staff = await Staff.findOne({ _id: staffId, user_id: userId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    if (staff.resignation?.status === 'pending') {
      return res.status(400).json({ success: false, message: "A resignation request is already pending." });
    }

    // Fetch Notice Period from PayrollConfig
    const config = await PayrollConfig.findOne({ user_id: userId });
    const noticePeriodDays = config?.org_rules?.notice_period_days || 30;

    staff.resignation = {
      status: 'pending',
      reason: reason || "",
      submitted_on: new Date(),
      notice_period_days: noticePeriodDays,
      last_working_day: null,
      admin_remarks: ""
    };

    await staff.save();
    return res.status(200).json({ success: true, message: "Resignation submitted successfully", staff });
  } catch (error) {
    console.error("Error in submitResignation:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const processResignation = async (req, res) => {
  try {
    const userId = req.user._id; // Admin user ID
    const staffId = req.params.id;
    const { status, admin_remarks, custom_last_working_day } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status. Must be approved or rejected." });
    }

    const staff = await Staff.findOne({ _id: staffId, user_id: userId });
    if (!staff || !staff.resignation || staff.resignation.status !== 'pending') {
      return res.status(400).json({ success: false, message: "No pending resignation found for this staff." });
    }

    staff.resignation.status = status;
    staff.resignation.admin_remarks = admin_remarks || "";

    if (status === 'approved') {
      // Calculate last working day based on notice period, unless overridden
      if (custom_last_working_day) {
        staff.resignation.last_working_day = new Date(custom_last_working_day);
      } else {
        const submittedDate = staff.resignation.submitted_on || new Date();
        const noticeDays = staff.resignation.notice_period_days || 30;
        const lastDay = new Date(submittedDate);
        lastDay.setDate(lastDay.getDate() + noticeDays);
        staff.resignation.last_working_day = lastDay;
      }
    } else {
      staff.resignation.last_working_day = null;
    }

    await staff.save();
    return res.status(200).json({ success: true, message: `Resignation ${status} successfully`, staff });
  } catch (error) {
    console.error("Error in processResignation:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getPendingResignations = async (req, res) => {
  try {
    const userId = req.user._id;
    const staff = await Staff.find({ user_id: userId, "resignation.status": "pending" }).populate("department");
    return res.status(200).json({ success: true, data: staff });
  } catch (error) {
    console.error("Error in getPendingResignations:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /staff/toggle-leave/:id ──────────────────────────────────────────────
const toggleLeaveStatus = async (req, res) => {
    try {
        const staffId = req.params.id;
        const { is_leave_enabled } = req.body;

        const staff = await Staff.findByIdAndUpdate(
            staffId,
            { is_leave_enabled },
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }

        res.json({ success: true, data: staff, message: `Leave access ${is_leave_enabled ? 'enabled' : 'disabled'} successfully.` });
    } catch (error) {
        console.error("Error toggling leave status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── PUT /staff/toggle-specific-leave/:id ─────────────────────────────────────
const toggleSpecificLeave = async (req, res) => {
    try {
        const staffId = req.params.id;
        const { leave_type_id, is_active } = req.body;

        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }

        let config = staff.leave_policy_configuration || [];
        const index = config.findIndex(c => c.leave_type_id === leave_type_id);
        if (index >= 0) {
            config[index].is_active = is_active;
        } else {
            config.push({ leave_type_id, is_active });
        }

        staff.leave_policy_configuration = config;
        staff.markModified('leave_policy_configuration');
        await staff.save();

        res.json({ success: true, data: staff, message: `Leave type ${is_active ? 'enabled' : 'disabled'} successfully.` });
    } catch (error) {
        console.error("Error toggling specific leave:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
  getStaffPositions,
  getStaffData,
  getStaffDataById,
  addStaff,
  updateStaff,
  deleteStaff,
  getAllFaceEncodings,
  getNextStaffIdController,
  sendJoiningLetter,
  submitResignation,
  processResignation,
  getPendingResignations,
  toggleLeaveStatus,
  toggleSpecificLeave
};