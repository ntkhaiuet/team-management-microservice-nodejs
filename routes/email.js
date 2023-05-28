const express = require("express");
const router = express.Router();

const emailController = require("../controllers/emailController");

// @route GET api/email/verify/:token
// @desc Xác minh email. Người dùng truy cập vào đường dẫn để xác minh tài khoản.
// @access Public
router.get("/verify/:token", emailController.verify);

// @route POST api/email/send
// @desc Gửi email xác minh chứa đường dẫn để người dùng có thể xác minh tài khoản khi nhấn vào
// @access Public
router.post("/send", emailController.send);

// @route POST api/email/resetpassword
// @desc Gửi email đặt lại mật khẩu. Gửi 1 mật khẩu mới được tạo ngẫu nhiên qua email của người dùng
// @access Public
router.post("/reset_password", emailController.reset_password);

// @route POST api/email/feedback
// @desc Gửi email góp ý
// @access Public
router.post("/feedback", emailController.feedback);

module.exports = router;
