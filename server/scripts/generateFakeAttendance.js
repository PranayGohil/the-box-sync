require("dotenv").config();
const mongoose = require("mongoose");
const Staff = require("../models/staffModel");

mongoose.connect(process.env.MONGODB_URI);

function randomTime(startHour, endHour) {
  const hour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
  const minute = Math.floor(Math.random() * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hr = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(hr).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
}

function getRandomPastDate(daysBack = 60) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack) - 1);
  return d.toISOString().split("T")[0];
}

async function generateFakeAttendance(staffId, records = 30) {
  const staff = await Staff.findOne({ staff_id: staffId });
  if (!staff) {
    console.log("❌ Staff not found");
    return;
  }

  // 🔹 Existing dates in DB
  const existingDates = new Set(
    staff.attandance.map(a => a.date)
  );

  const newAttendance = [];
  const usedDates = new Set();

  while (newAttendance.length < records) {
    const date = getRandomPastDate();

    // ❌ Skip if already exists in DB or this run
    if (existingDates.has(date) || usedDates.has(date)) continue;

    usedDates.add(date);

    const status = Math.random() > 0.2 ? "present" : "absent";

    newAttendance.push({
      date,
      status,
      in_time: status === "present" ? randomTime(8, 11) : "",
      out_time: status === "present" ? randomTime(17, 22) : "",
    });
  }

  await Staff.updateOne(
    { _id: staff._id },
    { $push: { attandance: { $each: newAttendance } } }
  );

  console.log(`✅ ${newAttendance.length} unique attendance records added`);
}

generateFakeAttendance("68948bcc5a51df0d5eb8eefe", 45)
  .then(() => mongoose.disconnect());
