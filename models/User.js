const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    email_verified_at: { type: String, default: null },
    password: { type: String, required: true },
    birthday: { type: String, default: null },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("User", UserSchema);
