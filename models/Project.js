const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ["Processing", "Completed"],
      default: "Processing",
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
    createdAt: { type: Date, default: Date.now() },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Project", ProjectSchema);
