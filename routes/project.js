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
 *    summary: Tạo project mới (Hiện tại chưa thêm các thành viên khác làm Member hay Reviewer, chỉ đặt người dùng tạo project là Leader)
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
 * /api/project/{id}:
 *  put:
 *    summary: Cập nhật thông tin project (Hiện tại chỉ mới thay đổi được tên project)
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật thông tin project (Hiện tại chỉ mới thay đổi được tên project), chỉ Leader mới có quyền cập nhật thông tin project
 *    parameters:
 *      - in: path
 *        name: id
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
 *              name:
 *                type: String
 *                default: MyProject
 *    responses:
 *      200:
 *        description: Cập nhật thông tin project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Cập nhật thông tin project thành công
 *                project:
 *                  default:
 *                    {
 *                        "_id": "6422436f9574d6d0650f0059",
 *                        "name": "Project cua Khai",
 *                        "status": "Processing",
 *                        "users": [
 *                            {
 *                                "user": "64106a4a65047e0dff8ecc81",
 *                                "role": "Leader",
 *                                "_id": "6422436f9574d6d0650f005a"
 *                            }
 *                        ],
 *                        "createdAt": "2023-03-28T01:30:17.781Z"
 *                    }
 *      400:
 *        description: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền chỉnh sửa project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền chỉnh sửa project
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
// @route PUT api/project/edit
// @desc Cập nhật thông tin project (Hiện tại chỉ mới thay đổi được tên project)
// @access Private
router.put("/:id", verifyToken, async (req, res) => {
  const { name } = req.body;
  const projectId = req.params.id;

  //   Xác thực cơ bản
  if (!name) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Cập nhật tên của project có _id là projectId, người dùng hiện tại là Leader của project đó
    const updateProject = await Project.findOneAndUpdate(
      {
        _id: projectId,
        "users.user": req.userId,
        "users.role": "Leader",
      },
      { name: name },
      {
        new: true,
      }
    );

    // Nếu cập nhật không thành công
    if (!updateProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền chỉnh sửa project",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin project thành công",
      project: updateProject,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
