const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const argon2 = require("argon2");
require("dotenv").config();

const User = require("../models/User");

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      required:
 *        - _id
 *        - full_name
 *        - email
 *        - password
 *      properties:
 *        _id:
 *          type: String
 *        full_name:
 *          type: String
 *        email:
 *          type: String
 *        password:
 *          type: String
 *        dob:
 *          type: String
 *        email_verified:
 *          type: Boolean
 *        phone_number:
 *          type: String
 *        gender:
 *          type: String
 *        token:
 *          type: String
 *      example:
 *        _id: 64045186b72087718b17a908
 *        full_name: Nguyen The Khai
 *        email: ntkhaiuet@gmail.com
 *        password: $argon2id$v=19$m=65536,t=3,p=4$9h5sAqY6t7vbaG/3IjODJA$TVKCeBY2Ggv/9O/Q2PoVhvgVuUVJbCVemyiNjwazGUY
 *        dob: 31/10/2001
 *        email_verified: false
 *        phone_number: '0376269482'
 *        gender: Male
 *        token: b394b763b5591dcb3f362524c22c081b01db2370
 *
 */

/**
 * @swagger
 * tags:
 *  name: Users
 *  description: Quản lý API User
 */

/**
 * @swagger
 * /api/user/:
 *  get:
 *    summary: Thông tin của tất cả người dùng
 *    tags: [Users]
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/User'
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
// @route GET api/user/
// @desc Get user
// @access Public
router.get("/", async (req, res) => {
  try {
    const user = await User.find();
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/user/change_password:
 *  post:
 *    summary: Gửi email đặt lại mật khẩu
 *    tags: [Users]
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
 *              password:
 *                type: String
 *              new_password:
 *                type: String
 *    responses:
 *      200:
 *        description: Thay đổi mật khẩu thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Thay đổi mật khẩu thành công
 *      400:
 *        description: Thiếu trường bắt buộc/Email không tồn tại/Mật khẩu không đúng
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/Email không tồn tại/Mật khẩu không đúng
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
// @route POST api/user/change_password
// @desc Đổi mật khẩu tài khoản người dùng
// @access Private
router.post("/change_password", verifyToken, async function (req, res) {
  const { email, password, new_password } = req.body;

  //   Xác thực cơ bản
  if ((!email, !password || !new_password)) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Kiểm tra email tồn tại
    const user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Email không tồn tại" });
    }

    // Kiểm tra mật khẩu người dùng nhập vào và mật khẩu lưu trong DB
    const passwordValid = await argon2.verify(user.password, password);

    if (!passwordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu không đúng" });
    }

    // Lưu mật khẩu mới vào DB
    const hashedPassword = await argon2.hash(new_password);
    user.password = hashedPassword;
    await user.save();
    res.json({ success: true, message: "Thay đổi mật khẩu thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/user/{_id}:
 *  get:
 *    summary: Nhận thông tin người dùng theo _id
 *    tags: [Users]
 *    parameters:
 *      - in: path
 *        name: _id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của người dùng
 *    responses:
 *      200:
 *        description: OK
 *        content:
 *          application/json:
 *            schema:
 *                $ref: '#/components/schemas/User'
 *      400:
 *        description: Không tìm thấy người dùng
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy người dùng
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
// @route GET api/user/:id
// @desc Get user by _id
// @access Public
router.get("/:_id", async (req, res) => {
  try {
    const user = await User.findById(req.params._id);
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       description: Nhập accessToken vào đây, accessToken được tạo ra sau khi đăng ký hoặc đăng nhập
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/user/{_id}:
 *  put:
 *    summary: Cập nhật thông tin người dùng theo _id
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: _id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của người dùng
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              full_name:
 *                type: String
 *              email:
 *                type: String
 *              dob:
 *                type: String
 *              phone_number:
 *                type: String
 *              gender:
 *                type: String
 *    responses:
 *      200:
 *        description: Trả về thông tin của người dùng sau khi cập nhật
 *        content:
 *          application/json:
 *            schema:
 *                $ref: '#/components/schemas/User'
 *      400:
 *        description: Không tìm thấy người dùng
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy người dùng
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
// @route PUT api/user/:id
// @desc Update user info
// @access Private
router.put("/:_id", verifyToken, async (req, res) => {
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
      res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
