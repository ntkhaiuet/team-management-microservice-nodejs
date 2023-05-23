const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const ReviewSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    member: {
      full_name: { type: String },
      email: { type: String },
    },
    reviewer: {
      full_name: { type: String },
      email: { type: String },
    },
    review: { type: String, required: true },
    score: { type: Number, default: null },
    lastModifiedAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Review", ReviewSchema);
