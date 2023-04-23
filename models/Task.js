const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

// const CommentSchema = new Schema(
//   {
//     content: { type: String, required: true },
//     author: { type: String, required: true },
//     createdAt: { type: String, default: formattedDate },
//   },
//   {
//     versionKey: false,
//   }
// );

// comments: [CommentSchema],

const TaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    project: { type: String, required: true },
    description: { type: String },
    creator: { type: String, required: true },
    assign: { type: String, required: true },
    duedate: { type: String, required: true },
    estimate: { type: String, required: true },
    spend: { type: String },
    status: { type: String, enum: ["Todo", "Doing", "Review", "Done"] },
    tags: [{ type: String }],
    updates: [
      {
        _id: { type: false },
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
