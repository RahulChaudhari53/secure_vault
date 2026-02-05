const User = require("../models/User");
const Note = require("../models/Note");
const AuditLog = require("../models/AuditLog");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    // const { name, email, password } = req.body;
    const name = String(req.body.name);
    const email = String(req.body.email);
    const password = String(req.body.password);

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Regex: At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char (any symbol)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log(
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      );
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    await AuditLog.create({
      action: "USER_REGISTERED",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
      details: `New account created for ${name}`,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: "Server Error during registration",
      error: error.message,
    });
  }
};

// @desc    Login Phase 1: Verify Credentials & Send OTP
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const email = String(req.body.email);
    const password = String(req.body.password);

    const user = await User.findOne({ email });
    if (!user) {
      await AuditLog.create({
        action: "AUTH_FAILURE",
        email,
        route: req.originalUrl,
        method: req.method,
        details: "User not found",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check for Account Lockout (Brute Force Protection)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res
        .status(423)
        .json({ message: "Account locked. Try again later." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
      }
      await user.save();
      await AuditLog.create({
        action: "AUTH_FAILURE",
        email: user.email,
        route: req.originalUrl,
        method: req.method,
        details: "Wrong password",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.loginAttempts = 0;

    // Generate 6-digit OTP (MFA)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otpCode = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 Min Expiry
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Your Secure Vault OTP",
      message: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
    });

    await AuditLog.create({
      action: "MFA_SENT",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
      details: "OTP sent to registered email", 
    });

    res.status(200).json({ message: "OTP sent to registered email" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// @desc    Login Phase 2: Verify OTP & Issue Session JWT
// @route   POST /api/auth/verify-otp
exports.verifyOTP = async (req, res) => {
  try {
    const email = String(req.body.email);
    const otp = String(req.body.otp);

    const user = await User.findOne({ email });

    // Verify expiration first (check db field)
    if (!user || user.otpExpires < Date.now()) {
       await AuditLog.create({
        action: "MFA_FAILURE",
        email,
        route: req.originalUrl,
        method: req.method,
        details: "User not found or OTP expired"
      });
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Verify Hash
    const isMatch = await bcrypt.compare(otp, user.otpCode);
    if (!isMatch) {
      await AuditLog.create({
        action: "MFA_FAILURE",
        email,
        route: req.originalUrl,
        method: req.method
      });
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    const jti = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        jti: jti,
        version: user.tokenVersion 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: "7d",
        algorithm: 'HS256' 
      },
    );

    // Set Secure HttpOnly Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await AuditLog.create({
      action: "SESSION_STARTED",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
    });

    res.status(200).json({ message: "Access Granted", role: user.role });
  } catch (error) {}
};

// @desc    Resend OTP with Rate Limiting
// @route   POST /api/auth/resend-otp
exports.resendOTP = async (req, res) => {
  try {
    const email = String(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(200)
        .json({ message: "If an account exists, a new code has been sent." });
    }

    const cooldown = 60 * 1000;
    // Logic: If (Expire Time - Now) > (10 mins - 1 min), it means < 1 min has passed since creation
    if (
      user.otpExpires &&
      user.otpExpires - Date.now() > 10 * 60 * 1000 - cooldown
    ) {
      return res
        .status(429)
        .json({ message: "Please wait before requesting a new code." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    user.otpCode = otpHash;
    user.otpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Your New Secure Vault OTP",
      message: `Your new verification code is: ${otp}.`,
    });

    await AuditLog.create({
      action: "MFA_RESEND",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
      details: "New OTP requested",
    });

    res.status(200).json({ message: "New OTP sent." });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Error resending OTP" });
  }
};

// @desc    Get Current User (Session Persistence)
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otpCode -otpExpires",
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update Profile (Name, Email, Avatar)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, avatarUrl } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.avatarUrl = avatarUrl !== undefined ? avatarUrl : user.avatarUrl;

      if (email) {
        const normalizedEmail = email.toLowerCase();
        
        if (normalizedEmail !== user.email) {
          const userExists = await User.findOne({ email: normalizedEmail });
          if (userExists) {
            return res.status(400).json({ message: "Email already in use" });
          }
          user.email = normalizedEmail;
        }
      }

      const updatedUser = await user.save();

      await AuditLog.create({
        action: "PROFILE_UPDATED",
        email: user.email,
        route: req.originalUrl,
        method: req.method,
        details: "User updated profile details",
      });

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Change Password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      // Validate New Password Complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
        });
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      await AuditLog.create({
        action: "PASSWORD_CHANGED",
        email: user.email,
        route: req.originalUrl,
        method: req.method,
        details: "Password changed successfully",
      });

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Invalid current password" });
      
      await AuditLog.create({
        action: "PASSWORD_CHANGE_FAILED",
        email: user ? user.email : "unknown",
        route: req.originalUrl,
        method: req.method,
        details: "Invalid Verification",
      });
    }
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update User Avatar
// @route   PUT /api/auth/profile/avatar
// @access  Private
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);

    if (user) {
      if (user.avatarUrl) {
        const oldPath = path.join(__dirname, "..", user.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlink(oldPath, (err) => {
            if (err) console.error("Failed to delete old avatar:", err);
          });
        }
      }

      // Save relative path (e.g., uploads/avatars/filename.jpg)
      const relativePath = `uploads/avatars/${req.file.filename}`;
      user.avatarUrl = relativePath;

      await user.save();

      await AuditLog.create({
        action: "AVATAR_UPDATED",
        email: user.email,
        route: req.originalUrl,
        method: req.method,
        details: `User updated avatar: ${relativePath}`,
      });

      res.json({ avatarUrl: user.avatarUrl });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Avatar Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get Account Statistics
// @route   GET /api/auth/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalNotes = await Note.countDocuments({
      user: userId,
      status: "active",
    });
    
    const sharedNotes = await Note.countDocuments({
        user: userId,
        status: "active",
        sharedWith: { $not: { $size: 0 } } 
    });

    const tagsUsed = await Note.distinct("tags", { user: userId });

    res.json({
      totalNotes,
      sharedNotes,
      tagsCount: tagsUsed.length,
    });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
