const express = require("express");
const router = express.Router();
require("dotenv").config();

const User = require("../models/User");

// GET /api/users
// Lấy thông tin của tất cả người dùng (để test)
router.get("/users", async (req, res) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// GET /api/users/:_id
// Lấy thông tin của người dùng có _id
router.get("/users/:_id", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      res.status(400).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// PUT /api/users/:id
// Cập nhật thông tin của người dùng có _id
router.put("/users/:_id", async (req, res) => {
  const { full_name, dob, email, phone_number, gender } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params._id,
      {
        full_name,
        dob,
        email,
        phone_number,
        gender,
      },
      { new: true }
    );
    if (!user) {
      res.status(400).json({ success: false, message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get("/usersdb", async (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Collection User Info</title> 
      <style>
        table {
          border:1px solid #b3adad;
          border-collapse:collapse;
          padding:5px;
        }
        table th {
          border:1px solid #b3adad;
          padding:5px;
          background: #f0f0f0;
          color: #313030;
        }
        table td {
          border:1px solid #b3adad;
          text-align:center;
          padding:5px;
          background: #ffffff;
          color: #313030;
        }
      </style>
    </head>
    <body>
      <p>Lấy thông tin của tất cả người dùng (để test): GET: <a target= "_blank" href="http://${process.env.SERVER}/api/users">http://${process.env.SERVER}/api/users</a></p>
      <p>Lấy thông tin của người dùng có _id: GET: <a target= "_blank" href="http://${process.env.SERVER}/api/users/63f473fb60e4ab7df9f4112a">http://${process.env.SERVER}/api/users/63f473fb60e4ab7df9f4112a</a></p>
      <p>Cập nhật thông tin của người dùng có _id: PUT: <a target= "_blank" href="http://${process.env.SERVER}/api/users/63f473fb60e4ab7df9f4112a">http://${process.env.SERVER}/api/users/63f473fb60e4ab7df9f4112a</a>, data từ client: const { full_name, dob, email, phone_number, gender } = req.body, return: thông tin người dùng sau khi cập nhật;
      </p>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Type</th>
            <th>Required</th>
            <th>Default</th>
            <th>Unique</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&nbsp;full_name</td>
            <td>String&nbsp;<br></td>
            <td><span style="font-style: normal; font-weight: 400;">true&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;dob</td>
            <td><span style="font-style: normal; font-weight: 400;">String&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>null&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;email</td>
            <td><span style="font-style: normal; font-weight: 400;">String&nbsp;</span><br></td>
            <td><span style="font-style: normal; font-weight: 400;">true&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td><span style="font-style: normal; font-weight: 400;">true&nbsp;</span>&nbsp;</td>
          </tr>
          <tr>
            <td>password&nbsp;</td>
            <td>String&nbsp;<span style="font-style: normal; font-weight: 400;"><br></span></td>
            <td><span style="font-style: normal; font-weight: 400;">true&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;email_verified_at</td>
            <td><span style="font-style: normal; font-weight: 400;">String&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>&nbsp;null&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;phone_number</td>
            <td><span style="font-style: normal; font-weight: 400;">String&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>&nbsp;null&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
          <tr>
            <td>&nbsp;gender</td>
            <td><span style="font-style: normal; font-weight: 400;">String&nbsp;</span><br></td>
            <td>&nbsp;</td>
            <td>&nbsp;null&nbsp;</td>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `);
});

module.exports = router;
