const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");
const onlyDate = require("../middleware/onlyDate");

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["Processing", "Completed"],
    },
    duedate: { type: String, default: null },
    plan: {
      topic: { type: String },
      target: { type: String },
      timeline: [
        {
          _id: { type: false },
          stage: { type: String },
          note: { type: String },
          deadline: { type: String },
          percentOfProject: {
            weight: { type: Number, default: 0 },
            percent: { type: Number, default: 0 },
          },
          progress: { type: Number, default: 0 },
        },
      ],
      createdAt: { type: String, default: onlyDate },
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
    progress: { type: Number, default: 0 },
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);