// @desc    Logout User / Clear Cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    if (req.user) {
        // Increment version to invalidate all active tokens for this user
        await User.findByIdAndUpdate(req.user.id, { $inc: { tokenVersion: 1 } });
    }

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Set expiration to the past
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({ message: "Logged out and session revoked" });
  } catch (error) {
      console.error("Logout Error:", error);
      res.status(500).json({ message: "Logout failed" });
  }
};

// @desc    Phase A: Request Password Reset (Send OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email);
    const user = await User.findOne({ email });

    if (!user) {
      // Fake delay to mimic processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      return res.status(200).json({ message: "If an account exists, a reset code has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    user.resetOtp = otpHash;
    user.resetOtpExpires = Date.now() + 10 * 60 * 1000; 
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message: `Your password reset code is: ${otp}. It will expire in 10 minutes.`,
    });

    await AuditLog.create({
      action: "PASSWORD_RESET_REQUESTED",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
      details: "Reset OTP sent",
    });

    res.status(200).json({ message: "If an account exists, a reset code has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Phase B: Verify Reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Find checking expiration only
    const user = await User.findOne({ 
      email, 
      resetOtpExpires: { $gt: Date.now() } 
    });

    if (!user) {
       await AuditLog.create({
        action: "PASSWORD_RESET_FAILURE",
        email,
        route: req.originalUrl,
        method: req.method,
        details: "User not found or expired code",
      });
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Compare provided OTP with stored Hash
    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      await AuditLog.create({
        action: "PASSWORD_RESET_FAILURE",
        email,
        route: req.originalUrl,
        method: req.method,
        details: "Invalid reset OTP",
      });
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const resetToken = jwt.sign(
      { id: user._id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ message: "Code verified", resetToken });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Phase C: Execute Reset
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    // Verify the reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired reset session" });
    }

    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: "Invalid token type" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    
    await user.save();

    await AuditLog.create({
      action: "PASSWORD_RESET_SUCCESS",
      email: user.email,
      route: req.originalUrl,
      method: req.method,
      details: "Password reset via OTP",
    });

    res.status(200).json({ message: "Password reset successfully. Please login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
