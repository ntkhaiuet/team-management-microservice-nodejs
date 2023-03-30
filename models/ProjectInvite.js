const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const ProjectInviteSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, require: true },
    users: [
      {
        email: { type: String, unique: true },
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

module.exports = mongoose.model("ProjectInvite", ProjectInviteSchema);
