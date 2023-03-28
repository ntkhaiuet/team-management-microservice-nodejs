const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const User = require("../models/User");
const Project = require("../models/Project");

/**
 * @swagger
 * components:
 *  schemas:
 *    Project:
 *      required:
 *        - _id
 *        - name
 *      properties:
 *        _id:
 *          type: String
 *        name:
 *          type: String
 *        status:
 *          type: String
 *          enum: [Processing, Completed]
 *          default: Processing
 *        users:
 *          type: Array
 *          items:
 *            type: object
 *            properties:
 *              user:
 *                type: string
 *              role:
 *                type: string
 *                enum: ["Leader", "Reviewer", "Member"]
 *                default: "Member"
 *        createdAt:
 *          type: Date
 *      example:
 *        _id: 6422436f9574d6d0650f0059
 *        name: Project cua Khai
 *        status: Processing
 *        users: [{user: "64106a4a65047e0dff8ecc81", role: "Leader"}]
 *        createdAt: 2023-03-28T01:30:17.781+00:00
 */

/**
 * @swagger
 * tags:
 *  name: Projects
 *  description: Quản lý API Project
 */

/**
 * @swagger
 * /api/project/create:
 *  post:
 *    summary: Tạo project mới
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo project mới với tên được truyền vào và thêm người dùng tạo project vào project đó với vai trò Leader
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                type: String
 *                default: MyProject
 *    responses:
 *      200:
 *        description: Tạo project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo project thành công
 *      400:
 *        description: Thiếu trường bắt buộc/Không tìm thấy người dùng/Project đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/Không tìm thấy người dùng/Project đã tồn tại
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
// @route POST api/project/create
// @desc Test 1 project mới
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const name = req.body.name;
  let roleUserCreate = "Leader";

  //   Xác thực cơ bản
  if (!name) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Kiểm tra người dùng tồn tại và lấy các project của người dùng
    const user = await User.findById(req.userId)
      .populate("projects.project")
      .exec();
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra project tên project mới và project đã có của người dùng
    const projectsLength = user.projects.length;
    for (let i = 0; i < projectsLength; i++) {
      if (user.projects[i].project.name === name) {
        return res
          .status(400)
          .json({ success: false, message: "Project đã tồn tại" });
      }
    }

    // Tạo project mới
    const project = new Project({
      name: name,
      status: "Processing",
      users: [{ user: req.userId, role: roleUserCreate }],
    });

    // Thêm project vào tập các project của người dùng
    user.projects.push({ project: project._id, role: roleUserCreate });

    await user.save();
    await project.save();

    res.status(200).json({ success: true, message: "Tạo project thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @swagger
 * components:
 *  schemas:
 *    Project:
 *      required:
 *        - _id
 *        - name
 *      properties:
 *        _id:
 *          type: String
 *        name:
 *          type: String
 *        status:
 *          type: String
 *          enum: [Processing, Completed]
 *          default: Processing
 *        users:
 *          type: Array
 *          items:
 *            type: object
 *            properties:
 *              user:
 *                type: string
 *              role:
 *                type: string
 *                enum: ["Leader", "Reviewer", "Member"]
 *                default: "Member"
 *        createdAt:
 *          type: Date
 *      example:
 *        _id: 6422436f9574d6d0650f0059
 *        name: Project cua Khai
 *        status: Processing
 *        users: [{user: "64106a4a65047e0dff8ecc81", role: "Leader"}]
 *        createdAt: 2023-03-28T01:30:17.781+00:00
 */

/**
 * @swagger
 * tags:
 *  name: Projects
 *  description: Quản lý API Projects
 */

/**
 * @swagger
 * /api/project/list:
 *  get:
 *    summary: Lấy list project của người dùng
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    requestBody:
 *      required: false
 *    responses:
 *      200:
 *        description: Lấy ra danh sách thành công
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
// @route GET api/project/list
// @desc Lấy list project của người dùng
// @access Private
router.get("/list", verifyToken, async function (req, res) {
  try {
    const user = await User.findById(req.userId)
      .populate("projects.project")
      .exec();
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    let projects = user.projects;
    res.json({
      success: true,
      message: "Lấy danh sách thành công",
      data: projects
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
