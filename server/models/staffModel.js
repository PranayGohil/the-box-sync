const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const addStaff = new Schema({
  staff_id: {
    type: String,
  },
  f_name: {
    type: String,
  },
  l_name: {
    type: String,
  },
  birth_date: {
    type: String,
  },
  joining_date: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  state: {
    type: String,
  },
  city: {
    type: String,
  },
  phone_no: {
    type: Number,
  },
  email: {
    type: String,
  },
  position: {
    type: String,
  },
  salary: {
    type: Number,
  },
  photo: {
    type: String,
  },
  document_type: {
    type: String,
  },
  id_number: {
    type: String,
  },
  front_image: {
    type: String,
  },
  back_image: {
    type: String,
  },
  face_encoding: {
    type: [Number], 
    default: [],
  },
  face_embeddings: {
    type: [Number],
    default: [],
  },
  user_id: {
    type: String,
  },
  attandance: [
    {
      date: {
        type: String,
      },
      status: {
        type: String,
      },
      in_time: {
        type: String,
      },
      out_time: {
        type: String,
      },
    },
  ],
});

// positions per user
addStaff.index({ user_id: 1, position: 1 });

// quick lookup by email / staff_id if you ever need it
addStaff.index({ user_id: 1, email: 1 }, { sparse: true });
addStaff.index({ user_id: 1, staff_id: 1 }, { sparse: true });

// for face encodings query (mostly filter by user_id)
addStaff.index({ user_id: 1 });

const Staff = mongoose.model("staff", addStaff);
module.exports = Staff;
