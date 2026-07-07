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
    addresses: [
        {
            address: {
                type: String,
            },
            exact_location: {
                type: String,
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            country: {
                type: String,
            },
            pincode: {
                type: String,
            },
            tag: {
                type: String,
                default: "Home",
            },
            place_id: {
                type: String,
            },
            formatted_address: {
                type: String,
            },
            latitude: {
                type: Number,
            },
            longitude: {
                type: Number,
            },
            city: {
                type: String,
            },
            state: {
                type: String,
            },
            country: {
                type: String,
            },
            postal_code: {
                type: String,
            },
            locality: {
                type: String,
            },
            sublocality: {
                type: String,
            },
            location: {
                type: { type: String, default: "Point" },
                coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
            },
            is_default: {
                type: Boolean,
                default: false,
            },
        }
    ],
    cart: [
        {
            dish_id: {
                type: mongoose.Schema.Types.ObjectId,
            },
            quantity: {
                type: Number,
                default: 1,
            }
        }
    ],
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
}, { timestamps: true });

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

// Unique index: one customer record per email per restaurant
webCustomerSchema.index({ email: 1, restaurant_code: 1 }, { unique: true, sparse: true });

const WebCustomer = mongoose.model("web-customer", webCustomerSchema);
module.exports = WebCustomer;