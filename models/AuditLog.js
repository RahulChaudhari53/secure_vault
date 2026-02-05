const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  email: { type: String, required: true },
  route: { type: String, required: true }, 
  method: { type: String, required: true }, 
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
