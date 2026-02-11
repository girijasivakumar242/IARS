const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    rollNo: {
      type: String,
      required: true
    },

    attendance: {
      type: Number,
      required: true
    },

    internalMarks: {
      type: Number,
      required: true
    },

    cgpa: {
      type: Number,
      required: true
    },

    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"]
    },

    suggestion: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
