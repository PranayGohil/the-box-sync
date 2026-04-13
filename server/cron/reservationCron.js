/**
 * reservationCron.js
 *
 * Runs EVERY MINUTE. Two jobs execute in a single tick:
 *
 *   JOB 1 — AUTO-RESERVE   (slot_start reached)
 *     approved  → reserved   + tables → "Reserved"
 *     Condition: current HH:MM === reservation.slot_start  AND  reservation_date === today
 *
 *   JOB 2 — AUTO-COMPLETE  (slot_end reached)
 *     reserved | seated → completed + tables → "Empty"
 *     Condition: current HH:MM === reservation.slot_end    AND  reservation_date === today
 *
 * Overnight handling:
 *   Reservations that span midnight store reservation_date as the OPENING date.
 *   After-midnight slot_start/slot_end times (e.g. "01:00") are matched on TODAY's
 *   date only if the cron fires after midnight but the reservation belongs to yesterday.
 *   We handle this by checking both today and yesterday for each job.
 *
 * Usage in app.js / server.js:
 *   require('./cron/reservationCron');
 *
 * Install: npm install node-cron
 */

const cron = require("node-cron");
const mongoose = require("mongoose");
const Reservation = require("../models/reservationModel");
const Table = require("../models/tableModel");
const { toHHMM } = require("../utils/slotHelpers");

// ─── Helper: bulk-update table statuses in a transaction ────────────────────
async function setTableStatus(assignedTables, newStatus, session) {
    if (!assignedTables || !assignedTables.length) return;
    const ops = assignedTables.map(({ area_id, table_id }) => ({
        updateOne: {
            filter: { _id: area_id, "tables._id": table_id },
            update: { $set: { "tables.$.current_status": newStatus } },
        },
    }));
    await Table.bulkWrite(ops, { session });
}

// ─── Helper: today and yesterday date strings ────────────────────────────────
function getDateStrings() {
    const now = new Date();
    const yyyy = (d) => d.toISOString().slice(0, 10);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
        now,
        currentTime: toHHMM(now.getHours() * 60 + now.getMinutes()), // "HH:MM"
        todayStr: yyyy(now),
        yesterdayStr: yyyy(yesterday),
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// JOB 1 — AUTO-RESERVE: approved → reserved when slot_start is reached
// ═══════════════════════════════════════════════════════════════════════════
async function runAutoReserve() {
    const { currentTime, todayStr, yesterdayStr } = getDateStrings();

    // Find all approved reservations whose slot_start matches current time
    // Check both today and yesterday to handle overnight schedules
    const candidates = await Reservation.find({
        status: "approved",
        auto_activated: false,
        slot_start: currentTime,
        reservation_date: { $in: [todayStr, yesterdayStr] },
        is_deleted: false,
    });

    if (!candidates.length) return;

    console.log(`[Cron:Reserve] ${currentTime} — found ${candidates.length} reservation(s) to activate`);

    for (const reservation of candidates) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            // Re-fetch inside transaction to prevent race conditions
            const r = await Reservation.findOne({
                _id: reservation._id,
                status: "approved",
                auto_activated: false,
            }).session(session);

            if (!r) {
                // Already processed by another process or manually changed
                await session.abortTransaction();
                continue;
            }

            await setTableStatus(r.assigned_tables, "Reserved", session);
            r.status = "reserved";
            r.auto_activated = true;
            await r.save({ session });

            await session.commitTransaction();
            console.log(`[Cron:Reserve] ✓ Reservation ${r._id} (${r.customer_name}) → reserved`);
        } catch (err) {
            await session.abortTransaction();
            console.error(`[Cron:Reserve] ✗ Error processing ${reservation._id}:`, err.message);
        } finally {
            session.endSession();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// JOB 2 — AUTO-COMPLETE: reserved/seated → completed when slot_end is reached
// ═══════════════════════════════════════════════════════════════════════════
async function runAutoComplete() {
    const { currentTime, todayStr, yesterdayStr } = getDateStrings();

    // Find reserved or seated reservations whose slot_end matches current time
    // slot_end is the wall-clock end of their last booked slot
    const candidates = await Reservation.find({
        status: { $in: ["reserved", "seated"] },
        slot_end: currentTime,
        reservation_date: { $in: [todayStr, yesterdayStr] },
        is_deleted: false,
    });

    if (!candidates.length) return;

    console.log(`[Cron:Complete] ${currentTime} — found ${candidates.length} reservation(s) to complete`);

    for (const reservation of candidates) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const r = await Reservation.findOne({
                _id: reservation._id,
                status: { $in: ["reserved", "seated"] },
            }).session(session);

            if (!r) {
                await session.abortTransaction();
                continue;
            }

            await setTableStatus(r.assigned_tables, "Empty", session);
            r.status = "completed";
            await r.save({ session });

            await session.commitTransaction();
            console.log(`[Cron:Complete] ✓ Reservation ${r._id} (${r.customer_name}) → completed, tables freed`);
        } catch (err) {
            await session.abortTransaction();
            console.error(`[Cron:Complete] ✗ Error processing ${reservation._id}:`, err.message);
        } finally {
            session.endSession();
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEDULER — runs every minute
// Both jobs run in the same tick. Each is independent so one failing
// doesn't block the other.
// ═══════════════════════════════════════════════════════════════════════════
cron.schedule("* * * * *", async () => {
    await Promise.allSettled([
        runAutoReserve(),
        runAutoComplete(),
    ]);
});

console.log("[ReservationCron] Started — checking every minute for slot_start and slot_end transitions.");