const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Schema = mongoose.Schema;
const customerSchema = new Schema({
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
    id_proof: {
        type: String
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
    user_id: {
        type: String,
    },
    loyalty_points: {
        type: Number,
        default: 0,
    },
    total_spend: {
        type: Number,
        default: 0,
    },
    visit_count: {
        type: Number,
        default: 0,
    },
    last_visit_date: {
        type: Date,
    },
    order_preferences: {
        type: [String],
        default: [],
    }
});

customerSchema.pre("save", async function (next) {
    const user = this;
    if (!user.isModified("password") || !user.password) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        return next();
    } catch (error) {
        return next(error);
    }
});

customerSchema.methods.generateAuthToken = async function (role) {
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

const Customer = mongoose.model("customer", customerSchema);
module.exports = Customer