const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
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
      from: "sheissocute2001@gmail.com",
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
// @desc Verification email
// @access Public
router.get("/verify/:token", async (req, res) => {
  const token = req.params.token;

  try {
    // Tìm user có token trùng với token đã tạo
    const user = await User.findOne({ token: token });

    if (!user) {
      // Token không hợp lệ
      res.status(404).json({ success: false, message: "Token không hợp lệ" });
    } else {
      // Cập nhật trạng thái đã xác minh
      user.email_verified = true;
      user.save();
      res.json({
        success: true,
        message: "Xác minh email thành công",
      });
    }
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
 *    security:
 *      - bearerAuth: []
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
// @desc Send email verification
// @access Private
router.post("/send", verifyToken, async (req, res) => {
  const email = req.body.email;

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
    user.save();
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
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

module.exports = router;
