const verifyToken = require("../middleware/auth");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const generator = require("generate-password");
const argon2 = require("argon2");
const path = require("path");
require("dotenv").config();

const User = require("../models/User");

/**
 * @swagger
 * tags:
 *  name: Emails
 *  description: Quản lý API Email
 */

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
      subject: "Xác minh tài khoản tại TeamManagement",
      html: `Truy cập vào <a href="${process.env.SERVER}/api/email/verify/${token}">đường dẫn</a> để xác minh tài khoản của bạn.`,
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
      text: `Sử dụng mật khẩu sau đây để truy cập vào tài khoản ${email} của bạn: ${password}`,
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
          user.email_verified = true;
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
 * /api/email/verify/{token}:
 *  get:
 *    summary: Xác minh email. Người dùng truy cập vào đường dẫn để xác minh tài khoản.
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
 *          text/plain:
 *            schema:
 *              type: string
 *              example: Xác minh email thành công! Địa chỉ email của bạn đã được xác minh thành công, bạn có thể đóng cửa sổ này ngay bây giờ.
 *      400:
 *        description: Token không hợp lệ
 *        content:
 *          text/plain:
 *            schema:
 *              type: string
 *              example: Xác minh email thất bại! Token không hợp lệ, vui lòng thử lại.
 *      500:
 *        description: Lỗi hệ thống
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Lỗi hệ thống
 */
// Xử lý xác minh email
const verify = async (req, res) => {
  const token = req.params.token;

  try {
    // Tìm user có token trùng với token đã tạo
    const user = await User.findOne({ token: token });

    if (!user) {
      // Token không hợp lệ
      return res
        .status(400)
        .sendFile(path.dirname(__dirname) + "/views/verifyEmailError.html");
    }
    // Cập nhật trạng thái đã xác minh
    user.email_verified = true;
    await user.save();
    return res.sendFile(path.dirname(__dirname) + "/views/verifyEmail.html");
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

/**
 * @swagger
 * /api/email/send:
 *  post:
 *    summary: Gửi email xác minh chứa đường dẫn để người dùng có thể xác minh tài khoản khi nhấn vào
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
 *        description: Lỗi hệ thống
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Lỗi hệ thống
 */
// Xử lý gửi email xác minh
const send = async (req, res) => {
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
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }

  //   Gửi email xác minh tới user
  try {
    const result = await sendVerificationEmail(email, token);
    res.json({ success: true, message: result, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

/**
 * @swagger
 * /api/email/reset_password:
 *  post:
 *    summary: Gửi email đặt lại mật khẩu. Gửi 1 mật khẩu mới được tạo ngẫu nhiên qua email của người dùng
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
 *        description: Lỗi hệ thống
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Lỗi hệ thống
 */
// Xử lý đặt lại mật khẩu
const reset_password = async (req, res) => {
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
    return res.status(500).json({ success: false, message: "Lỗi hệ thống" });
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
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};

module.exports = {
  verify,
  send,
  reset_password,
};
