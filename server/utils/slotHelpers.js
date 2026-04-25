/**
 * slotHelpers.js
 * Supports multiple named slot groups per restaurant.
 * Overnight groups (open > close, e.g. 22:00–02:00) are handled correctly.
 */

const toMinutes = (hhmm) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const toHHMM = (mins) => {
    const wrapped = mins % (24 * 60);
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const isOvernight = (open_time, close_time) =>
    toMinutes(open_time) > toMinutes(close_time);

/**
 * Generate slot start-times for a SINGLE group.
 * Returns ["HH:MM", ...] in order.
 */
const generateSlots = (open_time, close_time, slot_duration) => {
    const slots = [];
    const startMins = toMinutes(open_time);
    let closeMins = toMinutes(close_time);
    if (closeMins <= startMins) closeMins += 24 * 60; // overnight fix
    let cur = startMins;
    while (cur + slot_duration <= closeMins) {
        slots.push(toHHMM(cur));
        cur += slot_duration;
    }
    return slots;
};

/**
 * Generate slots for ALL active groups in a config.
 * Returns each group with slots as OBJECTS { slot_start, slot_end }
 * so the frontend can always do s.slot_start / s.slot_end consistently.
 */
const generateGroupedSlots = (slot_groups) => {
    return slot_groups
        .filter((g) => g.is_active)
        .map((g) => {
            const rawSlots = generateSlots(g.open_time, g.close_time, g.slot_duration);
            return {
                group_id: g._id.toString(),
                name: g.name,
                color: g.color || null,
                slot_duration: g.slot_duration,
                max_slots_per_booking: g.max_slots_per_booking,
                open_time: g.open_time,
                close_time: g.close_time,
                slots: rawSlots.map((start) => ({
                    slot_start: start,
                    slot_end: slotEnd(start, g.slot_duration),
                })),
            };
        });
};

const slotEnd = (slot_start, slot_duration) =>
    toHHMM(toMinutes(slot_start) + slot_duration);

const slotRangeLabel = (slots, slot_duration) => {
    if (!slots || !slots.length) return "";
    return `${slots[0]} – ${slotEnd(slots[slots.length - 1], slot_duration)}`;
};

/**
 * Validate requested slots against a specific group's slot grid.
 */
const validateSlots = (requestedSlots, allSlots, slot_duration, max_slots_per_booking) => {
    if (!requestedSlots || requestedSlots.length === 0)
        return "Please select at least one time slot.";
    if (requestedSlots.length > max_slots_per_booking)
        return `Maximum ${max_slots_per_booking} slots (${max_slots_per_booking * slot_duration} min).`;

    const slotIndex = {};
    allSlots.forEach((s, i) => { slotIndex[s] = i; });

    for (const s of requestedSlots) {
        if (slotIndex[s] === undefined) return `Slot "${s}" is not valid for this period.`;
    }

    const sortedByIndex = [...requestedSlots].sort((a, b) => slotIndex[a] - slotIndex[b]);
    for (let i = 1; i < sortedByIndex.length; i++) {
        if (slotIndex[sortedByIndex[i]] !== slotIndex[sortedByIndex[i - 1]] + 1)
            return "Selected slots must be consecutive.";
    }
    return null;
};

const isOpenDay = (dateStr, open_days) => {
    const day = new Date(dateStr + "T00:00:00").getDay();
    return open_days.includes(day);
};

const isBlocked = (dateStr, slotStart, groupId, blocked_slots = []) =>
    blocked_slots.some(
        (b) => b.date === dateStr && b.slot_start === slotStart &&
            (!b.group_id || b.group_id.toString() === groupId.toString())
    );

const isSlotPast = (calendarDate, slot_start, slot_duration, open_time, close_time) => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    if (calendarDate !== todayStr) return false;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const slotMins = toMinutes(slot_start);
    if (isOvernight(open_time, close_time) && slotMins < toMinutes(close_time)) {
        return nowMins > slotMins + slot_duration;
    }
    return nowMins >= slotMins + slot_duration;
};

/** Predefined suggestions shown in the UI */
const SLOT_GROUP_PRESETS = [
    { name: "Breakfast", open_time: "07:00", close_time: "11:00", slot_duration: 30, color: "#f59e0b" },
    { name: "Brunch", open_time: "10:00", close_time: "14:00", slot_duration: 30, color: "#84cc16" },
    { name: "Lunch", open_time: "12:00", close_time: "15:00", slot_duration: 30, color: "#06b6d4" },
    { name: "Afternoon", open_time: "15:00", close_time: "18:00", slot_duration: 30, color: "#8b5cf6" },
    { name: "Dinner", open_time: "18:00", close_time: "22:00", slot_duration: 30, color: "#ef4444" },
    { name: "Late Night", open_time: "22:00", close_time: "02:00", slot_duration: 30, color: "#1e293b" },
];

module.exports = {
    toMinutes, toHHMM, isOvernight,
    generateSlots, generateGroupedSlots,
    slotEnd, slotRangeLabel,
    validateSlots, isOpenDay, isBlocked, isSlotPast,
    SLOT_GROUP_PRESETS,
};