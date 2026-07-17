const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    },
    sender: {
        type: String, required: true
    },
    receiver: {
        type: String, required: true
    },
    type: {
        type: String, required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed
    },
    read: {
        type: Boolean, default: false
    },
    createdAt: {
        type: Date, default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
