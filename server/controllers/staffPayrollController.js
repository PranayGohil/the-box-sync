const StaffPayroll = require("../models/staffPayrollModel");
const Staff = require("../models/staffModel");
const StaffAttendance = require("../models/staffAttendanceModel");
const PayrollConfig = require("../models/PayrollConfig");
const SalaryAdvance = require("../models/salaryAdvanceModel");

// ── Helper: Calculate PT based on slabs ───────────────────────────────────────
const calculatePT = (earnedSalary, ptConfig) => {
    if (!ptConfig || !ptConfig.is_applicable || !ptConfig.slabs || ptConfig.slabs.length === 0) return 0;
    
    let ptAmount = 0;
    for (const slab of ptConfig.slabs) {
        if (earnedSalary >= slab.min_salary && earnedSalary <= slab.max_salary) {
            ptAmount = slab.amount;
            break;
        }
    }
    return ptAmount;
};

// ── Helper: calculate net salary ──────────────────────────────────────────────
const calculateSalary = ({
    salary_structure,
    globalConfig,
    base_salary,
    working_days_in_month,
    leave_summary, // contains paid_leave_days, lwp_days, total_paid_days, etc.
    overtime_hours,
    overtime_rate,
    bonus,
    manual_deductions,
    advance_deduction
}) => {
    const safeDays = working_days_in_month > 0 ? working_days_in_month : 1;
    const paidDays = leave_summary.total_paid_days;

    let earned_breakdown = { basic: 0, hra: 0, conveyance: 0, medical: 0, special: 0, other: 0, total_gross: 0 };
    let deduction_breakdown = { pf: 0, esi: 0, pt: 0, total_statutory: 0 };

    if (salary_structure && salary_structure.earnings) {
        const e = salary_structure.earnings;
        earned_breakdown.basic = parseFloat(((e.basic / safeDays) * paidDays).toFixed(2));
        earned_breakdown.hra = parseFloat(((e.hra / safeDays) * paidDays).toFixed(2));
        earned_breakdown.conveyance = parseFloat(((e.conveyance / safeDays) * paidDays).toFixed(2));
        earned_breakdown.medical = parseFloat(((e.medical / safeDays) * paidDays).toFixed(2));
        earned_breakdown.special = parseFloat(((e.special / safeDays) * paidDays).toFixed(2));
        earned_breakdown.other = parseFloat(((e.other / safeDays) * paidDays).toFixed(2));
    } else {
        earned_breakdown.basic = parseFloat(((base_salary / safeDays) * paidDays).toFixed(2));
    }

    earned_breakdown.total_gross = parseFloat((
        earned_breakdown.basic + earned_breakdown.hra + earned_breakdown.conveyance +
        earned_breakdown.medical + earned_breakdown.special + earned_breakdown.other
    ).toFixed(2));

    // LWP Deduction (Loss of Pay)
    const total_gross_monthly = salary_structure && salary_structure.earnings ? 
        Object.values(salary_structure.earnings).reduce((a, b) => a + Number(b), 0) : base_salary;
    const perDayGross = total_gross_monthly / safeDays;
    const lwp_deduction = parseFloat((perDayGross * leave_summary.lwp_days).toFixed(2));

    // Statutory Deductions based on new config
    const statConfig = globalConfig?.statutory_config || {};
    
    // PF Calculation
    if (statConfig.pf && statConfig.pf.is_mandatory && statConfig.pf.auto_calculate) {
        const limit = statConfig.pf.salary_limit || 0;
        // If limit is 0 (no cap) or basic is below the cap, apply percentage
        // In India, PF is usually maxed at 12% of 15000 if salary > 15000
        let pfBase = earned_breakdown.basic;
        if (limit > 0 && pfBase > limit) pfBase = limit;
        
        deduction_breakdown.pf = parseFloat((pfBase * (statConfig.pf.employee_percentage / 100)).toFixed(2));
    }

    // ESI Calculation
    if (statConfig.esi && statConfig.esi.is_mandatory && statConfig.esi.auto_calculate) {
        const limit = statConfig.esi.gross_limit || 21000;
        // ESI applies only if Gross is <= limit
        if (total_gross_monthly <= limit) {
            deduction_breakdown.esi = parseFloat((earned_breakdown.total_gross * (statConfig.esi.employee_percentage / 100)).toFixed(2));
        }
    }

    // PT Calculation
    deduction_breakdown.pt = calculatePT(earned_breakdown.total_gross, statConfig.pt);
    
    deduction_breakdown.total_statutory = parseFloat((deduction_breakdown.pf + deduction_breakdown.esi + deduction_breakdown.pt).toFixed(2));

    const overtime_pay = parseFloat((overtime_hours * overtime_rate).toFixed(2));
    
    const net_salary = parseFloat(
        (earned_breakdown.total_gross + overtime_pay + (bonus || 0) - deduction_breakdown.total_statutory - (manual_deductions || 0) - (advance_deduction || 0)).toFixed(2)
    );

    return { earned_breakdown, deduction_breakdown, overtime_pay, lwp_deduction, net_salary };
};

