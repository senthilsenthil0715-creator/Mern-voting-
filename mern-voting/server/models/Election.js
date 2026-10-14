const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  party: { type: String, trim: true, maxlength: 60, default: '' },
  description: { type: String, trim: true, maxlength: 300, default: '' },
});

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    candidates: {
      type: [candidateSchema],
      validate: [(v) => v.length >= 2 && v.length <= 10, 'An election needs 2 to 10 candidates'],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Election', electionSchema);
