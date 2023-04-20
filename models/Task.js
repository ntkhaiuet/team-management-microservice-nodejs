const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

const TaskSchema = new Schema(
  {
    title: { type: String, required: true },
    project: { type: String, required: true },
    description: { type: String },
    creator: { type: String, required: true },
    assign: { type: String, required: true },
    duedate: { type: String, required: true },
    estimate: { type: String, required: true },
    spend: { type: String },
    status: { type: String, enum: ["Todo", "Doing", "Review", "Done"] },
    comments: [CommentSchema],
    tags: [{ type: String }],
    updates: [
      {
        timestamp: { type: String, default: formattedDate },
        content: { type: String },
      },
    ],
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Task", TaskSchema);
