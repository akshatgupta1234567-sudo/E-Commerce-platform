const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    verified: {
        type: Boolean,
        default: false
    },
    verificationOtpHash: {
        type: String,
        default: null,
    },
    verificationOtpExpiresAt: {
        type: Date,
        default: null,
    },
    verificationOtpSentAt: {
        type: Date,
        default: null,
    },
    verificationOtpAttempts: {
        type: Number,
        default: 0,
    },
});

module.exports = mongoose.model('User', userSchema);