const express = require("express");
const passport = require("passport");
const generator = require("generate-password");
const jwt = require("jsonwebtoken");
const argon2 = require("argon2");
const router = express.Router();
require("dotenv").config();

const User = require("../models/User");

var accessToken;

/**
 * @swagger
 * tags:
 *  name: Googles
 *  description: Quản lý API Google. Phần này không test trên Swagger UI được, truy cập trực tiếp vào đường dẫn bằng trình duyệt
 */

/**
 * @swagger
 * /api/google:
 *  get:
 *    summary: Đăng nhập bằng tài khoản Google, tự chuyển tiếp sang trang đăng nhập với Google
 *    tags: [Googles]
 */
// @route GET api/google
// @desc Đăng nhập bằng tài khoản Google
// @access Public
router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /api/google/callback:
 *  get:
 *    summary: Lưu thông tin tài khoản Google của người dùng vào DB, trả về accessToken
 *    tags: [Googles]
 */
// @route GET api/google/callback
// @desc Lưu thông tin tài khoản Google của người dùng vào DB
// @access Public
router.get(
  "/callback",
  passport.authenticate("google", { failureMessage: "Đăng nhập thất bại" }),
  async (req, res) => {
    try {
      const email = req.user.profile.emails[0].value;
      const email_verified = req.user.profile.emails[0].verified;
      const full_name = req.user.profile.displayName;

      // Kiểm tra email tồn tại
      const user = await User.findOne({ email: email });
      if (!user) {
        // Tạo mật khẩu ngẫu nhiên
        const password = generator.generate({
          length: 8,
          numbers: true,
        });

        // Mã hóa mật khẩu và lưu tài khoản người dùng mới vào DB
        const hashedPassword = await argon2.hash(password);
        const newUser = new User({
          full_name: full_name,
          email: email,
          password: hashedPassword,
          email_verified: email_verified,
        });
        await newUser.save();
        // Trả về token
        accessToken = jwt.sign(
          {
            userId: newUser._id,
            userFullname: newUser.full_name,
            userEmail: newUser.email,
          },
          process.env.ACCESS_TOKEN_SECRET
        );
      } else {
        // Trả về token
        accessToken = jwt.sign(
          {
            userId: user._id,
            userFullname: user.full_name,
            userEmail: user.email,
          },
          process.env.ACCESS_TOKEN_SECRET
        );
      }

      req.session.destroy();

      // res.redirect("/api/google/token");
      res.send("<script>window.close();</script >");
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

/**
 * @swagger
 * /api/google/token:
 *  get:
 *    summary: Trả về accessToken khi đăng nhập bằng google thành công
 *    tags: [Googles]
 *    responses:
 *      200:
 *        description: Tạo accessToken thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo accessToken thành công
 *                accessToken:
 *                  default: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDA2ZWIyYjBlNGYwMmRhMzZlNGRhMDciLCJ1c2VyRnVsbG5hbWUiOiJLaOG6o2kgbsOoIiwidXNlckVtYWlsIjoibmd1eWVudGhla2hhaTMxMTAyMDAxQGdtYWlsLmNvbSIsImlhdCI6MTY3ODE4Njc4OX0.8kz3LiOzn-MkN8ryIUWfFzkCzftoCav8FymHmOj-LJ8
 *
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Internal server error
 */
// @route GET api/google/token
// @desc Trả về accessToken khi đăng nhập bằng Google thành công
// @access Public
router.get("/token", function (req, res) {
  if (!accessToken) {
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
  // Lưu accessToken vào biến tạm và xóa accessToken
  var tempAccessToken = accessToken;
  accessToken = null;

  res.json({
    success: true,
    message: "Tạo accessToken thành công",
    accessToken: tempAccessToken,
  });
});

module.exports = router;
