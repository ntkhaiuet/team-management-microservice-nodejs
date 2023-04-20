const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const User = require("../models/User");
const Project = require("../models/Project");
const ProjectInvite = require("../models/ProjectInvite");
const Task = require("../models/Task");

/**
 * @swagger
 * tags:
 *  name: Tasks
 *  description: Quản lý API Task
 */

/**
 * @swagger
 * /api/task/create:
 *  post:
 *    summary: Tạo 1 task mới
 *    tags: [Tasks]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo 1 task mới
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                default: Task đầu tiên
 *              project:
 *                default: MyProject
 *              description:
 *                default: Mô tả task
 *              assign:
 *                default: ntkhaiuet
 *              duedate:
 *                default: 30/04/2023
 *              estimate:
 *                default: 4 Hours
 *              tags:
 *                default: ["#Tags1", "#Tags2"]
 *    responses:
 *      200:
 *        description: Tạo task mới thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo task mới thành công
 *                newTask:
 *                  default: {
 *                    "title": "Task 3",
 *                    "project": "MyProject",
 *                    "description": "Mô tả task",
 *                    "creator": "ntkhaiuet",
 *                    "assign": "sheissocute",
 *                    "duedate": "30/04/2023",
 *                    "estimate": "4 Hours",
 *                    "status": "Todo",
 *                    "tags": [
 *                      "#Tags1",
 *                      "#Tags2"
 *                    ],
 *                    "createdAt": "23:11:29 20/04/2023"
 *                  }
 *      400:
 *        description: Vui lòng nhập title, project, assign, duedate và estimate/Project không tồn tại/User không tồn tại/Title đã tồn tại/Assign không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập title, project, assign, duedate và estimate/Project không tồn tại/User không tồn tại/Title đã tồn tại/Assign không tồn tại
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
// @route POST api/task/create
// @desc Tạo 1 task mới
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const { title, project, description, assign, duedate, estimate, tags } =
    req.body;

  // Kiểm tra các trường bắt buộc
  if (!title || !project || !assign || !duedate || !estimate) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập title, project, assign, duedate và estimate",
    });
  }

  try {
    // Sử dụng Promise.all để thực hiện các tác vụ kiểm tra đồng thời
    const [checkProject, user, checkTitleTask, assignUser] = await Promise.all([
      Project.findOne({ name: project }),
      User.findById(req.userId),
      Task.findOne({ title: title }),
      User.findOne({ full_name: assign }),
    ]);

    // Kiểm tra project tồn tại
    if (!checkProject) {
      return res
        .status(400)
        .json({ success: false, message: "Project không tồn tại" });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User không tồn tại" });
    }

    // Kiểm tra title tồn tại
    if (checkTitleTask) {
      return res
        .status(400)
        .json({ success: false, message: "Title đã tồn tại" });
    }

    // Kiểm tra assign tồn tại
    if (!assignUser) {
      return res
        .status(400)
        .json({ success: false, message: "Assign không tồn tại" });
    }

    // Tạo task mới
    const newTask = new Task({
      projectId: checkProject._id,
      title,
      project,
      description,
      creator: user.full_name,
      assign,
      duedate,
      estimate,
      status: "Todo",
      tags,
    });

    await newTask.save();

    res.status(200).json({
      success: true,
      message: "Tạo task mới thành công",
      newTask: {
        title: newTask.title,
        project: newTask.project,
        description: newTask.description,
        creator: newTask.creator,
        assign: newTask.assign,
        duedate: newTask.duedate,
        estimate: newTask.estimate,
        status: newTask.status,
        tags: newTask.tags,
        createdAt: newTask.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
