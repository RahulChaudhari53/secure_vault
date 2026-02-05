const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    required: true,
    index: true // Fast lookup for all comments on a specific note
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Comment cannot be empty'] // Encrypted Hex String
  },
  iv: {
    type: String,
    required: true // IV for this specific comment
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
