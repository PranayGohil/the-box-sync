const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Reservation = require("../models/reservationModel");
const SlotConfig = require("../models/slotConfigModel");
const Table = require("../models/tableModel");
const User = require("../models/userModel");
const authMiddleware = require("../middlewares/auth-middlewares");
const { generateReservationToken, resolveToken } = require("../controllers/reservationController");

const {
    generateGroupedSlots, generateSlots,
    slotEnd, slotRangeLabel,
    validateSlots, isOpenDay, isBlocked, isSlotPast,
    SLOT_GROUP_PRESETS,
} = require("../utils/slotHelpers");

// ─── helpers ────────────────────────────────────────────────────────────────
async function setTableStatus(assignedTables, newStatus, session = null) {
    const ops = assignedTables.map(({ area_id, table_id }) => ({
        updateOne: {
            filter: { _id: area_id, "tables._id": table_id },
            update: { $set: { "tables.$.current_status": newStatus } },
        },
    }));
    if (ops.length) await Table.bulkWrite(ops, session ? { session } : {});
}

async function getConfig(user_id) {
    let c = await SlotConfig.findOne({ user_id });
    if (!c) c = await SlotConfig.create({ user_id, slot_groups: [] });
    return c;
}

// ─── resolve user_id from restaurant_token (for public routes) ──────────────
async function getUserIdFromToken(token) {
    if (!token) return null;
    const user = await User.findOne({ restaurant_token: token }).select("_id");
    return user ? user._id.toString() : null;
}

// ═══════════════════════════════════════════════════════════════
// SLOT CONFIG
// ═══════════════════════════════════════════════════════════════

