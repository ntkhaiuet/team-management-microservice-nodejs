const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const generator = require("generate-password");
const argon2 = require("argon2");
require("dotenv").config();

const User = require("../models/User");

// Cấu hình Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Hàm gửi email xác minh
function sendVerificationEmail(email, token) {
  return new Promise((resolve, reject) => {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Xác minh email",
      text: `Truy cập vào đường dẫn sau để xác minh email của bạn: http://${process.env.SERVER}/api/email/verify/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject("Có lỗi xảy ra");
      } else {
        console.log("Email sent: " + info.response);
        resolve("Đã gửi email xác minh tới email của bạn");
      }
    });
  });
}

// Hàm gửi email đặt lại mật khẩu
function sendResetPasswordEmail(email) {
  return new Promise((resolve, reject) => {
    // Tạo mật khẩu ngẫu nhiên
    const password = generator.generate({
      length: 8,
      numbers: true,
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Đặt lại mật khẩu",
      text: `Sử dụng mật khẩu dưới sau để truy cập vào tài khoản ${email} của bạn: ${password}`,
    };

    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        console.log(error);
        reject("Có lỗi xảy ra");
      } else {
        console.log("Email sent: " + info.response);
        try {
          // Mã hóa và lưu mật khẩu mới vào DB
          const user = await User.findOne({ email: email });
          const hashedPassword = await argon2.hash(password);
          user.password = hashedPassword;
          await user.save();
        } catch (e) {
          console.log(e);
        }
        resolve("Đã gửi mật khẩu mới tới email của bạn");
      }
    });
  });
}

/**
 * @swagger
 * tags:
 *  name: Emails
 *  description: Quản lý API Email
 */

/**
 * @swagger
 * /api/email/verify/{token}:
 *  get:
 *    summary: Xác minh email
 *    tags: [Emails]
 *    parameters:
 *      - in: path
 *        name: token
 *        schema:
 *          type: string
 *        required: true
 *        description: Token được tạo khi gửi email xác thực
 *    responses:
 *      200:
 *        description: Xác minh email thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xác minh email thành công
 *      404:
 *        description: Token không hợp lệ
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Token không hợp lệ
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
// @route GET api/email/verify/:token
// @desc Xác thực email
// @access Public
router.get("/verify/:token", async (req, res) => {
  const token = req.params.token;

  try {
    // Tìm user có token trùng với token đã tạo
    const user = await User.findOne({ token: token });

    if (!user) {
      // Token không hợp lệ
      return res
        .status(404)
        .json({ success: false, message: "Token không hợp lệ" });
    }
    // Cập nhật trạng thái đã xác minh
    user.email_verified = true;
    await user.save();
    res.json({
      success: true,
      message: "Xác minh email thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/email/send:
 *  post:
 *    summary: Gửi email xác minh
 *    tags: [Emails]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: String
 *    responses:
 *      200:
 *        description: Đã gửi email xác minh tới email của bạn
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Đã gửi email xác minh tới email của bạn
 *                token:
 *                  default: b394b763b5591dcb3f362524c22c081b01db2370
 *      400:
 *        description: Email không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Email không tồn tại
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
// @route POST api/email/send
// @desc Gửi email xác thực
// @access Public
router.post("/send", async (req, res) => {
  const email = req.body.email;

  //   Xác thực cơ bản
  if (!email) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  // Tạo token xác minh và lưu vào DB
  const token = crypto.randomBytes(20).toString("hex");
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ succes: false, message: "Email không tồn tại" });
    }
    user.token = token;
    await user.save();
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }

  //   Gửi email xác minh tới user
  try {
    const result = await sendVerificationEmail(email, token);
    res.json({ success: true, message: result, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/email/reset_password:
 *  post:
 *    summary: Gửi email đặt lại mật khẩu
 *    tags: [Emails]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              email:
 *                type: String
 *    responses:
 *      200:
 *        description: Đã gửi email đặt lại mật khẩu
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Đã gửi mật khẩu mới tới email của bạn
 *      400:
 *        description: Email không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Email không tồn tại
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
// @route GET api/email/resetpassword
// @desc Gửi email đặt lại mật khẩu
// @access Public
router.post("/reset_password", async function (req, res) {
  const email = req.body.email;

  //   Xác thực cơ bản
  if (!email) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  // Kiểm tra email tồn tại
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email không tồn tại" });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }

  // Gửi email đặt lại mật khẩu
  try {
    const result = await sendResetPasswordEmail(email);
    var success;
    if (result === "Có lỗi xảy ra") {
      success = false;
    } else {
      success = true;
    }
    res.json({ success: success, message: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
