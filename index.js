const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

// Kết nối DB
const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://team:${process.env.PASSWORD}@teammanagement.nznugpk.mongodb.net/?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

connectDB();

const app = express();

const User = require("./models/User");
app.get("/api", async (req, res) => {
  const user = await User.findOne({ username: "Khai" });
  res.send(user);
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
