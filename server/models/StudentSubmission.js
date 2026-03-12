const mongoose = require("mongoose");

const studentSubmissionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      default: null,
    },
    sessionCode: {
      type: String,
      required: true,
      trim: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    regNo: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: String,
      required: true,
      trim: true,
    },

    cgpa: {
      type: Number,
      required: true,
    },
    attendance: {
      type: Number,
      required: true,
    },
    internalMarks: {
      type: Number,
      required: true,
    },

    subjectGrades: {
      type: [
        {
          subjectName: String,
          grade: String,
        },
      ],
      default: [],
    },

    riskLevel: {
      type: String,
      default: "Pending",
    },

    suggestions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentSubmission", studentSubmissionSchema);