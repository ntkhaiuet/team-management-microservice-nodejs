const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.get("/user", async (req, res) => {
  // dataUser.forEach(async function (user) {
  //   await User.collection.insertOne(user);
  // });

  const user = await User.find();

  res.send(user);
});

module.exports = router;
