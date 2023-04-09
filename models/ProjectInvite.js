const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const ProjectInviteSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, require: true },
    users: [
      {
        _id: { type: false },
        email: { type: String, unique: true },
        role: {
          type: String,
          enum: ["Leader", "Reviewer", "Member"],
        },
        status: {
          type: String,
          enum: ["Joined", "Waiting"],
        },
      },
    ],
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("ProjectInvite", ProjectInviteSchema);
