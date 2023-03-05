const express = require("express");
const mongoose = require("mongoose");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
require("dotenv").config();

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");

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
app.use(express.json());
app.use(cors());

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User API",
      version: "1.0.0",
      description:
        "User API documentation. PUT /api/user/{_id} cần có accessToken. accessToken nhận được khi đăng ký hoặc đăng nhập. Ở client thêm Authorization: Bearer {accessToken} vào header",
    },
    servers: [
      {
        url: `http://${process.env.SERVER}`,
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, options));

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}/api-docs`);
});
