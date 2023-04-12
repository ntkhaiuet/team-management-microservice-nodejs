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
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
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
// @route GET api/user
// @desc Nhận thông tin người dùng hiện tại
// @access Private
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
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/user/{email}:
 *  get:
 *    summary: Nhận thông tin người dùng theo email
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    description: Nhận thông tin người dùng theo email
 *    parameters:
 *      - in: path
 *        name: email
 *        schema:
 *          type: string
 *        required: true
 *        description: Email của người dùng
 *    responses:
 *      200:
 *        description: Nhận thông tin của người dùng theo email thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Nhận thông tin của người dùng theo email thành công
 *                email:
 *                  default: ntkhaiuet@gmail.com
 *                full_name:
 *                  default: ntkhaiuet
 *                phone_number:
 *                  default: "0376269482"
 *                gender:
 *                  default: Male
 *                dob:
 *                  default: 31/10/2001
 *                projects:
 *                  default: [
 *                    {
 *                      "project": {
 *                        "_id": "64306e8a057f909e03c62876",
 *                        "name": "Project 1"
 *                      },
 *                      "role": "Leader",
 *                    },
 *                    {
 *                      "project": {
 *                        "_id": "64307014c3da89b9e415235e",
 *                        "name": "Project 2"
 *                      },
 *                      "role": "Member",
 *                    }
 *                  ]
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
// @route GET api/user/:email
// @desc Nhận thông tin người dùng theo email
// @access Private
router.get("/:email", verifyToken, async (req, res) => {
  const email = req.params.email;

  try {
    const user = await User.findOne({ email: email }).populate({
      path: "projects.project",
      select: "_id name",
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    res.status(200).json({
      success: true,
      message: "Nhận thông tin của người dùng theo email thành công",
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      gender: user.gender,
      dob: user.dob,
      projects: user.projects,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
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
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/user/invitations/list:
 *  get:
 *    summary: Nhận thông tin về các lời mời vào project người dùng hiện tại (Các lời mời có status là Waiting)
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: query
 *        name: name
 *        schema:
 *          type: string
 *        required: false
 *        description: name của project
 *      - in: query
 *        name: role
 *        schema:
 *          type: string
 *        required: false
 *        description: role của user được mời tham gia project
 *    description: Nhận thông tin về các lời mời vào project người dùng hiện tại (Các lời mời có status là Waiting)
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
 *        description: Lỗi hệ thống
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
 *                  default: Lỗi hệ thống
 */

// @route GET api/user/invitations/list
// @desc Nhận thông tin về các lời mời vào project người dùng hiện tại (Các lời mời có status là Waiting)
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
    }).populate({ path: "project", select: "name" });

    // Lấy ra projectId, project_name và role của mỗi project người dùng được mời cho vào mảng data
    let data = userProjectInvite.map((projectinvite) => {
      let roleUser;
      projectinvite.users.forEach((element) => {
        if (element.email === user.email && element.status === "Waiting") {
          roleUser = element.role;
        }
      });
      return {
        project_id: projectinvite.project._id,
        project_name: projectinvite.project.name,
        role: roleUser,
      };
    });

    const { project_name, role } = req.query;
    if (project_name) {
      data = data.filter((project) =>
          project.project_name.toLowerCase().includes(project_name.toLowerCase())
      );
    }

    // Lọc dựa trên role
    if (role) {
      data = data.filter((project) => project.role.toLowerCase().includes(role.toLowerCase()));
    }


    res.json({
      success: true,
      message: "Lấy thông tin thành công",
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
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
 *                project_id:
 *                  default: 64340fa55abd3c60a38e3dd9
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
    // Lấy thông tin người dùng
    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Lấy thông tin project
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy dự án" });
    }

    // Kiểm tra lời mời tồn tại
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

      // Thay role Leader cũ thành Member
      if (userInvite.role === "Leader") {
        // Lấy id của Leader cũ
        const oldLeader = await User.findOne({
          "projects.project": projectId,
          "projects.role": "Leader",
        });

        const oldLeaderEmail = oldLeader.email;
        const oldLeaderId = oldLeader._id;

        // Thay role trong project
        const updatedProject = await Project.findOneAndUpdate(
          { _id: projectId, "users.email": oldLeaderEmail },
          { $set: { "users.$.role": "Member" } },
          { new: true }
        );

        if (!updatedProject) {
          return res
            .status(400)
            .json({ success: false, message: "Không tìm thấy project" });
        }

        // Thay role trong user
        const updatedUser = await User.findOneAndUpdate(
          { _id: oldLeaderId, "projects.project": projectId },
          { $set: { "projects.$.role": "Member" } },
          { new: true }
        );

        if (!updatedUser) {
          return res
            .status(400)
            .json({ success: false, message: "Không tìm thấy user" });
        }
      }

      // thêm 1 project trong user
      user.projects.push({ project: projectId, role: userInvite.role });

      // Thêm user vào trường users trong project
      await Project.updateOne(
        { _id: projectId },
        {
          $push: {
            users: { email: user.email, role: userInvite.role },
          },
        }
      );
    }
    // Cập nhật trạng thái user trong projectinvites
    await ProjectInvite.updateOne(
      { project: projectId, "users.email": user.email },
      { $set: { "users.$.status": "Joined" } }
    );

    await Promise.all([projectInvite.save(), project.save(), user.save()]);

    res.status(200).json({
      success: true,
      message: "Xác nhận phản hồi lời mời thành công",
      project_id: projectId,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/user/outproject/{projectId}:
 *  put:
 *    summary: Rời khỏi 1 project
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    description: Rời khỏi 1 project (Chỉ Member hoặc Reviewer mới có thể rời project)
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Rời khỏi project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Rời khỏi project thành công
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
// @route PUT api/user/outproject/:projectId
// @desc Rời khỏi 1 project
// @access Private
router.put("/outproject/:projectId", verifyToken, async (req, res) => {
  const projectId = req.params.projectId;

  try {
    await User.updateOne(
      { _id: req.userId, "projects.role": { $in: ["Member", "Reviewer"] } },
      { $pull: { projects: { project: projectId } } }
    );

    await Project.updateOne(
      { _id: projectId, "users.role": { $in: ["Member", "Reviewer"] } },
      { $pull: { users: { email: req.userEmail } } }
    );

    await ProjectInvite.updateOne(
      { project: projectId, "users.role": { $in: ["Member", "Reviewer"] } },
      { $pull: { users: { email: req.userEmail } } }
    );

    res.status(200).json({
      success: true,
      message: "Rời khỏi project thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/user/projects/count:
 *  get:
 *    summary: Đếm các trạng thái project của user
 *    tags: [Users]
 *    security:
 *      - bearerAuth: []
 *    description: Đếm các trạng thái project của user
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
 *                  default: Lấy thông tin thành công
 *                data:
 *                  type: object
 *                  properties:
 *                    countPending:
 *                      type: integer
 *                      description: Số lượng dự án đang chờ xử lý
 *                      example: 0
 *                    countProcessing:
 *                      type: integer
 *                      description: Số lượng dự án đang xử lý
 *                      example: 0
 *                    countCompleted:
 *                      type: integer
 *                      description: Số lượng dự án đã hoàn thành
 *                      example: 0
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
 *        description: Lỗi hệ thống
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
 *                  default: Lỗi hệ thống
 */


// @access Public
router.get("/projects/count", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const userProjectInviteCount = await ProjectInvite.countDocuments({
      "users.email": user.email,
    });

    const userProjectProcessingCount = await Project.countDocuments({
      "status": "Processing",
      "users.email": user.email,
    })

    const userProjectCompletedCount = await Project.countDocuments({
      "status": "Completed",
      "users.email": user.email,
    })

    res.json({
      success: true,
      message: "Lấy thông tin thành công",
      data: {
          countPending:userProjectInviteCount,
          countProcessing:userProjectProcessingCount,
          countCompleted:userProjectCompletedCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
