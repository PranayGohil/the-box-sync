const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;
const webCustomerSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    phone: {
        type: String,
    },
    password: {
        type: String,
    },
    address: {
        type: String,
    },
    date_of_birth: {
        type: Date,
    },
    anniversary: {
        type: Date,
    },
    tag: {
        type: Array,
    },
    restaurant_code: {
        type: String,
    },
});

webCustomerSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password")) {
        next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

webCustomerSchema.methods.generateAuthToken = async function (role) {
    try {
        const user = this;
        const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRETKEY,
            { expiresIn: "30d" }
        );
        return token;
    } catch (error) { }
};

const WebCustomer = mongoose.model("web-customer", webCustomerSchema);
module.exports = WebCustomer;