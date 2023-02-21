const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

const userRouter = require("./routes/user");

// Kết nối DB
const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://team:${process.env.PASSWORD}@teammanagement.nznugpk.mongodb.net/?retryWrites=true&w=majority`,
      {
        dbName: "team_management",
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
app.use(bodyParser.json());

app.use("/api", userRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}/api/usersdb`);
});
