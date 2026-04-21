const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);

