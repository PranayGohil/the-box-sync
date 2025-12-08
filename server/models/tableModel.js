const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addTable = new Schema({
  area: {
    type: String,
  },
  tables: [
    {
      table_no: {
        type: String,
      },
      max_person: {
        type: Number,
      },
      current_status: {
        type: String,
        default: "Empty",
      },
      order_id: {
        type: String,
        default: null,
      },
    },
  ],
  user_id: {
    type: String,
  },
});

// One doc per (user, area)
addTable.index({ user_id: 1, area: 1 });

// Speed up checkTable
addTable.index({ user_id: 1, area: 1, "tables.table_no": 1 });

// Optional: quicker lookup for embedded table _id per user
addTable.index({ user_id: 1, "tables._id": 1 });


const Table = mongoose.model("tableDetails", addTable);
module.exports = Table;
