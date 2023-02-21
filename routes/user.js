const express = require("express");
const router = express.Router();

const User = require("../models/User");

router.get("/users", async (req, res) => {
  // const newUser = await new User({
  //   full_name: "John Cena",
  //   dob: "31/10/2001",
  //   email: "johncena@gmail.com",
  //   password: "aksjgghs",
  //   phone_number: "0123456789",
  //   gender: "Male",
  // });
  // await newUser.save();

  // const deleteUser = await User.deleteMany({ email: "c@gmail.com" });

  const user = await User.find();
  console.log(user.length);
  res.send(user);
});

router.get("/users/:_id", async (req, res) => {
  const user = await User.findOne({ _id: "63f473fb60e4ab7df9f4112a" });
  res.send(user);
});

router.put("/users/:_id", async (req, res) => {
  const random = Math.floor(Math.random() * 10);
  await User.findOneAndUpdate(
    { _id: "63f473fb60e4ab7df9f4112a" },
    { first_name: "John" + random, last_name: "Cena" }
  );
  res.json({ success: true });
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
