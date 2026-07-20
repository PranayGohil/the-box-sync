const StaffAttendance = require("../models/staffAttendanceModel");
const Staff = require("../models/staffModel");
const PayrollConfig = require("../models/PayrollConfig");
const User = require("../models/userModel");
const LeaveBalance = require("../models/leaveBalanceModel");
const LeaveRequest = require("../models/leaveRequestModel");
const Roster = require("../models/rosterModel");
const fs = require("fs");
const path = require("path");

// Helper: Compute minutes late (positive) given in_time string and org_rules/shift config
const computeLateMinutes = (inTimeStr, rules) => {
    if (!inTimeStr || !rules) return 0;
    const shiftStart = parseTimeToMinutes(rules.start_time || rules.shift_start_time || '09:00 AM');
    const threshold = Number(rules.late_threshold_minutes) || 0;
    const inMins = parseTimeToMinutes(inTimeStr);
    const lateBy = inMins - (shiftStart + threshold);
    return lateBy > 0 ? lateBy : 0;
};

// Helper: Fetch shift configuration (Shift model or roster)
const getShiftConfig = async (staffId, date) => {
    try {
        const roster = await Roster.findOne({ staff_id: staffId, date: date }).populate('shift_id').lean();
        if (roster && roster.shift_id) return roster.shift_id;
        const staff = await Staff.findById(staffId).populate('shift_id').lean();
        return staff ? staff.shift_id : null;
    } catch (error) {
        console.error("Error fetching shift config:", error);
        return null;
    }
};

// Time utility: Parses a string like "09:00 AM" or "01:00 PM" into total minutes from midnight
const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(" ");
    if (!time || !period) return 0;
    let [hours, minutes] = time.split(":").map(Number);
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

// Calculates the working minutes for a day, including paid lunch break overlap duration
const calculateRecordWorkingMinutes = (record, config) => {
    const lunchStartStr = (config && config.org_rules && config.org_rules.lunch_start_time) || "01:00 PM";
    const lunchEndStr = (config && config.org_rules && config.org_rules.lunch_end_time) || "02:00 PM";
    
    const lunchStart = parseTimeToMinutes(lunchStartStr);
    const lunchEnd = parseTimeToMinutes(lunchEndStr);
    
    let totalMins = 0;
    
    if (record.sessions && record.sessions.length > 0) {
        // 1. Sum up durations of each session
        record.sessions.forEach(session => {
            if (session.in_time && session.out_time) {
                let diff = parseTimeToMinutes(session.out_time) - parseTimeToMinutes(session.in_time);
                if (diff < 0) diff += 24 * 60; // overnight shift fallback
                totalMins += diff;
            }
        });
        
        // 2. Add lunch break overlaps for gaps between sessions
        for (let i = 0; i < record.sessions.length - 1; i++) {
            const currentOut = record.sessions[i].out_time;
            const nextIn = record.sessions[i+1].in_time;
            
            if (currentOut && nextIn) {
                let gapStart = parseTimeToMinutes(currentOut);
                let gapEnd = parseTimeToMinutes(nextIn);
                
                if (gapEnd < gapStart) gapEnd += 24 * 60; // overnight fallback
                
                // Calculate overlap with lunch window
                const overlapStart = Math.max(gapStart, lunchStart);
                const overlapEnd = Math.min(gapEnd, lunchEnd);
                const overlap = Math.max(0, overlapEnd - overlapStart);
                totalMins += overlap;
            }
        }
    } else if (record.in_time && record.out_time) {
        // Fallback to legacy in_time / out_time
        let diff = parseTimeToMinutes(record.out_time) - parseTimeToMinutes(record.in_time);
        if (diff < 0) diff += 24 * 60;
        totalMins = diff;
    }
    
    return totalMins;
};

// Helper: Compute overtime hours (positive) given the full record and config/shift
const computeOvertimeHours = (record, config, shift) => {
    if (!record || !config || !config.org_rules) return 0;
    
    // Calculate total actual minutes worked
    const actualMins = calculateRecordWorkingMinutes(record, config);
    
    // Calculate required shift minutes
    const rules = shift || config.org_rules;
    const shiftStart = parseTimeToMinutes(rules.start_time || rules.shift_start_time || '09:00 AM');
    const shiftEnd = parseTimeToMinutes(rules.end_time || rules.shift_end_time || '06:00 PM');
    let requiredMins = shiftEnd - shiftStart;
    if (requiredMins < 0) requiredMins += 24 * 60; // overnight shift
    
    const overtimeMins = actualMins - requiredMins;
    return overtimeMins > 0 ? Math.round((overtimeMins / 60) * 100) / 100 : 0;
};

