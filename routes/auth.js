const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// @route POST api/auth/register
// @desc Đăng ký tài khoản
// @access Public
router.post("/register", authController.register);

// @route POST api/auth/login
// @desc Đăng nhập. Yêu cầu tài khoản phải được xác thực sau đó trả về accessToken
// @access Public
router.post("/login", authController.login);

module.exports = router;
