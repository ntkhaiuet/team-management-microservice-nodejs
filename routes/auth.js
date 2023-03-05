const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("../models/User");

/**
 * @swagger
 * tags:
 *  name: Auths
 *  description: Quản lý API Auth
 */

/**
 * @swagger
 * /api/auth/register:
 *  post:
 *    summary: Đăng ký
 *    tags: [Auths]
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
 *              password:
 *                type: String
 *    responses:
 *      200:
 *        description: Đăng ký thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Đăng ký thành công
 *                accessToken:
 *                  type: String
 *      400:
 *        description: Thiếu trường bắt buộc hoặc email đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc hoặc email đã tồn tại
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
// @route POST api/auth/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  //   Simple validation
  if (!full_name || !email || !password) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Check for existing email
    const user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ succes: false, message: "Email đã tồn tại" });
    }

    // All good
    const hashedPassword = await argon2.hash(password);
    const newUser = new User({ full_name, email, password: hashedPassword });
    await newUser.save();

    // Return token
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "Đăng ký thành công",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *  post:
 *    summary: Đăng nhập
 *    tags: [Auths]
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
 *    responses:
 *      200:
 *        description: Đăng nhập thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Đăng nhập thành công
 *                accessToken:
 *                  type: String
 *      400:
 *        description: Thiếu trường bắt buộc hoặc Email/password không chính xác
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc hoặc Email/password không chính xác
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
// @route POST api/auth/login
// @desc Login user
// @access Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  //   Simple validation
  if (!email || !password) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Check for existing email
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ succes: false, message: "Email/password không chính xác" });
    }

    // Email found
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) {
      return res
        .status(400)
        .json({ succes: false, message: "Email/password không chính xác" });
    }

    // All good
    // Return token
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
