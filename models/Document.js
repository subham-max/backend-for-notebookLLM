const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  filename: { type: String, required: true },
  filepath: { type: String, required: true }, // NEW: Store PDF path
  text: { type: String, required: true },
  pages: [{
    pageNumber: Number,
    text: String,
    citations: [{ type: Number }]
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);