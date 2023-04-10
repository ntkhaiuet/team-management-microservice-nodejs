const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Processing", "Completed"],
    },
    plan: {
      topic: { type: String },
      target: { type: String },
      timeline: [
        {
          stage: { type: String },
          note: { type: String },
          deadline: { type: String },
        },
      ],
    },
    users: [
      {
        _id: { type: false },
        email: { type: String },
        role: {
          type: String,
          enum: ["Leader", "Reviewer", "Member"],
        },
      },
    ],
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);
