const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["teacher", "parent"],
      default: "teacher"
    },
    phone: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
