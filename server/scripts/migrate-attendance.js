/**
 * Migration Script: Move embedded attendance from Staff → Attendance collection
 *
 * HOW TO RUN:
 *   node migrate-attendance.js
 *
 * SAFETY:
 *   - This script only INSERTS into the new Attendance collection.
 *   - It does NOT delete or modify the Staff documents.
 *   - Run this, verify data, then remove the attandance array from Staff schema.
 *
 * DUPLICATE HANDLING:
 *   - Uses insertMany with ordered:false and ignores duplicate key errors (code 11000).
 *   - Safe to re-run — already migrated records will be skipped.
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Models ────────────────────────────────────────────────────────────────────

const staffSchema = new mongoose.Schema({ _: mongoose.Schema.Types.Mixed }, { strict: false });
const Staff = mongoose.model("staff", staffSchema);

const attendanceSchema = new mongoose.Schema({
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "staff", required: true },
    user_id: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String },
    in_time: { type: String, default: null },
    out_time: { type: String, default: null },
}, { timestamps: true });

attendanceSchema.index({ staff_id: 1, date: 1 }, { unique: true });
const Attendance = mongoose.model("staff-attendance", attendanceSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isDuplicateKeyError(err) {
    // Bulk write errors wrap individual write errors inside writeErrors[]
    if (err.code === 11000) return true;
    if (err.writeErrors && err.writeErrors.every((e) => e.code === 11000)) return true;
    return false;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URI;

    if (!MONGO_URI) {
        console.error("❌  No MongoDB URI found. Set MONGO_URI in your .env file.");
        process.exit(1);
    }

    console.log("🔌  Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected.\n");

    // ── Stats ──────────────────────────────────────────────────────────────────
    let totalStaff = 0;
    let totalRecords = 0;
    let insertedRecords = 0;
    let skippedRecords = 0;   // duplicates
    let staffWithNoData = 0;
    let staffFailed = 0;

    // ── Fetch all staff ────────────────────────────────────────────────────────
    const allStaff = await Staff.find({}).lean();
    totalStaff = allStaff.length;
    console.log(`📋  Found ${totalStaff} staff member(s) to process.\n`);

    for (const staff of allStaff) {
        const name = `${staff.f_name || ""} ${staff.l_name || ""}`.trim() || staff._id;

        const rawAttendance = staff.attandance || [];

        if (rawAttendance.length === 0) {
            staffWithNoData++;
            console.log(`   ⏭   ${name} — no attendance records, skipping.`);
            continue;
        }

        // Build documents for bulk insert
        const docs = rawAttendance
            .filter((a) => a.date)          // skip malformed entries with no date
            .map((a) => ({
                staff_id: staff._id,
                user_id: staff.user_id || "",
                date: a.date,
                status: a.status || null,
                in_time: a.in_time || null,
                out_time: a.out_time || null,
            }));

        const skippedMalformed = rawAttendance.length - docs.length;
        totalRecords += rawAttendance.length;

        try {
            const result = await Attendance.insertMany(docs, { ordered: false });
            insertedRecords += result.length;

            const dupes = docs.length - result.length;
            skippedRecords += dupes + skippedMalformed;

            console.log(
                `   ✅  ${name} — ${result.length} inserted` +
                (dupes ? `, ${dupes} duplicate(s) skipped` : "") +
                (skippedMalformed ? `, ${skippedMalformed} malformed record(s) skipped` : "")
            );
        } catch (err) {
            if (isDuplicateKeyError(err)) {
                // Some inserted, some were duplicates — still a partial success
                const inserted = err.result?.nInserted ?? 0;
                const dupes = docs.length - inserted;
                insertedRecords += inserted;
                skippedRecords += dupes + skippedMalformed;

                console.log(
                    `   ⚠️   ${name} — ${inserted} inserted, ${dupes} duplicate(s) skipped` +
                    (skippedMalformed ? `, ${skippedMalformed} malformed skipped` : "")
                );
            } else {
                staffFailed++;
                console.error(`   ❌  ${name} — unexpected error:`, err.message);
            }
        }

        // Small breathing room to avoid hammering the DB
        await sleep(10);
    }

    // ── Summary ────────────────────────────────────────────────────────────────
    console.log("\n══════════════════════════════════════════");
    console.log("           MIGRATION SUMMARY");
    console.log("══════════════════════════════════════════");
    console.log(`  Total staff processed   : ${totalStaff}`);
    console.log(`  Staff with no records   : ${staffWithNoData}`);
    console.log(`  Staff with errors       : ${staffFailed}`);
    console.log(`  Total attendance records: ${totalRecords}`);
    console.log(`  Inserted                : ${insertedRecords}`);
    console.log(`  Skipped (duplicates)    : ${skippedRecords}`);
    console.log("══════════════════════════════════════════");

    if (staffFailed > 0) {
        console.log("\n⚠️  Some staff failed. Check logs above, fix issues, and re-run.");
    } else {
        console.log("\n🎉  Migration complete!");
        console.log("👉  Next steps:");
        console.log("    1. Verify data in your Attendance collection (spot-check a few staff).");
        console.log("    2. Test your updated API endpoints.");
        console.log("    3. Once confirmed, remove the `attandance` array from the Staff schema.");
    }

    await mongoose.disconnect();
    console.log("\n🔌  Disconnected from MongoDB. Done.");
}

migrate().catch((err) => {
    console.error("💥  Migration failed with unhandled error:", err);
    process.exit(1);
});