const mongoose = require("mongoose");

const foodQuantityConfigSchema = new mongoose.Schema(
  {
    ricePerStudentKg: {
      type: Number,
      required: true,
      default: 0.25,
    },
    dalPerStudentL: {
      type: Number,
      required: true,
      default: 0.2,
    },
    sabjiPerStudentKg: {
      type: Number,
      required: true,
      default: 0.2,
    },
    rotiPerStudentCount: {
      type: Number,
      required: true,
      default: 2,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "FoodQuantityConfig",
  foodQuantityConfigSchema
);

