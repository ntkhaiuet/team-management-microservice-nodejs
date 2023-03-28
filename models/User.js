const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    full_name: { type: String, required: true },
    dob: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email_verified: { type: Boolean, default: false },
    phone_number: { type: String, default: null },
    gender: { type: String, default: null },
    token: { type: String, default: null },
    projects: [
      {
        project: { type: Schema.Types.ObjectId, ref: "Project" },
        role: {
          type: String,
          enum: ["Leader", "Reviewer", "Member"],
          default: "Member",
        },
      },
    ],
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("User", UserSchema);
