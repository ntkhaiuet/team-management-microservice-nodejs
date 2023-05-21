const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const formattedDate = require("../middleware/formatDate");

const ForlderSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    parentFolder: { type: Schema.Types.ObjectId, ref: "Folder", default: null },
    name: { type: String, required: true },
    path: { type: String, required: true },
    depth: { type: Number, default: 1},
    items: [{
      id: {type: Schema.Types.ObjectId},
      url : { type: String, required: true },
      author : { type: String, required: true },
      createdAt : {type: String, default: formattedDate}
    }],
    createdAt: { type: String, default: formattedDate },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Folder", ForlderSchema);
