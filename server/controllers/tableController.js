const Table = require("../models/tableModel");

const getTables = async (req, res) => {
  try {
    const userId = req.user;

    const tables = await Table.find({ user_id: userId }).lean();

    res.json({ success: true, data: tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getTableDataById = async (req, res) => {
  try {
    const tableId = req.params.id;
    const userId = req.user;

    const doc = await Table.findOne(
      { user_id: userId, "tables._id": tableId },
      { area: 1, "tables.$": 1 } // only that table + area
    ).lean();

    if (!doc || !doc.tables || doc.tables.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }

    const table = doc.tables[0];
    const tableData = { ...table, area: doc.area };

    res.json({ success: true, data: tableData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getDiningAreas = async (req, res) => {
  try {
    const userId = req.user;
    const areas = await Table.distinct("area", { user_id: userId });

    res.json({ success: true, data: areas });
  } catch (error) {
    console.error("Error fetching dining areas:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const checkTable = async (req, res) => {
  try {
    const { area, table_no } = req.query;
    const userId = req.user;

    if (!area || !table_no) {
      return res
        .status(400)
        .json({ success: false, message: "area and table_no are required" });
    }

    const doc = await Table.findOne({
      user_id: userId,
      area,
      "tables.table_no": table_no,
    }).select("_id"); // only need existence

    res.json({ success: true, exists: !!doc });
  } catch (error) {
    console.error("Error checking table:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addTable = async (req, res) => {
  try {
    const userId = req.user;
    const { area, tables } = req.body;

    if (!area || !Array.isArray(tables) || tables.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "area and tables are required" });
    }

    const formattedTables = tables.map((t) => ({
      table_no: String(t.tableNo).trim(),
      max_person: parseInt(t.maxPerson, 10) || 0,
    }));

    // Optional: disallow duplicate table_no in the same payload
    const numbers = formattedTables.map((t) => t.table_no);
    const dup = numbers.find((n, i) => numbers.indexOf(n) !== i);
    if (dup) {
      return res.status(400).json({
        success: false,
        message: `Duplicate table number in request: ${dup}`,
      });
    }

    const existing = await Table.findOne({ user_id: userId, area });

    if (existing) {
      // Optionally avoid inserting duplicates vs existing tables too
      const existingNos = new Set(existing.tables.map((t) => t.table_no));
      const toInsert = formattedTables.filter(
        (t) => !existingNos.has(t.table_no)
      );

      if (toInsert.length === 0) {
        return res.json({
          success: true,
          message: "No new tables added (all already exist)",
          data: existing,
        });
      }

      const updated = await Table.findOneAndUpdate(
        { user_id: userId, area },
        { $push: { tables: { $each: toInsert } } },
        { new: true }
      );

      return res.json({
        success: true,
        message: "Tables added",
        data: updated,
      });
    } else {
      const doc = await Table.create({
        user_id: userId,
        area,
        tables: formattedTables,
      });
      return res.status(201).json({
        success: true,
        message: "Area created with tables",
        data: doc,
      });
    }
  } catch (error) {
    console.error("Error adding table:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const updateTable = async (req, res) => {
  try {
    const { _id, table_no, max_person } = req.body;
    const userId = req.user;

    if (!_id || !table_no) {
      return res
        .status(400)
        .json({ success: false, message: "_id and table_no are required" });
    }

    const result = await Table.updateOne(
      { user_id: userId, "tables._id": _id },
      {
        $set: {
          "tables.$.table_no": String(table_no).trim(),
          "tables.$.max_person": parseInt(max_person, 10) || 0,
        },
      }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table updated", result });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const userId = req.user;

    const tableDoc = await Table.findOne(
      { user_id: userId, "tables._id": tableId },
      { area: 1, tables: 1 }
    );

    if (!tableDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }

    const area = tableDoc.area;

    const result = await Table.updateOne(
      { user_id: userId, "tables._id": tableId },
      { $pull: { tables: { _id: tableId } } }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Table not found or already deleted",
        });
    }

    const updatedArea = await Table.findOne({
      user_id: userId,
      area,
    }).select("tables");

    if (updatedArea && updatedArea.tables.length === 0) {
      await Table.deleteOne({ user_id: userId, area });
    }

    res
      .status(200)
      .json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getTables,
  getTableDataById,
  getDiningAreas,
  checkTable,
  addTable,
  updateTable,
  deleteTable,
};