// ── Helper: get today's date in IST (YYYY-MM-DD) ─────────────────────────────
const getTodayIST = () => {
    const options = {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    };
    const parts = new Intl.DateTimeFormat("en-CA", options).format(new Date());
    // en-CA gives YYYY-MM-DD format directly
    return parts;
};

// Helper: Get assigned shift from Roster DB or Staff default
const getAssignedShift = async (staff, dateStr) => {
    if (!dateStr || !staff) return staff.shift_id;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        try {
            const roster = await Roster.findOne({ staff_id: staff._id, date: formattedDate }).populate('shift_id').lean();
            if (roster) {
                return roster.is_off ? { is_off: true } : roster.shift_id;
            }
        } catch (e) {
            console.error("Error fetching roster shift:", e);
        }
    }
    return staff.shift_id;
};

// ── Helper: Check if a date is a week off ──────────────────────────────────────
const isWeekOff = (dateObj, policyList) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = daysOfWeek[dateObj.getDay()];
    const weekOfMonth = Math.floor((dateObj.getDate() - 1) / 7) + 1;

    for (let policy of policyList) {
        if (policy.day === dayName) {
            if (policy.type === 'all_weeks') return true;
            if (policy.type === 'specific_weeks' && policy.weeks && policy.weeks.includes(weekOfMonth)) return true;
        }
    }
    return false;
};

