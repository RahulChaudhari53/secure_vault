const express = require("express");
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  updateProfile,
  changePassword,
  getStats,
  updateAvatar,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const validateFile = require("../middleware/validateFile");
const verifyRecaptcha = require("../middleware/recaptcha");

// All Auth routes are POST only to prevent Verb Tampering
router.post("/register", verifyRecaptcha, register);
router.post("/login", verifyRecaptcha, login);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", protect, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);

// Session Persistence Route (GET)
router.get("/me", protect, getMe);

// Profile Management Routes
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/profile/avatar", protect, upload.single("avatar"), validateFile, updateAvatar);
router.get("/stats", protect, getStats);

// Fallback for unauthorized methods
router.all(["/register", "/login", "/verify-otp", "/me", "/profile", "/change-password", "/stats", "/profile/avatar", "/logout", "/forgot-password", "/verify-reset-otp", "/reset-password"], (req, res) => {
  res
    .status(405)
    .json({ message: "Method Not Allowed" });
});

module.exports = router;
