const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    role: { type: String, enum: ['Viewer', 'Editor', 'Admin'], default: 'Editor' },
    
    // MFA / OTP Fields
    otpCode: { type: String }, 
    otpExpires: { type: Date },
    isMfaVerified: { type: Boolean, default: false },

    // Password Reset Fields
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },

    // Brute Force Protection
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number },

    // JWT Revocation
    tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);