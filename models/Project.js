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
      default: "Processing",
    },
    plan: {
      topic: { type: String },
      target: { type: String },
      timeline: [
        {
          stage: { type: String, unique: true },
          note: { type: String },
          deadline: { type: String },
        },
      ],
    },
    users: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["Leader", "Reviewer", "Member"],
          default: "Member",
        },
      },
    ],
    invite: [
      {
        email: { type: String },
        role: {
          type: String,
          enum: ["Leader", "Reviewer", "Member"],
          default: "Member",
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
