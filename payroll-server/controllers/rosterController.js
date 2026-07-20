const Roster = require("../models/rosterModel");

// Get roster data for a date range (list of dates in DD/MM/YYYY)
exports.getRoster = async (req, res) => {
  try {
    const { dates } = req.body; // Expect an array of date strings in DD/MM/YYYY format
    
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ success: false, message: "Please provide an array of dates." });
    }

    const rosters = await Roster.find({ date: { $in: dates } });

    // Structure it as { staffId: { 'DD/MM/YYYY': shiftId | 'off' } }
    const rosterData = {};
    rosters.forEach(r => {
      if (!rosterData[r.staff_id]) {
        rosterData[r.staff_id] = {};
      }
      rosterData[r.staff_id][r.date] = r.is_off ? 'off' : (r.shift_id ? r.shift_id.toString() : 'off');
    });

    res.status(200).json({
      success: true,
      data: rosterData
    });
  } catch (error) {
    console.error("Error fetching roster:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Bulk save roster assignments
exports.bulkSaveRoster = async (req, res) => {
  try {
    const { rosterData } = req.body;
    if (!rosterData) {
      return res.status(400).json({ success: false, message: "No roster data provided." });
    }

    // rosterData is expected to be { staffId: { 'DD/MM/YYYY': shiftId } }
    const bulkOps = [];

    for (const staffId in rosterData) {
      for (const date in rosterData[staffId]) {
        const shiftVal = rosterData[staffId][date];
        const isOff = shiftVal === 'off';
        const shiftId = isOff ? null : shiftVal;

        bulkOps.push({
          updateOne: {
            filter: { staff_id: staffId, date: date },
            update: {
              $set: {
                staff_id: staffId,
                date: date,
                shift_id: shiftId,
                is_off: isOff
              }
            },
            upsert: true
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Roster.bulkWrite(bulkOps);
    }

    res.status(200).json({
      success: true,
      message: "Roster saved successfully!"
    });

  } catch (error) {
    console.error("Error saving roster:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
