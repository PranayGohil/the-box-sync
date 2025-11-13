const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    receiver: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
    }, 
    actor: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
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
