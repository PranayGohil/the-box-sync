const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reservationSchema = new Schema(
    {
        customer_name: { type: String, required: true, trim: true },
        customer_phone: { type: String, required: true, trim: true },
        customer_email: { type: String, trim: true, default: null },
        num_persons: { type: Number, required: true, min: 1 },
        notes: { type: String, default: null },

        reservation_date: { type: String, required: true }, // "YYYY-MM-DD"

        // Which slot group (Lunch / Dinner / etc.)
        group_id: { type: Schema.Types.ObjectId, required: true },
        group_name: { type: String },   // denormalised for display

        // Ordered slot start-times within the group e.g. ["12:00","12:30"]
        slots: { type: [String], required: true },

        // Scalar convenience fields derived by pre-save hook (safe to index alone)
        slot_start: { type: String },
        slot_end: { type: String },

        status: {
            type: String,
            enum: ["pending", "approved", "rejected", "reserved", "seated", "completed", "cancelled", "no_show"],
            default: "pending",
        },

        assigned_tables: [
            {
                area_id: { type: Schema.Types.ObjectId, ref: "tableDetails" },
                area_name: { type: String },
                table_id: { type: Schema.Types.ObjectId },
                table_no: { type: String },
                max_person: { type: Number },
            },
        ],

        manager_notes: { type: String, default: null },
        approved_by: { type: String, default: null },
        approved_at: { type: Date, default: null },
        auto_activated: { type: Boolean, default: false },

        user_id: { type: String, required: true },
        is_deleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// ── Indexes — never combine two array fields in one index (error 171) ──────
reservationSchema.index({ user_id: 1, status: 1 });
reservationSchema.index({ user_id: 1, reservation_date: 1 });
reservationSchema.index({ user_id: 1, reservation_date: 1, group_id: 1, "assigned_tables.table_id": 1 }); // ONE array field
reservationSchema.index({ user_id: 1, reservation_date: 1, group_id: 1, slots: 1 });                      // ONE array field
reservationSchema.index({ user_id: 1, reservation_date: 1, slot_start: 1, status: 1 });

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;