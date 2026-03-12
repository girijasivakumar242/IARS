const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    phone: {
      type: String,
      default: null
    },
    children: [
      {
        studentRegNo: {
          type: String,
          required: true
        },
        studentName: {
          type: String,
          required: true
        },
        studentEmail: {
          type: String,
          default: null
        }
      }
    ],
    verificationCode: {
      type: String,
      default: null
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Parent", parentSchema);
