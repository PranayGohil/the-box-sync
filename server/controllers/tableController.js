const Table = require("../models/tableModel");

const getTables = (req, res) => {
  try {
    Table.find({ user_id: req.user })
      .then((data) => {
        res.json({ data, success: true });
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getTableDataById = (req, res) => {
  try {
    const tableId = req.params.id;
    Table.findOne({ "tables._id": tableId })
      .then((data) => {
        const area = data.area;
        const table = data.tables.find((t) => t._id.toString() === tableId);
        const tableData = { ...table.toObject(), area };
        res.json(tableData);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getDiningAreas = async (req, res) => {
  try {
    const areas = await Table.find({ user_id: req.user }, "area"); // Fetch distinct areas
    const uniqueAreas = [...new Set(areas.map((item) => item.area))];
    res.json({ data: uniqueAreas, success: true });
  } catch (error) {
    console.error("Error fetching dining areas:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const checkTable = (req, res) => {
  try {
    console.log(req.query);
    const { area, table_no } = req.query;
    Table.findOne({ area, "tables.table_no": table_no, user_id: req.user })
      .then((data) => {
        console.log(data);
        if (data) {
          res.json({ exists: true });
        } else {
          res.json({ exists: false });
        }
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const addTable = (req, res) => {
  try {
    const { area, tables } = req.body;

    // Convert frontend keys to match schema
    const formattedTables = tables.map((t) => ({
      table_no: t.tableNo,
      max_person: parseInt(t.maxPerson),
    }));

    const tableData = {
      area,
      tables: formattedTables,
      user_id: req.user,
    };

    Table.findOne({ area, user_id: req.user }).then((data) => {
      if (data) {
        Table.findOneAndUpdate(
          { area, user_id: req.user },
          { $push: { tables: { $each: formattedTables } } },
          { new: true }
        )
          .then((data) => res.json(data))
          .catch((err) => res.json(err));
      } else {
        Table.create(tableData)
          .then((data) => res.json(data))
          .catch((err) => res.json(err));
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


const updateTable = (req, res) => {
  try {
    const { _id, table_no, max_person } = req.body;
    console.log(_id, table_no, max_person);
    Table.updateOne(
      { "tables._id": _id },
      { $set: { "tables.$.table_no": table_no, "tables.$.max_person": max_person } },
    )
      .then((data) => {
        console.log("Data", data);
        res.json(data)
      })
      .catch((err) => {
        console.log("Error : " + err);
        res.json(err)
      });
  } catch (error) {
    console.log(error);
  }
};

const deleteTable = async (req, res) => {
  try {
    const tableId = req.params.id;
    const tableData = await Table.findOne({ "tables._id": tableId });
    if (!tableData) {
      return res.status(404).json({ message: "Table not found" });
    } else {
      const area = tableData.area;
      const result = await Table.updateOne(
        { "tables._id": tableId },
        { $pull: { tables: { _id: tableId } } }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "Table not found" });
      }
      const updatedArea = await Table.findOne({ area, user_id: req.user });
      if (updatedArea.tables.length === 0) {
        await Table.deleteOne({ area });
      }
      res.status(200).json({ message: "Table deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ message: "Internal server error" });
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
