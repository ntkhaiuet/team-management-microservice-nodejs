const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const TaskSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    stage: { type: String, required: true },
    title: { type: String, required: true },
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
        user: {
          id: { type: Schema.Types.ObjectId },
          email: { type: String },
          full_name: { type: String },
        },
      },
    ],
    createdAt: { type: String, default: formattedDate },
    order: { type: Number, required: true },
    percentOfStage: {
      weight: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
    },
    progress: { type: Number, default: 0 },
    commentUsers: [
      { 
        userId: {type: Schema.Types.ObjectId, ref: "User" },
        type: {type:String, enum:["Assign", "Comment"], default: "Comment"},
        commentAt: { type: Number, default: Date.now() }
      },
    ]
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Task", TaskSchema);
