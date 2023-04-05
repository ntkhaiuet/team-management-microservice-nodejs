const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const session = require("express-session");
const passport = require("passport");
const passportConfig = require("./middleware/passport");
require("dotenv").config();

const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const emailRouter = require("./routes/email");
const googleRouter = require("./routes/google");
const projectRouter = require("./routes/project");
const planningRouter = require("./routes/planning");

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

// Middleware chuyển request.body thành JSON
app.use(express.json());

// Cho phép truy cập API từ bên ngoài vào tất cả routes
app.use(cors());

// Cấu hình Swagger UI để hiển thị API documentation
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Documentation",
      version: "1.0.0",
      description: `API documentation. Thay đổi mật khẩu và Cập nhật thông tin người dùng cần có accessToken. accessToken nhận được khi đăng ký hoặc đăng nhập. Ở client thêm Authorization: Bearer {accessToken} vào headers. Phần Googles không thể test trên UI này, truy cập trực tiếp bằng trình duyệt với Server: "http://${process.env.SERVER}/api/google"`,
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

app.use(session({ secret: "secret", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

passportConfig(passport);

app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/email", emailRouter);
app.use("/api/google", googleRouter);
app.use("/api/project", projectRouter);
app.use("/api/planning", planningRouter);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}/api-docs`);
});
