// models/ConnectionLog.js
const mongoose = require('mongoose');

const connectionLogSchema = new mongoose.Schema({
  clientId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['connect', 'disconnect', 'join'],
    required: true
  },
  room: {
    type: String,
    enum: ['admin', 'staff', 'kitchen'],
    required: function() {
      return this.type === 'join';
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Optional additional data
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  userAgent: String
});

// Index for faster queries
connectionLogSchema.index({ timestamp: -1 });
connectionLogSchema.index({ clientId: 1 });
connectionLogSchema.index({ type: 1 });

module.exports = mongoose.model('ConnectionLog', connectionLogSchema);