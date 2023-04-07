const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const argon2 = require("argon2");
require("dotenv").config();

const User = require("../models/User");
const ProjectInvite = require("../models/ProjectInvite");
const Project = require("../models/Project");

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
 *        projects:
 *          type: Array
 *          items:
 *            type: object
 *            properties:
 *              project:
 *                type: string
 *              role:
 *                type: string
 *                enum: ["Leader", "Reviewer", "Member"]
 *                default: "Member"
 *        createdAt:
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
 *        projects: [{project: "6422436f9574d6d0650f0059", role: "Leader"}]
 *        createdAt: 10:56:27 29/03/2023
 */

/**
 * @swagger
 * tags:
 *  name: Users
 *  description: Quản lý API User
 */

/**
 * @swagger
 * /api/user/change_password:
 *  post:
 *    summary: Thay đổi mật khẩu tài khoản người dùng
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
// @desc Thay đổi mật khẩu tài khoản người dùng
// @access Private
router.post("/change_password", verifyToken, async function (req, res) {
  const { password, new_password } = req.body;
  const email = req.userEmail;

  //   Xác thực cơ bản
  if (!email || !password || !new_password) {
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
 * /api/user:
 *  get:
 *    summary: Nhận thông tin người dùng hiện tại
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
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
// @route GET api/user
// @desc Nhận thông tin người dùng hiện tại
// @access Public
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
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
 * /api/user:
 *  put:
 *    summary: Cập nhật thông tin người dùng. Nếu thay đổi email thì cần xác thực email mới, sau đó mới đăng nhập được
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
 *              type: object
 *              properties:
 *                success:
 *                  type: Boolean
 *                  default: true
 *                message:
 *                  type: String
 *                  default: Cập nhật thông tin thành công
 *                isChangeEmail:
 *                  type: Boolean
 *                  default: true
 *                user:
 *                  type: object
 *                  properties:
 *                    full_name:
 *                      type: String
 *                      default: Nguyễn Thế Khải
 *                    email:
 *                      type: String
 *                      default: ntkhaiuet@gmail.com
 *                    dob:
 *                      type: String
 *                      default: 31/10/2001
 *                    phone_number:
 *                      type: String
 *                      default: "0376269482"
 *                    gender:
 *                      type: String
 *                      default: Male
 *      400:
 *        description: Thiếu trường bắt buộc/Không tìm thấy người dùng/Email đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/Không tìm thấy người dùng/Email đã tồn tại
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
// @route PUT api/user
// @desc Cập nhật thông tin người dùng
// @access Private
router.put("/", verifyToken, async (req, res) => {
  const { full_name, dob, email, phone_number, gender } = req.body;

  var isChangeEmail = false;

  //   Xác thực cơ bản
  if (!full_name || !dob || !email || !phone_number || !gender) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra email tồn tại
    if (email !== user.email) {
      const userWithEmail = await User.findOne({ email });

      // Email đã được sử dụng
      if (userWithEmail) {
        return res
          .status(400)
          .json({ succes: false, message: "Email đã tồn tại" });
      }
      user.email_verified = false;
      isChangeEmail = true;
    }

    // Cập nhật thông tin vào DB
    user.full_name = full_name;
    user.dob = dob;
    user.email = email;
    user.phone_number = phone_number;
    user.gender = gender;
    await user.save();

    res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      isChangeEmail,
      user: {
        full_name,
        dob,
        email,
        phone_number,
        gender,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/user/invitations/list:
 *  get:
 *    summary: Nhận thông tin về các lời mời vào project người dùng hiện tại
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *                  default: true
 *                message:
 *                  type: string
 *                  default: Lấy danh sách lời mời thành công
 *                data:
 *                  type: array
 *                  items:
 *                    type: object
 *                    properties:
 *                      projectId:
 *                        type: string
 *                        description: ID của dự án được mời
 *                        example: 6422f6b7696dbe537c03d71a
 *                      role:
 *                        type: string
 *                        description: Vai trò của người dùng trong dự án
 *                        example: Member

 *      400:
 *        description: Không tìm thấy người dùng
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *                  default: false
 *                message:
 *                  type: string
 *                  default: Không tìm thấy người dùng
 *      500:
 *        description: Internal server error
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  type: boolean
 *                  default: false
 *                message:
 *                  type: string
 *                  default: Internal server error
 */

// @route GET api/user/invitations/list
// @desc Nhận thông tin về các lời mời vào project người dùng hiện tại
// @access Public
router.get("/invitations/list", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Tìm các project mà user được mời vào
    let userProjectInvite = await ProjectInvite.find({
      "users.email": user.email,
    });

    // Lấy ra projectId và role của mỗi project người dùng được mời cho vào mảng data
    let data = userProjectInvite.map((projectinvite) => {
      let roleUser;
      projectinvite.users.forEach((element) => {
        if (element.email === user.email) {
          roleUser = element.role;
        }
      });
      return { projectId: projectinvite.projectId, role: roleUser };
    });

    res.json({
      success: true,
      message: "Lấy thông tin thành công",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * /api/user/{projectId}/invite/respond:
 *  put:
 *    summary: Phản hồi lời mời thành viên tham gia vào project
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    description: User Phản hồi lời mời thành viên tham gia vào project
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              accept:
 *                type: Boolean
 *                default: true
 *    responses:
 *      200:
 *        description: Xác nhận phản hồi thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xác nhận phản hồi thành công
 *      400:
 *        description: Không tìm thấy lời mời
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy lời mời
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
// @route PUT api/user/:projectId/invite/respond
// @desc Phản hồi lời mời thành viên tham gia vào project
// @access Private
router.put("/:projectId/invite/respond", verifyToken, async (req, res) => {
  const { accept } = req.body;
  const projectId = req.params.projectId;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy dự án" });
    }

    const projectInvite = await ProjectInvite.findOne({
      projectId: projectId,
      "users.email": user.email,
    });
    if (!projectInvite) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy lời mời" });
    }
    if (accept) {
      let userInvite = projectInvite.users.find((u) => u.email === user.email);
      // thêm 1 project trong user
      user.projects.push({ project: projectId, role: userInvite.role });
      // xóa user ở trường invite và thêm vào trường user
      await Project.updateOne(
        { _id: projectId },
        {
          $pull: { invite: { email: user.email } },
          $push: {
            users: { user: user._id, role: userInvite.role },
          },
        }
      );
    }
    // xóa user trong projectInvite
    await ProjectInvite.updateOne(
      { projectId: projectId },
      { $pull: { users: { email: user.email } } }
    );

    await projectInvite.save();
    await project.save();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Xác nhận phản hồi lời mời thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