// ── Helper: get attendance counts and LWP ─────────────────────────────────────
const getAttendanceCounts = async (staff_id, month, year) => {
    const monthStr = String(month).padStart(2, "0");
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const records = await StaffAttendance.find({
        staff_id,
        date: { $gte: startDate, $lte: endDate },
    }).lean();

    let present_days = 0;
    let absent_days = 0;
    let paid_leave_days = 0;
    let holiday_days = 0;
    let week_off_days = 0;
    let comp_off_days = 0;
    let total_ot = 0;
    
    // Also track unpaid leaves (lwp) explicitly if we added logic for it, otherwise absent is lwp
    let lwp_leave_days = 0; 

    records.forEach(r => {
        if (r.status === "present") present_days += 1;
        else if (r.status === "half_day") present_days += 0.5;
        else if (r.status === "absent") absent_days += 1;
        else if (r.status === "holiday") holiday_days += 1;
        else if (r.status === "week_off") week_off_days += 1;
        else if (r.status === "comp_off") comp_off_days += 1;
        else if (r.status === "leave") {
            // Need to know if this leave was paid or unpaid. We assume paid for now unless we look up LeavePolicy.
            // A more robust system would log is_paid inside StaffAttendance when marking leave.
            // For now, assume all marked 'leave' are approved paid leaves. Unpaid leaves usually marked 'absent' or need specific LWP flag.
            paid_leave_days += 1;
        }

        total_ot += (r.overtime_hours || 0);
    });

    const total_paid_days = present_days + paid_leave_days + holiday_days + week_off_days + comp_off_days;
    const lwp_days = absent_days + lwp_leave_days;

    return {
        leave_summary: {
            paid_leave_days,
            lwp_days,
            holiday_days,
            week_off_days,
            comp_off_days,
            total_paid_days
        },
        present_days,
        absent_days,
        total_records: records.length,
        total_ot
    };
};

