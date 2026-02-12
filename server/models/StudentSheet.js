const mongoose = require("mongoose");

const studentSheetSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    fileName: String,
    filePath: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentSheet", studentSheetSchema);
