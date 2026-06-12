require("dotenv").config();
const mongoose = require("mongoose");
const Staff = require("./models/staffModel");

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("DB connected.");
    const staffMembers = await Staff.find({ password: { $exists: true, $ne: "" } }).select("+password").lean();
    console.log("Staff members with passwords:", staffMembers.length);
    staffMembers.forEach(s => {
      let pwd = s.password;
      if (pwd) {
        try {
          if (!pwd.startsWith("$2a$") && !pwd.startsWith("$2b$")) {
            pwd = Staff.decrypt(pwd);
          }
        } catch (e) {
          pwd = "(decrypt error) " + pwd;
        }
      }
      console.log(`Email: ${s.email} | Name: ${s.f_name} ${s.l_name} | Password: ${pwd}`);
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("DB disconnected.");
  }
}

test();
