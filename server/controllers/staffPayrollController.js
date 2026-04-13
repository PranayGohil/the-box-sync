const StaffPayroll = require("../models/staffPayrollModel");
const Staff = require("../models/staffModel");
const StaffAttendance = require("../models/staffAttendanceModel");

// ── Helper: calculate net salary ──────────────────────────────────────────────
const calculateSalary = ({
    base_salary,
    working_days_in_month,
    present_days,
    overtime_hours,
    overtime_rate,
    bonus,
    deductions,
}) => {
    const safeDays = working_days_in_month > 0 ? working_days_in_month : 1;
    const earned_salary = parseFloat(
        ((base_salary / safeDays) * present_days).toFixed(2)
    );
    const overtime_pay = parseFloat(
        (overtime_hours * overtime_rate).toFixed(2)
    );
    const net_salary = parseFloat(
        (earned_salary + overtime_pay + (bonus || 0) - (deductions || 0)).toFixed(2)
    );
    return { earned_salary, overtime_pay, net_salary };
};

// ── Helper: get attendance counts for a staff in a month/year ─────────────────
const getAttendanceCounts = async (staff_id, month, year) => {
    // Build date range: YYYY-MM-01 to YYYY-MM-DD (last day)
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // day 0 of next month = last day of this month
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const records = await StaffAttendance.find({
        staff_id,
        date: { $gte: startDate, $lte: endDate },
    }).lean();

    const present_days = records.filter((r) => r.status === "present").length;
    const absent_days = records.filter((r) => r.status === "absent").length;

    return { present_days, absent_days, total_records: records.length };
};

