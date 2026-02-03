const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
    },
    weekday: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      lowercase: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
    items: [
      {
        name: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", menuSchema);

