const StaffAttendance = require("../models/staffAttendanceModel");
const Staff = require("../models/staffModel");

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

// ── GET /attendance/today ─────────────────────────────────────────────────────
// Returns all staff with today's attendance record merged in.
// Used by ManageAttendance.jsx
const getTodayAttendance = async (req, res) => {
    try {
        const userId = req.user;
        const today = getTodayIST();

        // Fetch all staff for this user
        const staffList = await Staff.find({ user_id: userId })
            .select("staff_id f_name l_name position photo")
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
        const userId = req.user;

        const staff = await Staff.findOne({ _id: staffId, user_id: userId })
            .select("staff_id f_name l_name position photo salary joining_date")
            .lean();

        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const attendance = await StaffAttendance.find({ staff_id: staffId })
            .sort({ date: -1 })
            .lean();

        res.json({
            success: true,
            data: {
                ...staff,
                attendance,
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
        const userId = req.user;

        // Verify staff belongs to this user
        const staff = await Staff.findOne({ _id: staffId, user_id: userId }).lean();
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found" });
        }

        const records = await StaffAttendance.find({ staff_id: staffId }).lean();

        const present = records.filter((r) => r.status === "present").length;
        const absent = records.filter((r) => r.status === "absent").length;
        const total = records.length;

        // Calculate average working hours
        let totalMinutes = 0;
        let validShifts = 0;

        records.forEach((r) => {
            if (r.in_time && r.out_time) {
                const parseTime = (timeStr) => {
                    const [time, period] = timeStr.split(" ");
                    let [hours, minutes] = time.split(":").map(Number);
                    if (period === "PM" && hours !== 12) hours += 12;
                    else if (period === "AM" && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                };

                let diff = parseTime(r.out_time) - parseTime(r.in_time);
                if (diff < 0) diff += 24 * 60; // overnight shift
                totalMinutes += diff;
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
    const { staff_id, date, in_time } = req.body;

    try {
        const staff = await Staff.findById(staff_id).lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Upsert: update if exists, create if not
        await StaffAttendance.findOneAndUpdate(
            { staff_id, date },
            {
                $set: {
                    in_time,
                    status: "present",
                    user_id: staff.user_id,
                },
                $setOnInsert: {
                    staff_id,
                    date,
                },
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Check-in successful" });
    } catch (error) {
        console.error("Error in Check-In:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── POST /attendance/check-out ────────────────────────────────────────────────
const checkOut = async (req, res) => {
    const { staff_id, date, out_time } = req.body;

    try {
        const staff = await Staff.findById(staff_id).lean();
        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        await StaffAttendance.findOneAndUpdate(
            { staff_id, date },
            {
                $set: {
                    out_time,
                    user_id: staff.user_id,
                },
                $setOnInsert: {
                    staff_id,
                    date,
                    status: "present",
                },
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: "Check-out successful" });
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

module.exports = {
    getTodayAttendance,
    getAttendanceByStaff,
    getAttendanceSummary,
    checkIn,
    checkOut,
    markAbsent,
    markLeave,
};