// ── POST /payroll/generate ────────────────────────────────────────────────────
// Body: { month, year, working_days_in_month, staff_id? }
// If staff_id is provided → generate for that one staff only
// If staff_id is omitted  → generate for ALL staff of this user
const generatePayroll = async (req, res) => {
    try {
        const user_id = req.user;
        const {
            month,
            year,
            working_days_in_month,
            staff_id, // optional — if provided, generate for single staff
            overtime_hours_map = {}, // { [staff_id]: hours } for bulk, or { hours } for single
            bonus_map = {},          // { [staff_id]: amount }
            deductions_map = {},     // { [staff_id]: amount }
            deduction_reason_map = {},
            notes_map = {},
        } = req.body;

        if (!month || !year || !working_days_in_month) {
            return res.status(400).json({
                success: false,
                message: "month, year and working_days_in_month are required",
            });
        }

        // Determine which staff to process
        let staffList;
        if (staff_id) {
            const staff = await Staff.findOne({ _id: staff_id, user_id }).lean();
            if (!staff) {
                return res.status(404).json({ success: false, message: "Staff not found" });
            }
            staffList = [staff];
        } else {
            staffList = await Staff.find({ user_id })
                .select("_id staff_id f_name l_name salary overtime_rate position")
                .lean();
        }

        if (staffList.length === 0) {
            return res.status(404).json({ success: false, message: "No staff found" });
        }

        const results = {
            created: [],
            updated: [],
            errors: [],
        };

        for (const staff of staffList) {
            try {
                const sid = staff._id.toString();

                // Get attendance for this month
                const { present_days, absent_days } = await getAttendanceCounts(
                    staff._id,
                    month,
                    year
                );

                // Resolve per-staff values (single staff uses direct values, bulk uses maps)
                const overtime_hours = staff_id
                    ? parseFloat(req.body.overtime_hours || 0)
                    : parseFloat(overtime_hours_map[sid] || 0);

                const bonus = staff_id
                    ? parseFloat(req.body.bonus || 0)
                    : parseFloat(bonus_map[sid] || 0);

                const deductions = staff_id
                    ? parseFloat(req.body.deductions || 0)
                    : parseFloat(deductions_map[sid] || 0);

                const deduction_reason = staff_id
                    ? req.body.deduction_reason || ""
                    : deduction_reason_map[sid] || "";

                const notes = staff_id
                    ? req.body.notes || ""
                    : notes_map[sid] || "";

                const overtime_rate = staff.overtime_rate || 0;

                const { earned_salary, overtime_pay, net_salary } = calculateSalary({
                    base_salary: staff.salary || 0,
                    working_days_in_month,
                    present_days,
                    overtime_hours,
                    overtime_rate,
                    bonus,
                    deductions,
                });

                const payrollData = {
                    staff_id: staff._id,
                    user_id,
                    month,
                    year,
                    base_salary: staff.salary || 0,
                    working_days_in_month,
                    present_days,
                    absent_days,
                    overtime_hours,
                    overtime_rate,
                    overtime_pay,
                    bonus,
                    deductions,
                    deduction_reason,
                    earned_salary,
                    net_salary,
                    notes,
                    // Reset status to unpaid when regenerating
                    status: "unpaid",
                    paid_date: null,
                };

                // Upsert: update existing or create new
                const existing = await StaffPayroll.findOne({
                    staff_id: staff._id,
                    month,
                    year,
                });

                if (existing) {
                    // Don't override paid status if already paid
                    if (existing.status === "paid") {
                        delete payrollData.status;
                        delete payrollData.paid_date;
                    }
                    await StaffPayroll.findByIdAndUpdate(existing._id, { $set: payrollData });
                    results.updated.push({
                        staff_id: sid,
                        name: `${staff.f_name} ${staff.l_name}`,
                        net_salary,
                    });
                } else {
                    await StaffPayroll.create(payrollData);
                    results.created.push({
                        staff_id: sid,
                        name: `${staff.f_name} ${staff.l_name}`,
                        net_salary,
                    });
                }
            } catch (err) {
                console.error(`Error generating payroll for staff ${staff._id}:`, err);
                results.errors.push({
                    staff_id: staff._id.toString(),
                    name: `${staff.f_name} ${staff.l_name}`,
                    error: err.message,
                });
            }
        }

        res.json({
            success: true,
            message: `Payroll generated: ${results.created.length} created, ${results.updated.length} updated`,
            data: results,
        });
    } catch (error) {
        console.error("Error generating payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /payroll/summary/:month/:year ─────────────────────────────────────────
// Monthly payroll summary for all staff — used by ManagePayroll page
const getMonthlyPayrollSummary = async (req, res) => {
    try {
        const user_id = req.user;
        const { month, year } = req.params;

        // Get all payroll records for this month
        const payrollRecords = await StaffPayroll.find({
            user_id,
            month: parseInt(month),
            year: parseInt(year),
        })
            .populate("staff_id", "staff_id f_name l_name position photo overtime_rate salary")
            .lean();

        // Also get all staff to show who has NO payroll yet
        const allStaff = await Staff.find({ user_id })
            .select("_id staff_id f_name l_name position photo salary overtime_rate")
            .lean();

        // Build payroll map by staff_id
        const payrollMap = {};
        payrollRecords.forEach((p) => {
            if (p.staff_id) {
                payrollMap[p.staff_id._id.toString()] = p;
            }
        });

        // Merge: every staff gets their payroll record or null
        const summary = allStaff.map((staff) => ({
            staff: staff,
            payroll: payrollMap[staff._id.toString()] || null,
        }));

        // Aggregate totals
        const totals = {
            total_net_salary: payrollRecords.reduce((sum, p) => sum + (p.net_salary || 0), 0),
            total_paid: payrollRecords.filter((p) => p.status === "paid").reduce((sum, p) => sum + (p.net_salary || 0), 0),
            total_unpaid: payrollRecords.filter((p) => p.status === "unpaid").reduce((sum, p) => sum + (p.net_salary || 0), 0),
            count_paid: payrollRecords.filter((p) => p.status === "paid").length,
            count_unpaid: payrollRecords.filter((p) => p.status === "unpaid").length,
            count_not_generated: allStaff.length - payrollRecords.length,
        };

        res.json({ success: true, data: summary, totals });
    } catch (error) {
        console.error("Error fetching payroll summary:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /payroll/get/:staffId ─────────────────────────────────────────────────
// Full payroll history for one staff — used by ViewStaffPayroll page
const getPayrollByStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const user_id = req.user;

        const staff = await Staff.findOne({ _id: staffId, user_id })
            .select("staff_id f_name l_name position photo salary overtime_rate joining_date")
            .lean();

        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff not found" });
        }

        const payrollHistory = await StaffPayroll.find({ staff_id: staffId })
            .sort({ year: -1, month: -1 })
            .lean();

        // Aggregate career stats
        const totalEarned = payrollHistory.reduce((sum, p) => sum + (p.net_salary || 0), 0);
        const totalPaid = payrollHistory
            .filter((p) => p.status === "paid")
            .reduce((sum, p) => sum + (p.net_salary || 0), 0);
        const totalUnpaid = payrollHistory
            .filter((p) => p.status === "unpaid")
            .reduce((sum, p) => sum + (p.net_salary || 0), 0);

        res.json({
            success: true,
            data: {
                staff,
                payroll: payrollHistory,
                career_stats: {
                    total_months: payrollHistory.length,
                    total_earned: parseFloat(totalEarned.toFixed(2)),
                    total_paid: parseFloat(totalPaid.toFixed(2)),
                    total_unpaid: parseFloat(totalUnpaid.toFixed(2)),
                },
            },
        });
    } catch (error) {
        console.error("Error fetching staff payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── PUT /payroll/update/:id ───────────────────────────────────────────────────
// Manually edit bonus, deductions, overtime, notes for a payroll record
const updatePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;

        const payroll = await StaffPayroll.findOne({ _id: id, user_id });
        if (!payroll) {
            return res.status(404).json({ success: false, message: "Payroll record not found" });
        }

        const {
            overtime_hours,
            overtime_rate,
            bonus,
            deductions,
            deduction_reason,
            notes,
            working_days_in_month,
        } = req.body;

        // Apply updates
        if (overtime_hours !== undefined) payroll.overtime_hours = parseFloat(overtime_hours);
        if (overtime_rate !== undefined) payroll.overtime_rate = parseFloat(overtime_rate);
        if (bonus !== undefined) payroll.bonus = parseFloat(bonus);
        if (deductions !== undefined) payroll.deductions = parseFloat(deductions);
        if (deduction_reason !== undefined) payroll.deduction_reason = deduction_reason;
        if (notes !== undefined) payroll.notes = notes;
        if (working_days_in_month !== undefined) payroll.working_days_in_month = parseInt(working_days_in_month);

        // Recalculate
        const { earned_salary, overtime_pay, net_salary } = calculateSalary({
            base_salary: payroll.base_salary,
            working_days_in_month: payroll.working_days_in_month,
            present_days: payroll.present_days,
            overtime_hours: payroll.overtime_hours,
            overtime_rate: payroll.overtime_rate,
            bonus: payroll.bonus,
            deductions: payroll.deductions,
        });

        payroll.earned_salary = earned_salary;
        payroll.overtime_pay = overtime_pay;
        payroll.net_salary = net_salary;

        await payroll.save();

        res.json({ success: true, message: "Payroll updated successfully", data: payroll });
    } catch (error) {
        console.error("Error updating payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── PUT /payroll/mark-paid ────────────────────────────────────────────────────
// Body: { ids: [...] } — mark one or multiple payroll records as paid
const markAsPaid = async (req, res) => {
    try {
        const user_id = req.user;
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "ids array is required" });
        }

        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
        }).format(new Date());

        const result = await StaffPayroll.updateMany(
            { _id: { $in: ids }, user_id },
            { $set: { status: "paid", paid_date: today } }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} payroll record(s) marked as paid`,
        });
    } catch (error) {
        console.error("Error marking payroll as paid:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── PUT /payroll/mark-unpaid ──────────────────────────────────────────────────
const markAsUnpaid = async (req, res) => {
    try {
        const user_id = req.user;
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "ids array is required" });
        }

        const result = await StaffPayroll.updateMany(
            { _id: { $in: ids }, user_id },
            { $set: { status: "unpaid", paid_date: null } }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} payroll record(s) marked as unpaid`,
        });
    } catch (error) {
        console.error("Error marking payroll as unpaid:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── DELETE /payroll/delete/:id ────────────────────────────────────────────────
const deletePayroll = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user;

        const payroll = await StaffPayroll.findOneAndDelete({ _id: id, user_id });
        if (!payroll) {
            return res.status(404).json({ success: false, message: "Payroll record not found" });
        }

        res.json({ success: true, message: "Payroll record deleted successfully" });
    } catch (error) {
        console.error("Error deleting payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ── GET /payroll/preview ──────────────────────────────────────────────────────
// Preview calculated payroll WITHOUT saving — used before confirm on GeneratePayroll page
// Query: ?month=&year=&working_days_in_month=&staff_id= (staff_id optional)
const previewPayroll = async (req, res) => {
    try {
        const user_id = req.user;
        const { month, year, working_days_in_month, staff_id } = req.query;

        if (!month || !year || !working_days_in_month) {
            return res.status(400).json({
                success: false,
                message: "month, year and working_days_in_month are required",
            });
        }

        let staffList;
        if (staff_id) {
            const staff = await Staff.findOne({ _id: staff_id, user_id }).lean();
            if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
            staffList = [staff];
        } else {
            staffList = await Staff.find({ user_id })
                .select("_id staff_id f_name l_name salary overtime_rate position photo")
                .lean();
        }

        const previews = await Promise.all(
            staffList.map(async (staff) => {
                const { present_days, absent_days } = await getAttendanceCounts(
                    staff._id,
                    parseInt(month),
                    parseInt(year)
                );

                const overtime_rate = staff.overtime_rate || 0;
                const { earned_salary, overtime_pay, net_salary } = calculateSalary({
                    base_salary: staff.salary || 0,
                    working_days_in_month: parseInt(working_days_in_month),
                    present_days,
                    overtime_hours: 0, // default 0 in preview — user adjusts before saving
                    overtime_rate,
                    bonus: 0,
                    deductions: 0,
                });

                // Check if payroll already exists for this month
                const existing = await StaffPayroll.findOne({
                    staff_id: staff._id,
                    month: parseInt(month),
                    year: parseInt(year),
                }).lean();

                return {
                    staff_id: staff._id,
                    staff_ref_id: staff.staff_id,
                    f_name: staff.f_name,
                    l_name: staff.l_name,
                    position: staff.position,
                    photo: staff.photo,
                    base_salary: staff.salary || 0,
                    overtime_rate,
                    present_days,
                    absent_days,
                    working_days_in_month: parseInt(working_days_in_month),
                    earned_salary,
                    overtime_hours: 0,
                    overtime_pay: 0,
                    bonus: 0,
                    deductions: 0,
                    deduction_reason: "",
                    net_salary,
                    notes: "",
                    already_exists: !!existing,
                    existing_status: existing?.status || null,
                };
            })
        );

        res.json({ success: true, data: previews });
    } catch (error) {
        console.error("Error previewing payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    generatePayroll,
    getMonthlyPayrollSummary,
    getPayrollByStaff,
    updatePayroll,
    markAsPaid,
    markAsUnpaid,
    deletePayroll,
    previewPayroll,
};