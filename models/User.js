const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    full_name: { type: String, required: true },
    dob: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email_verified_at: { type: String, default: null },
    phone_number: { type: String, default: null },
    gender: { type: String, default: null },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("User", UserSchema);