// GET /reservation/config
router.get("/config", authMiddleware, async (req, res) => {
    try {
        const config = await getConfig(req.user._id);
        return res.json({ success: true, data: config, presets: SLOT_GROUP_PRESETS });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// PUT /reservation/config  — save open_days
router.put("/config", authMiddleware, async (req, res) => {
    try {
        const { open_days } = req.body;
        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id },
            { open_days },
            { new: true, upsert: true }
        );
        return res.json({ success: true, message: "Saved.", data: config });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
});

// POST /reservation/config/group  — add a slot group
router.post("/config/group", authMiddleware, async (req, res) => {
    try {
        const { name, open_time, close_time, slot_duration, max_slots_per_booking, color } = req.body;
        if (!name || !open_time || !close_time) {
            return res.status(400).json({ success: false, message: "name, open_time, close_time required." });
        }
        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id },
            { $push: { slot_groups: { name, open_time, close_time, slot_duration: slot_duration || 30, max_slots_per_booking: max_slots_per_booking || 4, color: color || null, is_active: true } } },
            { new: true, upsert: true }
        );
        return res.json({ success: true, message: "Slot group added.", data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /reservation/config/group/:groupId  — update a slot group
router.put("/config/group/:groupId", authMiddleware, async (req, res) => {
    try {
        const { name, open_time, close_time, slot_duration, max_slots_per_booking, color, is_active } = req.body;
        const update = {};
        if (name !== undefined) update["slot_groups.$.name"] = name;
        if (open_time !== undefined) update["slot_groups.$.open_time"] = open_time;
        if (close_time !== undefined) update["slot_groups.$.close_time"] = close_time;
        if (slot_duration !== undefined) update["slot_groups.$.slot_duration"] = slot_duration;
        if (max_slots_per_booking !== undefined) update["slot_groups.$.max_slots_per_booking"] = max_slots_per_booking;
        if (color !== undefined) update["slot_groups.$.color"] = color;
        if (is_active !== undefined) update["slot_groups.$.is_active"] = is_active;

        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id, "slot_groups._id": req.params.groupId },
            { $set: update },
            { new: true }
        );
        return res.json({ success: true, message: "Updated.", data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /reservation/config/group/:groupId
router.delete("/config/group/:groupId", authMiddleware, async (req, res) => {
    try {
        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id },
            { $pull: { slot_groups: { _id: req.params.groupId } } },
            { new: true }
        );
        return res.json({ success: true, message: "Slot group deleted.", data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

// POST /reservation/config/block-slot
router.post("/config/block-slot", authMiddleware, async (req, res) => {
    try {
        const { date, slot_start, group_id, reason } = req.body;
        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id },
            { $push: { blocked_slots: { date, slot_start, group_id: group_id || null, reason: reason || null } } },
            { new: true, upsert: true }
        );
        return res.json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// DELETE /reservation/config/block-slot
router.delete("/config/block-slot", authMiddleware, async (req, res) => {
    try {
        const { date, slot_start, group_id } = req.body;
        const config = await SlotConfig.findOneAndUpdate(
            { user_id: req.user._id },
            { $pull: { blocked_slots: { date, slot_start, ...(group_id ? { group_id } : {}) } } },
            { new: true }
        );
        return res.json({ success: true, data: config });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ═══════════════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// POST /reservation/generate-token  (manager, authenticated)
router.post("/generate-token", authMiddleware, generateReservationToken);

// GET /reservation/resolve-token/:token  (public)
// Returns safe restaurant info — used by landing page to get user_id
router.get("/resolve-token/:token", resolveToken);

// ═══════════════════════════════════════════════════════════════
// PUBLIC SLOT AVAILABILITY
// Accepts EITHER ?user_id=xxx OR ?token=xxx (token preferred)
// GET /reservation/slots?token=xxx&date=YYYY-MM-DD
// Returns slots grouped by slot group (Lunch / Dinner / etc.)
// ═══════════════════════════════════════════════════════════════
router.get("/slots", async (req, res) => {
    try {
        let { user_id, token, date } = req.query;
        // Resolve token → user_id if token provided
        if (token && !user_id) {
            user_id = await getUserIdFromToken(token);
            if (!user_id) return res.status(404).json({ success: false, message: "Invalid reservation token." });
        }
        if (!user_id || !date) return res.status(400).json({ success: false, message: "token (or user_id) and date are required." });

        const config = await SlotConfig.findOne({ user_id });
        if (!config || !config.slot_groups.length) {
            return res.status(404).json({ success: false, message: "Restaurant has not configured time slots yet." });
        }

        if (!isOpenDay(date, config.open_days)) {
            return res.json({ success: true, data: [], message: "Restaurant is closed on this day." });
        }

        const areaDocs = await Table.find({ user_id });
        const totalTables = areaDocs.reduce((s, a) => s + a.tables.length, 0);

        // All active reservations for this date to compute booked tables per slot+group
        const bookedReservations = await Reservation.find({
            user_id, reservation_date: date,
            status: { $in: ["approved", "reserved", "seated"] },
            is_deleted: false,
        }).select("slots group_id assigned_tables");

        // Map: groupId+slotStart → Set of booked table_ids
        const bookedMap = {};
        for (const r of bookedReservations) {
            const gKey = r.group_id.toString();
            for (const s of r.slots) {
                const key = `${gKey}::${s}`;
                if (!bookedMap[key]) bookedMap[key] = new Set();
                r.assigned_tables.forEach((t) => bookedMap[key].add(t.table_id.toString()));
            }
        }

        const groups = generateGroupedSlots(config.slot_groups);
        // NOTE: group.slots is now [{slot_start, slot_end}] objects (not plain strings)

        const result = groups.map((group) => ({
            group_id: group.group_id,
            name: group.name,
            color: group.color,
            slot_duration: group.slot_duration,
            max_slots_per_booking: group.max_slots_per_booking,
            slots: group.slots.map((slot) => {
                const start = slot.slot_start;  // slot is now an object
                const key = `${group.group_id}::${start}`;
                const bookedCount = bookedMap[key] ? bookedMap[key].size : 0;
                const available = totalTables - bookedCount;
                const blocked = isBlocked(date, start, group.group_id, config.blocked_slots);
                const isPast = isSlotPast(date, start, group.slot_duration, group.open_time, group.close_time);
                return {
                    slot_start: start,
                    slot_end: slot.slot_end,
                    label: `${start} – ${slot.slot_end}`,
                    available_tables: blocked || isPast ? 0 : available,
                    total_tables: totalTables,
                    is_blocked: blocked,
                    is_past: isPast,
                    bookable: !blocked && !isPast && available > 0,
                };
            }),
        }));

        return res.json({ success: true, data: result });
    } catch (err) {
        console.error("Slots error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ═══════════════════════════════════════════════════════════════
// PUBLIC — Customer booking
// ═══════════════════════════════════════════════════════════════
router.post("/create", async (req, res) => {
    try {
        let { customer_name, customer_phone, customer_email, reservation_date, group_id, slots, num_persons, notes, user_id, token } = req.body;

        // Resolve token → user_id if token provided
        if (token && !user_id) {
            user_id = await getUserIdFromToken(token);
            if (!user_id) return res.status(400).json({ success: false, message: "Invalid reservation token." });
        }

        if (!customer_name || !customer_phone || !reservation_date || !group_id || !slots || !num_persons || !user_id) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const config = await getConfig(user_id);
        if (!isOpenDay(reservation_date, config.open_days)) {
            return res.status(400).json({ success: false, message: "Restaurant is closed on this day." });
        }

        const group = config.slot_groups.find((g) => g._id.toString() === group_id && g.is_active);
        if (!group) return res.status(400).json({ success: false, message: "Invalid slot group." });

        const allSlots = generateSlots(group.open_time, group.close_time, group.slot_duration);
        const validationError = validateSlots(slots, allSlots, group.slot_duration, group.max_slots_per_booking);
        if (validationError) return res.status(400).json({ success: false, message: validationError });

        for (const s of slots) {
            if (isBlocked(reservation_date, s, group_id, config.blocked_slots)) {
                return res.status(400).json({ success: false, message: `Slot ${s} is not available.` });
            }
        }

        const slot_duration = group.slot_duration;

        const existing = await Reservation.find({
            user_id,
            reservation_date,
            group_id,
            slots: { $in: slots },
            status: { $in: ["approved", "reserved", "seated"] }
        });

        // if (existing.length >= totalTables) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "No tables available for selected slot."
        //     });
        // }

        const reservation = await Reservation.create({
            customer_name, customer_phone,
            customer_email: customer_email || null,
            reservation_date, group_id, group_name: group.name,
            slots,
            slot_start: slots[0],
            slot_end: slotEnd(slots[slots.length - 1], slot_duration),
            num_persons, notes: notes || null, user_id,
        });

        return res.status(201).json({
            success: true,
            message: "Reservation request submitted! We'll confirm shortly.",
            data: {
                ...reservation.toObject(),
                slot_label: slotRangeLabel(slots, group.slot_duration),
            },
        });
    } catch (err) {
        console.error("Create error:", err);
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// GET /reservation/status/:id  (public)
router.get("/status/:id", async (req, res) => {
    try {
        const r = await Reservation.findById(req.params.id).select(
            "customer_name status reservation_date group_name slots slot_start slot_end num_persons assigned_tables manager_notes"
        );
        if (!r) return res.status(404).json({ success: false, message: "Not found." });
        return res.json({ success: true, data: r });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ═══════════════════════════════════════════════════════════════
// MANAGER
// ═══════════════════════════════════════════════════════════════

router.get("/all", authMiddleware, async (req, res) => {
    try {
        const { status, date, page = 1, limit = 20 } = req.query;
        const filter = { user_id: req.user._id, is_deleted: false };
        if (status && status !== "all") filter.status = status;
        if (date) filter.reservation_date = date;
        const [data, total] = await Promise.all([
            Reservation.find(filter).sort({ reservation_date: 1, slot_start: 1 }).skip((page - 1) * limit).limit(Number(limit)),
            Reservation.countDocuments(filter),
        ]);
        return res.json({ success: true, data, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.get("/timeline", authMiddleware, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: "date required." });

        const config = await getConfig(req.user._id);
        const areaDocs = await Table.find({ user_id: req.user._id });
        const groups = generateGroupedSlots(config.slot_groups);

        const reservations = await Reservation.find({
            user_id: req.user._id, reservation_date: date,
            status: { $in: ["pending", "approved", "reserved", "seated"] },
            is_deleted: false,
        });

        const grid = {};
        for (const r of reservations) {
            for (const t of r.assigned_tables) {
                const key = t.table_id.toString();
                if (!grid[key]) grid[key] = {};
                for (const s of r.slots) {
                    grid[key][`${r.group_id}::${s}`] = {
                        reservation_id: r._id, customer_name: r.customer_name,
                        num_persons: r.num_persons, status: r.status, group_name: r.group_name,
                    };
                }
            }
        }

        return res.json({
            success: true,
            data: {
                groups,
                areas: areaDocs.map((area) => ({
                    area_id: area._id, area_name: area.area,
                    tables: area.tables.map((t) => ({
                        table_id: t._id, table_no: t.table_no, max_person: t.max_person,
                        slots: grid[t._id.toString()] || {},
                    })),
                })),
                pending_reservations: reservations.filter((r) => r.status === "pending"),
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.get("/available-tables/:reservationId", authMiddleware, async (req, res) => {
    try {
        const reservation = await Reservation.findOne({ _id: req.params.reservationId, user_id: req.user._id });
        if (!reservation) return res.status(404).json({ success: false, message: "Not found." });

        const config = await getConfig(req.user._id);
        const group = config.slot_groups.id(reservation.group_id);

        const conflicting = await Reservation.find({
            user_id: req.user._id, _id: { $ne: reservation._id },
            reservation_date: reservation.reservation_date,
            group_id: reservation.group_id,
            slots: { $in: reservation.slots },
            status: { $in: ["approved", "reserved", "seated"] },
            is_deleted: false,
        }).select("assigned_tables.table_id");

        const busyIds = new Set(conflicting.flatMap((r) => r.assigned_tables.map((t) => t.table_id.toString())));
        const areaDocs = await Table.find({ user_id: req.user._id });

        const available = areaDocs.map((area) => ({
            area_id: area._id, area_name: area.area,
            tables: area.tables
                .filter((t) => !busyIds.has(t._id.toString()))
                .map((t) => ({ table_id: t._id, table_no: t.table_no, max_person: t.max_person })),
        })).filter((a) => a.tables.length > 0);

        return res.json({
            success: true, data: available,
            num_persons: reservation.num_persons,
            slot_label: group ? slotRangeLabel(reservation.slots, group.slot_duration) : "",
            group_name: reservation.group_name,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const r = await Reservation.findOne({ _id: req.params.id, user_id: req.user._id });
        if (!r) return res.status(404).json({ success: false, message: "Not found." });
        return res.json({ success: true, data: r });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

// ─── status transition helpers ───────────────────────────────────────────────
const transition = (allowedStatuses, newStatus, tableStatus = null) =>
    async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const r = await Reservation.findOne({ _id: req.params.id, user_id: req.user._id }).session(session);
            if (!r) throw new Error("Not found.");
            if (!allowedStatuses.includes(r.status)) throw new Error(`Cannot perform this action on a "${r.status}" reservation.`);
            if (tableStatus) await setTableStatus(r.assigned_tables, tableStatus, session);
            r.status = newStatus;
            if (req.body.manager_notes) r.manager_notes = req.body.manager_notes;
            await r.save({ session });
            await session.commitTransaction();
            return res.json({ success: true, message: `Status updated to ${newStatus}.`, data: r });
        } catch (err) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: err.message });
        } finally { session.endSession(); }
    };

// PATCH /reservation/approve/:id
router.patch("/approve/:id", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { assigned_tables, manager_notes } = req.body;
        if (!assigned_tables?.length) throw new Error("Please assign at least one table.");

        const r = await Reservation.findOne({ _id: req.params.id, user_id: req.user._id }).session(session);
        if (!r) throw new Error("Not found.");
        if (r.status !== "pending") throw new Error(`Cannot approve a "${r.status}" reservation.`);

        const tableIds = assigned_tables.map((t) => new mongoose.Types.ObjectId(t.table_id));
        const conflict = await Reservation.exists({
            user_id: req.user._id, _id: { $ne: r._id },
            reservation_date: r.reservation_date,
            group_id: r.group_id,
            slots: { $in: r.slots },
            "assigned_tables.table_id": { $in: tableIds },
            status: { $in: ["approved", "reserved", "seated"] },
        });
        if (conflict) throw new Error("One or more tables are already booked for an overlapping slot.");

        r.status = "approved";
        r.assigned_tables = assigned_tables;
        r.manager_notes = manager_notes || null;
        r.approved_by = req.user._id;
        r.approved_at = new Date();
        await r.save({ session });
        await session.commitTransaction();
        return res.json({ success: true, message: "Approved.", data: r });
    } catch (err) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: err.message });
    } finally { session.endSession(); }
});

router.patch("/reject/:id", authMiddleware, transition(["pending", "approved"], "rejected"));
router.patch("/activate/:id", authMiddleware, transition(["approved"], "reserved", "Reserved"));
router.patch("/seat/:id", authMiddleware, transition(["reserved"], "seated", "Occupied"));
router.patch("/complete/:id", authMiddleware, transition(["seated", "reserved"], "completed", "Empty"));
router.patch("/no-show/:id", authMiddleware, transition(["approved", "reserved"], "no_show", "Empty"));

router.patch("/cancel/:id", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const r = await Reservation.findOne({ _id: req.params.id, user_id: req.user._id }).session(session);
        if (!r) throw new Error("Not found.");
        if (!["pending", "approved", "reserved"].includes(r.status)) throw new Error("Cannot cancel at this stage.");
        if (["approved", "reserved"].includes(r.status)) await setTableStatus(r.assigned_tables, "Empty", session);
        r.status = "cancelled";
        if (req.body.manager_notes) r.manager_notes = req.body.manager_notes;
        await r.save({ session });
        await session.commitTransaction();
        return res.json({ success: true, message: "Cancelled.", data: r });
    } catch (err) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: err.message });
    } finally { session.endSession(); }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        await Reservation.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, { is_deleted: true });
        return res.json({ success: true, message: "Deleted." });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
});

module.exports = router;