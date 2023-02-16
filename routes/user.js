const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.get("/users", async (req, res) => {
  // const newUser = await new User({
  //   email: "c@gmail.com",
  //   password: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  // });
  // await newUser.save();

  // const deleteUser = await User.deleteMany({ email: "a@gmail.com" });

  const user = await User.find();
  console.log(user.length);
  res.send(user);
});

router.put("/users/:_id", async (req, res) => {
  await User.findOneAndUpdate(
    { _id: "63ee53447da46ea83e0c1f52" },
    { first_name: "John", last_name: "Cena" }
  );
});

module.exports = router;
