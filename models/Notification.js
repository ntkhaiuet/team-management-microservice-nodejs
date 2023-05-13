const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const NotificationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    taskId: { type: Schema.Types.ObjectId, ref: "Task" },
    content: { type: String, required: true },
    status: { type: String, enum: ["Read", "Unread"], default: "Unread" },
    type: { type: String, enum: ["Assign", "Other"], default: "Other" },
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
