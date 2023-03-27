const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Project = require("../models/Project");

// @route
// @desc Test tạo project mới
// @access
router.get("/", async (req, res) => {
  try {
    const user = await User.findById("64106a4a65047e0dff8ecc81");

    const project = new Project({
      name: "Project 1",
      status: "Processing",
      users: [
        { user: user._id, role: "Leader" },
        { user: "64107e1b32d6bfed6a25ea54" },
      ],
    });
    await project.save();
    res.json(project);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