// ── GET /payroll/preview ──────────────────────────────────────────────────────
const previewPayroll = async (req, res) => {
    try {
        const user_id = req.user;
        const { month, year, working_days_in_month, staff_id } = req.query;

        if (!month || !year || !working_days_in_month) {
            return res.status(400).json({ success: false, message: "month, year and working_days_in_month are required" });
        }

        let staffList;
        if (staff_id) {
            const staff = await Staff.findOne({ _id: staff_id, user_id }).lean();
            if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
            staffList = [staff];
        } else {
            staffList = await Staff.find({ user_id })
                .select("_id staff_id f_name l_name salary salary_structure overtime_rate position photo")
                .lean();
        }

        const globalConfig = await PayrollConfig.findOne({ user_id }).lean();

        const previews = await Promise.all(
            staffList.map(async (staff) => {
                const { leave_summary, present_days, absent_days, total_ot } = await getAttendanceCounts(staff._id, parseInt(month), parseInt(year));

                // Find active salary advances for this staff to auto-deduct
                const activeAdvances = await SalaryAdvance.find({ staff_id: staff._id, status: 'active' }).lean();
                let advance_deduction = 0;
                activeAdvances.forEach(adv => {
                    advance_deduction += adv.installment_amount;
                });

                const overtime_rate = staff.overtime_rate || 0;
                const { earned_breakdown, deduction_breakdown, overtime_pay, lwp_deduction, net_salary } = calculateSalary({
                    salary_structure: staff.salary_structure,
                    globalConfig,
                    base_salary: staff.salary || 0,
                    working_days_in_month: parseInt(working_days_in_month),
                    leave_summary,
                    overtime_hours: total_ot,
                    overtime_rate,
                    bonus: 0,
                    manual_deductions: 0,
                    advance_deduction
                });

                const existing = await StaffPayroll.findOne({ staff_id: staff._id, month: parseInt(month), year: parseInt(year) }).lean();

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
                    leave_summary,
                    working_days_in_month: parseInt(working_days_in_month),
                    earned_breakdown,
                    deduction_breakdown,
                    advance_deduction,
                    lwp_deduction,
                    overtime_hours: total_ot,
                    overtime_pay,
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

// ── POST /payroll/generate ────────────────────────────────────────────────────
const generatePayroll = async (req, res) => {
    try {
        const user_id = req.user;
        const {
            month, year, working_days_in_month, staff_id,
            overtime_hours_map = {}, bonus_map = {}, deductions_map = {},
            deduction_reason_map = {}, notes_map = {},
        } = req.body;

        if (!month || !year || !working_days_in_month) {
            return res.status(400).json({ success: false, message: "month, year and working_days_in_month are required" });
        }

        let staffList;
        if (staff_id) {
            const staff = await Staff.findOne({ _id: staff_id, user_id }).lean();
            if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });
            staffList = [staff];
        } else {
            staffList = await Staff.find({ user_id }).select("_id staff_id f_name l_name salary salary_structure overtime_rate position").lean();
        }

        if (staffList.length === 0) return res.status(404).json({ success: false, message: "No staff found" });

        const globalConfig = await PayrollConfig.findOne({ user_id }).lean();

        const results = { created: [], updated: [], errors: [] };

        for (const staff of staffList) {
            try {
                const sid = staff._id.toString();

                const { leave_summary, present_days, absent_days, total_ot } = await getAttendanceCounts(staff._id, month, year);

                const activeAdvances = await SalaryAdvance.find({ staff_id: staff._id, status: 'active' }).lean();
                let advance_deduction = 0;
                activeAdvances.forEach(adv => { advance_deduction += adv.installment_amount; });

                const overtime_hours = staff_id ? parseFloat(req.body.overtime_hours || total_ot) : parseFloat(overtime_hours_map[sid] || total_ot);
                const bonus = staff_id ? parseFloat(req.body.bonus || 0) : parseFloat(bonus_map[sid] || 0);
                const deductions = staff_id ? parseFloat(req.body.deductions || 0) : parseFloat(deductions_map[sid] || 0);
                const deduction_reason = staff_id ? req.body.deduction_reason || "" : deduction_reason_map[sid] || "";
                const notes = staff_id ? req.body.notes || "" : notes_map[sid] || "";
                const overtime_rate = staff.overtime_rate || 0;

                const { earned_breakdown, deduction_breakdown, overtime_pay, lwp_deduction, net_salary } = calculateSalary({
                    salary_structure: staff.salary_structure,
                    globalConfig,
                    base_salary: staff.salary || 0,
                    working_days_in_month,
                    leave_summary,
                    overtime_hours,
                    overtime_rate,
                    bonus,
                    manual_deductions: deductions,
                    advance_deduction
                });

                const payrollData = {
                    staff_id: staff._id, user_id, month, year, working_days_in_month,
                    present_days, absent_days, leave_summary,
                    overtime_hours, overtime_rate, overtime_pay,
                    bonus, deductions, deduction_reason,
                    earned_breakdown, deduction_breakdown, advance_deduction, lwp_deduction,
                    net_salary, notes, status: "unpaid", paid_date: null,
                };

                const existing = await StaffPayroll.findOne({ staff_id: staff._id, month, year });

                if (existing) {
                    if (existing.status === "paid") {
                        delete payrollData.status;
                        delete payrollData.paid_date;
                    }
                    await StaffPayroll.findByIdAndUpdate(existing._id, { $set: payrollData });
                    results.updated.push({ staff_id: sid, name: `${staff.f_name} ${staff.l_name}`, net_salary });
                } else {
                    await StaffPayroll.create(payrollData);
                    
                    // Recover advances if this is a newly generated payroll
                    for (const adv of activeAdvances) {
                        let newRecovered = adv.recovered_amount + adv.installment_amount;
                        let newStatus = 'active';
                        if (newRecovered >= adv.amount) {
                            newRecovered = adv.amount;
                            newStatus = 'fully_recovered';
                        }
                        await SalaryAdvance.findByIdAndUpdate(adv._id, { recovered_amount: newRecovered, status: newStatus });
                    }

                    results.created.push({ staff_id: sid, name: `${staff.f_name} ${staff.l_name}`, net_salary });
                }
            } catch (err) {
                results.errors.push({ staff_id: staff._id.toString(), name: `${staff.f_name} ${staff.l_name}`, error: err.message });
            }
        }

        res.json({ success: true, message: `Payroll generated: ${results.created.length} created, ${results.updated.length} updated`, data: results });
    } catch (error) {
        console.error("Error generating payroll:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ... keep existing summary, view, edit, mark paid routes similar but ensure exports match ...

const getMonthlyPayrollSummary = async (req, res) => {
    try {
        const user_id = req.user;
        const { month, year } = req.params;
        const payrollRecords = await StaffPayroll.find({ user_id, month: parseInt(month), year: parseInt(year) }).populate("staff_id", "staff_id f_name l_name position photo overtime_rate salary").lean();
        const allStaff = await Staff.find({ user_id }).select("_id staff_id f_name l_name position photo salary salary_structure overtime_rate").lean();

        const payrollMap = {};
        payrollRecords.forEach(p => { if (p.staff_id) payrollMap[p.staff_id._id.toString()] = p; });

        const summary = allStaff.map(staff => ({ staff, payroll: payrollMap[staff._id.toString()] || null }));

        const totals = {
            total_net_salary: payrollRecords.reduce((sum, p) => sum + (p.net_salary || 0), 0),
            total_paid: payrollRecords.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.net_salary || 0), 0),
            total_unpaid: payrollRecords.filter(p => p.status === "unpaid").reduce((sum, p) => sum + (p.net_salary || 0), 0),
            count_paid: payrollRecords.filter(p => p.status === "paid").length,
            count_unpaid: payrollRecords.filter(p => p.status === "unpaid").length,
            count_not_generated: allStaff.length - payrollRecords.length,
        };

        res.json({ success: true, data: summary, totals });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

const getPayrollByStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const staff = await Staff.findOne({ _id: staffId, user_id: req.user }).select("staff_id f_name l_name position photo salary salary_structure overtime_rate joining_date").lean();
        if (!staff) return res.status(404).json({ success: false, message: "Staff not found" });

        const payrollHistory = await StaffPayroll.find({ staff_id: staffId }).sort({ year: -1, month: -1 }).lean();

        const totalEarned = payrollHistory.reduce((sum, p) => sum + (p.net_salary || 0), 0);
        const totalPaid = payrollHistory.filter(p => p.status === "paid").reduce((sum, p) => sum + (p.net_salary || 0), 0);
        const totalUnpaid = payrollHistory.filter(p => p.status === "unpaid").reduce((sum, p) => sum + (p.net_salary || 0), 0);

        res.json({
            success: true,
            data: {
                staff, payroll: payrollHistory,
                career_stats: { total_months: payrollHistory.length, total_earned: totalEarned, total_paid: totalPaid, total_unpaid: totalUnpaid }
            }
        });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

const updatePayroll = async (req, res) => {
    // Basic recalculation for manual edits
    res.status(501).json({ success: false, message: "Recalculation endpoint needs update for new architecture" });
};

const markAsPaid = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ success: false, message: "ids array is required" });
        const result = await StaffPayroll.updateMany(
            { _id: { $in: ids }, user_id: req.user },
            { $set: { status: "paid", paid_date: new Date().toISOString() } }
        );
        res.json({ success: true, message: `${result.modifiedCount} record(s) marked as paid` });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

const markAsUnpaid = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) return res.status(400).json({ success: false, message: "ids array is required" });
        const result = await StaffPayroll.updateMany(
            { _id: { $in: ids }, user_id: req.user },
            { $set: { status: "unpaid", paid_date: null } }
        );
        res.json({ success: true, message: `${result.modifiedCount} record(s) marked as unpaid` });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

const deletePayroll = async (req, res) => {
    try {
        const payroll = await StaffPayroll.findOneAndDelete({ _id: req.params.id, user_id: req.user });
        if (!payroll) return res.status(404).json({ success: false, message: "Payroll record not found" });
        res.json({ success: true, message: "Payroll record deleted successfully" });
    } catch (error) { res.status(500).json({ success: false, message: "Server error" }); }
};

module.exports = {
    generatePayroll, getMonthlyPayrollSummary, getPayrollByStaff, updatePayroll,
    markAsPaid, markAsUnpaid, deletePayroll, previewPayroll
};