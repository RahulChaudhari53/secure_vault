const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxLength: [100, 'Title cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Please add content'] // Stores the Encrypted Hex String
  },
  iv: {
    type: String,
    required: true // Stores the Initialization Vector (Hex)
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        if (v.length > 10) return false;
        return v.every(tag => tag.length <= 20);
      },
      message: 'You can have at most 10 tags, and each tag must be 20 characters or less.'
    }
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'trashed'],
    default: 'active',
    index: true 
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Note', noteSchema);