const generateWeekOffs = (staff, globalOffs, existingRecords) => {
    const policyList = staff.weekly_off_policy === 'custom' ? (staff.custom_weekly_offs || []) : globalOffs;
    if (!policyList || policyList.length === 0) return [];

    const existingDates = new Set(existingRecords.map(r => r.date));
    const weekOffRecords = [];

    // Generate for current year and previous year just in case
    const currentYear = new Date().getFullYear();
    const startDate = new Date(`${currentYear - 1}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!existingDates.has(dateStr)) {
            if (isWeekOff(d, policyList)) {
                weekOffRecords.push({
                    _id: 'wo_' + dateStr,
                    date: dateStr,
                    status: 'week_off',
                    staff_id: staff._id
                });
            }
        }
    }
    return weekOffRecords;
};

// ── GET /attendance/today ─────────────────────────────────────────────────────
// Returns all staff with today's attendance record merged in.
// Used by ManageAttendance.jsx
const getTodayAttendance = async (req, res) => {
    try {
        const userId = req.user;
        const today = req.query.date || getTodayIST();

        // Fetch all staff for this user
        const staffList = await Staff.find({ user_id: userId })
            .select("staff_id f_name l_name position photo weekly_off_policy custom_weekly_offs")
            .sort({ f_name: 1 })
            .lean();

        if (staffList.length === 0) {
            return res.json({ success: true, data: [] });
        }

        const staffIds = staffList.map((s) => s._id);

        // Fetch only today's attendance records for all staff in one query
        const todayRecords = await StaffAttendance.find({
            staff_id: { $in: staffIds },
            date: today,
        }).lean();

        // Build a map: staffId (string) → attendance record
        const attendanceMap = {};
        todayRecords.forEach((record) => {
            attendanceMap[record.staff_id.toString()] = record;
        });

        // Merge into staff list
        const result = staffList.map((staff) => ({
            ...staff,
            todayAttendance: attendanceMap[staff._id.toString()] || null,
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /attendance/get/:staffId ──────────────────────────────────────────────
// Returns staff info + full attendance history for ViewAttendance.jsx
const getAttendanceByStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        
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
            return res.status(403).json({ success: false, message: "Forbidden: You can only access your own records." });
        }

        const staff = await Staff.findOne({ _id: staffId, user_id: adminUserId })
            .select("staff_id f_name l_name position photo salary joining_date weekly_off_policy custom_weekly_offs")
            .lean();

        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const attendance = await StaffAttendance.find({ staff_id: staffId })
            .sort({ date: -1 })
            .lean();

        const payrollConfig = await PayrollConfig.getEffectiveConfig(adminUserId, staff.branch_id);
        const globalOffs = payrollConfig?.global_weekly_offs || [];
        
        const weekOffs = generateWeekOffs(staff, globalOffs, attendance);
        const mergedAttendance = [...attendance, ...weekOffs].sort((a, b) => b.date.localeCompare(a.date));

        res.json({
            success: true,
            data: {
                ...staff,
                attendance: mergedAttendance,
            },
        });
    } catch (error) {
        console.error("Error fetching staff attendance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /attendance/summary/:staffId ─────────────────────────────────────────
// Returns computed stats for a staff member (used by ViewAttendance stats cards)
const getAttendanceSummary = async (req, res) => {
    try {
        const { staffId } = req.params;
        
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
            return res.status(403).json({ success: false, message: "Forbidden: You can only access your own records." });
        }

        // Verify staff belongs to this user
        const staff = await Staff.findOne({ _id: staffId, user_id: adminUserId }).lean();
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const records = await StaffAttendance.find({ staff_id: staffId }).lean();
        const config = await PayrollConfig.getEffectiveConfig(adminUserId, staff.branch_id);

        const present = records.filter((r) => r.status === "present").length;
        const absent = records.filter((r) => r.status === "absent").length;
        const total = records.length;

        // Calculate average working hours
        let totalMinutes = 0;
        let validShifts = 0;

        records.forEach((r) => {
            const hasPunches = (r.sessions && r.sessions.length > 0) || (r.in_time && r.out_time);
            if (hasPunches) {
                let mins = calculateRecordWorkingMinutes(r, config);
                totalMinutes += mins;
                validShifts++;
            }
        });

        const avgHours = validShifts > 0
            ? (totalMinutes / validShifts / 60).toFixed(1)
            : 0;

        res.json({
            success: true,
            data: {
                totalDays: total,
                totalPresent: present,
                totalAbsent: absent,
                attendanceRate: total > 0 ? ((present / total) * 100).toFixed(1) : 0,
                avgHoursWorked: avgHours,
            },
        });
    } catch (error) {
        console.error("Error fetching attendance summary:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/check-in ─────────────────────────────────────────────────
const checkIn = async (req, res) => {
    const { staff_id, date, in_time, is_wfh } = req.body;

    if (req.user && typeof req.user === "object" && req.user.Role === "Staff" && req.user.staff_id !== staff_id) {
        return res.status(403).json({ success: false, message: "Forbidden: You can only check-in for yourself." });
    }

    try {
        const staff = await Staff.findById(staff_id).populate('shift_id').lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Find existing attendance
        let record = await StaffAttendance.findOne({ staff_id, date });

        // Work From Home policy verification
        if (is_wfh) {
            const isPermanentWFH = staff.attendance_method === 'wfh';
            if (!isPermanentWFH) {
                const checkInDate = new Date(date + "T00:00:00.000Z");
                
                const approvedWfhRequest = await LeaveRequest.findOne({
                    staff_id,
                    status: "approved",
                    leave_type_id: { $in: ["wfh", "work_from_home"] },
                    from_date: { $lte: checkInDate },
                    to_date: { $gte: checkInDate }
                });

                if (!approvedWfhRequest) {
                    return res.status(403).json({
                        success: false,
                        message: "Access Denied: You do not have an approved Work From Home request for today's date. Please apply in the Leave section first."
                    });
                }
            }
        }

        if (!record) {
            // Create a new record
            record = new StaffAttendance({
                staff_id,
                date,
                in_time,
                out_time: null,
                status: "present",
                user_id: staff.user_id,
                sessions: [{ in_time, out_time: null }]
            });
        } else {
            // Handle existing record
            record.status = "present";
            record.user_id = staff.user_id;

            // Make sure sessions array is initialized
            if (!record.sessions) record.sessions = [];

            // If sessions array is empty but in_time exists, migrate/populate it
            if (record.sessions.length === 0 && record.in_time) {
                record.sessions.push({ in_time: record.in_time, out_time: record.out_time });
            }

            // Check if they are currently checked in (last session out_time is null)
            const lastSession = record.sessions[record.sessions.length - 1];
            if (lastSession && lastSession.out_time === null) {
                // Already checked in, just update/ensure times
                record.in_time = record.in_time || in_time;
                lastSession.in_time = lastSession.in_time || in_time;
            } else {
                // Not checked in, start a new session
                record.in_time = record.in_time || in_time; // Keep first check-in as daily in_time
                record.out_time = null; // Currently checked in, so daily out_time is reset/null
                record.sessions.push({ in_time, out_time: null });
            }
        }
        
        if (!record.wfh_tracking) record.wfh_tracking = {};
        record.wfh_tracking.is_wfh = !!is_wfh;

        try {
            const config = await PayrollConfig.getEffectiveConfig(staff.user_id, staff.branch_id);
            if (config && config.org_rules && record.in_time) {
                // Only set late on the first check-in of the day (i.e. the daily in_time)
                const isFirstCheckIn = (record.sessions && record.sessions.length <= 1);
                if (isFirstCheckIn) {
                    const assignedShift = await getAssignedShift(staff, date);
                    const rulesToUse = (assignedShift && assignedShift.is_off) ? null : (assignedShift || config.org_rules);
                    record.late_by_minutes = computeLateMinutes(record.in_time, rulesToUse);
                }
            }
        } catch (configErr) {
            console.warn("Could not load PayrollConfig for late check:", configErr.message);
        }

        await record.save();
        res.status(200).json({ success: true, message: "Check-in successful", data: record });
    } catch (error) {
        console.error("Error in Check-In:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/check-out ────────────────────────────────────────────────
const checkOut = async (req, res) => {
    const { staff_id, date, out_time } = req.body;

    if (req.user && typeof req.user === "object" && req.user.Role === "Staff" && req.user.staff_id !== staff_id) {
        return res.status(403).json({ success: false, message: "Forbidden: You can only check-out for yourself." });
    }

    try {
        const staff = await Staff.findById(staff_id).populate('shift_id').lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        let record = await StaffAttendance.findOne({ staff_id, date });

        if (!record) {
            // If checking out without check-in (should be rare, but handle it)
            record = new StaffAttendance({
                staff_id,
                date,
                in_time: out_time,
                out_time,
                status: "present",
                user_id: staff.user_id,
                sessions: [{ in_time: out_time, out_time }]
            });
        } else {
            record.user_id = staff.user_id;
            record.status = "present";

            if (!record.sessions) record.sessions = [];

            // Migrate if sessions empty but in_time exists
            if (record.sessions.length === 0 && record.in_time) {
                record.sessions.push({ in_time: record.in_time, out_time: record.out_time });
            }

            if (record.sessions.length === 0) {
                // If somehow sessions is still empty, add a session
                record.sessions.push({ in_time: record.in_time || out_time, out_time });
            } else {
                // Update the last session's checkout time
                const lastSession = record.sessions[record.sessions.length - 1];
                lastSession.out_time = out_time;
            }

            // Always update top-level out_time to the latest checkout
            record.out_time = out_time;
        }

        try {
            const config = await PayrollConfig.getEffectiveConfig(staff.user_id, staff.branch_id);
            if (config && config.org_rules && record.out_time) {
                const assignedShift = await getAssignedShift(staff, date);
                const shiftToUse = (assignedShift && assignedShift.is_off) ? null : assignedShift;
                record.overtime_hours = computeOvertimeHours(record, config, shiftToUse);
            }
        } catch (configErr) {
            console.warn("Could not load PayrollConfig for overtime check:", configErr.message);
        }

        await record.save();
        res.status(200).json({ success: true, message: "Check-out successful", data: record });
    } catch (error) {
        console.error("Error in Check-Out:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/mark-absent ──────────────────────────────────────────────
const markAbsent = async (req, res) => {
    const { staff_id, date } = req.body;

    try {
        const staff = await Staff.findById(staff_id).lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        await StaffAttendance.findOneAndUpdate(
            { staff_id, date },
            {
                $set: {
                    status: "absent",
                    in_time: null,
                    out_time: null,
                    user_id: staff.user_id,
                },
                $setOnInsert: {
                    staff_id,
                    date,
                },
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Marked absent successfully" });
    } catch (error) {
        console.error("Error in Mark Absent:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/mark-leave ──────────────────────────────────────────────
const markLeave = async (req, res) => {
    const { staff_id, date, leave_type_id, is_half_day } = req.body;

    try {
        const staff = await Staff.findById(staff_id).lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        await StaffAttendance.findOneAndUpdate(
            { staff_id, date },
            {
                $set: {
                    status: is_half_day ? "half_day" : "leave",
                    leave_type_id: leave_type_id || null,
                    in_time: null,
                    out_time: null,
                    user_id: staff.user_id,
                },
                $setOnInsert: {
                    staff_id,
                    date,
                },
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Marked on leave successfully" });
    } catch (error) {
        console.error("Error in Mark Leave:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/update ───────────────────────────────────────────────────
const updateAttendance = async (req, res) => {
    const { staff_id, date, status, in_time, out_time, leave_type_id, manual_entry_reason } = req.body;

    if (!staff_id || !date || !status) {
        return res.status(400).json({ success: false, message: "Staff ID, date, and status are required." });
    }

    try {
        const staff = await Staff.findById(staff_id).lean();
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }

        const adminUserId = req.user && typeof req.user === "object" ? req.user._id : req.user;

        // Build update object
        const updateFields = {
            status,
            user_id: staff.user_id,
            is_manual_entry: true,
            manual_entry_reason: manual_entry_reason || "Admin manual edit",
        };

        if (status === "present" || status === "half_day") {
            updateFields.in_time = in_time || null;
            updateFields.out_time = out_time || null;
            if (in_time) {
                updateFields.sessions = [{ in_time, out_time: out_time || null }];
            } else {
                updateFields.sessions = [];
            }
        } else {
            updateFields.in_time = null;
            updateFields.out_time = null;
            updateFields.sessions = [];
        }

        if (status === "leave" || status === "half_day") {
            updateFields.leave_type_id = leave_type_id || null;
        } else {
            updateFields.leave_type_id = null;
        }

        const updatedRecord = await StaffAttendance.findOneAndUpdate(
            { staff_id, date },
            { $set: updateFields },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Attendance updated successfully", data: updatedRecord });
    } catch (error) {
        console.error("Error in Update Attendance:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/wfh-upload ───────────────────────────────────────────────
const uploadWfhCapture = async (req, res) => {
    const { staff_id, date, type, image_base64 } = req.body;

    if (!staff_id || !date || !type || !image_base64) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        const record = await StaffAttendance.findOne({ staff_id, date });
        if (!record || !record.wfh_tracking || !record.wfh_tracking.is_wfh) {
            return res.status(400).json({ success: false, message: "Not clocked in as WFH today" });
        }

        // Decode base64 and save to disk
        const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
        const filename = `${type}-${staff_id}-${Date.now()}.webp`;
        const dirPath = path.join(__dirname, "../uploads/wfh");
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        const filePath = path.join(dirPath, filename);
        fs.writeFileSync(filePath, base64Data, "base64");
        
        const fileUrl = `/uploads/wfh/${filename}`;

        if (type === "screenshot") {
            record.wfh_tracking.screenshots.push({ url: fileUrl, timestamp: new Date() });
        } else if (type === "webcam") {
            record.wfh_tracking.webcam_snapshots.push({ url: fileUrl, timestamp: new Date() });
        }

        await record.save();
        res.status(200).json({ success: true, message: "WFH capture uploaded" });
    } catch (error) {
        console.error("Error uploading WFH capture:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/wfh-idle ─────────────────────────────────────────────────
const kioskScan = async (req, res) => {
    const { company_id, scanned_id, date, time, device_mode } = req.body;

    if (!company_id || !scanned_id) {
        return res.status(400).json({ success: false, message: "Missing company_id or scanned_id." });
    }

    try {
        const staff = await Staff.findOne({ user_id: company_id, staff_id: scanned_id }).populate('shift_id').lean();
        if (!staff) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        let record = await StaffAttendance.findOne({ staff_id: staff._id, date });
        let action = "check-in";

        // Determine if they are currently checked in (last session's out_time is null)
        let isCurrentlyCheckedIn = false;
        if (record && record.sessions && record.sessions.length > 0) {
            const lastSession = record.sessions[record.sessions.length - 1];
            if (lastSession.out_time === null) {
                isCurrentlyCheckedIn = true;
            }
        } else if (record && record.in_time && !record.out_time) {
            isCurrentlyCheckedIn = true;
        }

        if (device_mode === "in") {
            if (isCurrentlyCheckedIn) {
                return res.status(400).json({ success: false, message: "Already Checked-In!" });
            }
            action = "check-in";
        } else if (device_mode === "out") {
            if (!isCurrentlyCheckedIn) {
                const hasSessionToday = record && (record.in_time || (record.sessions && record.sessions.length > 0));
                if (!hasSessionToday) {
                    return res.status(400).json({ success: false, message: "Please Check-In first!" });
                } else {
                    return res.status(400).json({ success: false, message: "Already Checked-Out!" });
                }
            }
            action = "check-out";
        } else {
            // Auto-toggle mode (default fallback)
            action = isCurrentlyCheckedIn ? "check-out" : "check-in";
        }

        // Mock req so we can reuse checkIn / checkOut logic
        req.user = { _id: company_id, Role: "Admin" };
        
        if (action === "check-in") {
            req.body = { staff_id: staff._id.toString(), date, in_time: time, is_wfh: false };
            return checkIn(req, res);
        } else {
            req.body = { staff_id: staff._id.toString(), date, out_time: time };
            return checkOut(req, res);
        }

    } catch (error) {
        console.error("Error in kioskScan:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const logWfhIdle = async (req, res) => {
    const { staff_id, date, idle_minutes } = req.body;

    try {
        const record = await StaffAttendance.findOne({ staff_id, date });
        if (!record || !record.wfh_tracking || !record.wfh_tracking.is_wfh) {
            return res.status(400).json({ success: false, message: "Not clocked in as WFH today" });
        }

        record.wfh_tracking.total_idle_minutes += idle_minutes || 1;
        await record.save();
        res.status(200).json({ success: true, message: "Idle time logged" });
    } catch (error) {
        console.error("Error logging idle time:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /attendance/kiosk-faces/:company_id (No Auth Required) ───────────────────────────
const getKioskFaces = async (req, res) => {
    const { company_id } = req.params;
    if (!company_id) {
        return res.status(400).json({ success: false, message: "Missing company_id" });
    }
    
    try {
        const company = await User.findById(company_id).select("name logo").lean();
        const config = await PayrollConfig.findOne({ user_id: company_id }).lean();
        
        const staffWithFaces = await Staff.find({
            user_id: company_id,
            face_encoding: { $exists: true, $ne: null, $not: { $size: 0 } },
        })
        .select("_id staff_id f_name l_name face_encoding photo shift_id")
        .populate("shift_id")
        .lean();
        
        // Get today's date in IST
        const options = { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" };
        const today = new Intl.DateTimeFormat("en-CA", options).format(new Date());
        
        const todayRecords = await StaffAttendance.find({
            user_id: company_id,
            date: today
        }).lean();
        
        const attendanceMap = {};
        todayRecords.forEach(r => {
            attendanceMap[r.staff_id.toString()] = r;
        });

        // Query today's roster for the company's staff
        const parts = today.split('-');
        const formattedToday = `${parts[2]}/${parts[1]}/${parts[0]}`;
        const todayRosters = await Roster.find({ 
            staff_id: { $in: staffWithFaces.map(s => s._id) },
            date: formattedToday
        }).populate("shift_id").lean();

        const rosterMap = {};
        todayRosters.forEach(r => {
            rosterMap[r.staff_id.toString()] = r;
        });
        
        const data = staffWithFaces.map(staff => {
            let assignedShift = staff.shift_id;
            const staffRoster = rosterMap[staff._id.toString()];
            if (staffRoster) {
                assignedShift = staffRoster.is_off ? { is_off: true } : staffRoster.shift_id;
            }
            return {
                ...staff,
                shift_id: assignedShift,
                todayAttendance: attendanceMap[staff._id.toString()] || null
            };
        });
        
        res.status(200).json({ 
            success: true, 
            data,
            company: company ? { name: company.name, logo: company.logo } : null,
            config: config ? { org_rules: config.org_rules } : null
        });
    } catch (error) {
        console.error("Error fetching kiosk faces:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    getTodayAttendance,
    getAttendanceByStaff,
    getAttendanceSummary,
    checkIn,
    checkOut,
    markAbsent,
    markLeave,
    updateAttendance,
    uploadWfhCapture,
    logWfhIdle,
    kioskScan,
    getKioskFaces
};