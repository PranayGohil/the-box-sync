require("dotenv").config();
const mongoose = require("mongoose");
const Staff = require("../models/staffModel");

mongoose.connect(process.env.MONGODB_URI);

// 24-hour time generator
function randomTime(startHour, endHour) {
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Night shift helpers
function randomNightInTime() {
  // 18:00 – 22:59
  return randomTime(18, 23);
}

function randomNightOutTime() {
  // 02:00 – 08:59 (next day)
  return randomTime(2, 9);
}

function getPastDates(daysBack = 60) {
  const dates = [];
  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString());
  }
  return dates;
}

async function generateFakeAttendance(staffId, records = 30, daysBack = 60) {
  const staff = await Staff.findById(staffId);
  if (!staff) {
    console.log("❌ Staff not found");
    return;
  }

  const existingDates = new Set(
    staff.attandance.map((a) => new Date(a.date).toDateString()),
  );

  const allDates = getPastDates(daysBack).filter((d) => {
    return !existingDates.has(new Date(d).toDateString());
  });

  if (allDates.length === 0) {
    console.log("⚠️ No available dates to insert");
    return;
  }

  allDates.sort(() => Math.random() - 0.5);

  const selectedDates = allDates.slice(0, Math.min(records, allDates.length));

  const NIGHT_SHIFT_PROBABILITY = 0.25; // 25% night shifts

  const attendance = selectedDates.map((date) => {
    const status = Math.random() > 0.2 ? "present" : "absent";

    if (status === "absent") {
      return {
        date: date.split("T")[0],
        status,
        in_time: null,
        out_time: null,
      };
    }

    const isNightShift = Math.random() < NIGHT_SHIFT_PROBABILITY;

    return {
      date: date.split("T")[0],
      status,
      in_time: isNightShift ? randomNightInTime() : randomTime(8, 11),
      out_time: isNightShift ? randomNightOutTime() : randomTime(17, 22),
    };
  });

  await Staff.updateOne(
    { _id: staff._id },
    { $push: { attandance: { $each: attendance } } },
  );

  console.log(
    `✅ Added ${attendance.length} attendance records (with night shifts)`,
  );
}

generateFakeAttendance("6937f8c3f45bc0d16bde5236", 45, 60).then(() =>
  mongoose.disconnect(),
);
