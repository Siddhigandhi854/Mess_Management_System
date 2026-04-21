const mongoose = require("mongoose");

const mealTimingSchema = new mongoose.Schema(
  {
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
      unique: true,
    },
    cutoffTime: {
      type: String, // Format: "HH:mm"
      required: true,
    },
    mealStartTime: {
      type: String, // Format: "HH:mm"
      required: true,
    },
    mealEndTime: {
      type: String, // Format: "HH:mm"
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MealTiming", mealTimingSchema);
