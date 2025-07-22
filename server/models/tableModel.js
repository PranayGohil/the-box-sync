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
  hotel_id: {
    type: String,
  },
});

const Table = mongoose.model("tableDetails", addTable);
module.exports = Table;
