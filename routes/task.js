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

/**
 * @swagger
 * /api/task/update/{id}:
 *  put:
 *    summary: Cập nhật 1 task (Sửa trường nào thì truyền trường đó vào request body)
 *    tags: [Tasks]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật 1 task (Sửa trường nào thì truyền trường đó vào request body)
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của task
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              title:
 *                default: Task1
 *              description:
 *                default: Mô tả của Task1
 *              assign:
 *                default: ntkhaiuet
 *              duedate:
 *                default: 23/04/2023
 *              estimate:
 *                default: 4 Hours
 *              spend:
 *                default: 5 Hours
 *              status:
 *                default: Doing
 *              tags:
 *                default: ["#Tags1", "#Tags2"]
 *              comment:
 *                default: Đã làm được 50% task
 *    responses:
 *      200:
 *        description: Task đã được cập nhật
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Task đã được cập nhật
 *                task:
 *                  default: {
 *                    "_id": "6444d617a97366c5d036842d",
 *                    "projectId": "643416cd4a60456d281a5192",
 *                    "title": "Task1",
 *                    "project": "MyProject",
 *                    "description": "Mô tả của Task1",
 *                    "creator": "ntkhaiuet",
 *                    "assign": "ntkhaiuet",
 *                    "duedate": "23/04/2023",
 *                    "estimate": "4 Hours",
 *                    "status": "Doing",
 *                    "tags": [
 *                      "#Tags1",
 *                      "#Tags2"
 *                    ],
 *                    "createdAt": "13:49:49 23/04/2023",
 *                    "updates": [
 *                      {
 *                        "timestamp": "14:58:40 23/04/2023",
 *                        "content": "Title: Task1; Description: Mô tả của Task1; Assign: ntkhaiuet; Due Date: 23/04/2023; Estimate: 4 Hours; Spend: 5 Hours; Status: Doing; Tags: #Tags1,#Tags2; Comment: Đã làm được 50% task"
 *                      }
 *                    ],
 *                    "spend": "5 Hours"
 *                  }
 *      400:
 *        description: Title đã tồn tại/Assign không tồn tại/User không tồn tại/Task không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Title đã tồn tại/Assign không tồn tại/User không tồn tại/Task không tồn tại
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
// @route PUT api/task/update/:id
// @desc Cập nhật 1 task
// @access Private
router.put("/update/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const updateFields = {};
  const updatesContent = [];

  try {
    if (req.body.title) {
      const existingTask = await Task.findOne({ title: req.body.title });
      if (existingTask && existingTask.id !== id) {
        return res.status(400).json({
          success: false,
          message: "Title đã tồn tại",
        });
      }
      updateFields.title = req.body.title;
      updatesContent.push(`Title: ${req.body.title}`);
    }

    if (req.body.description) {
      updateFields.description = req.body.description;
      updatesContent.push(`Description: ${req.body.description}`);
    }

    if (req.body.assign) {
      const assignUser = await User.findOne({ full_name: req.body.assign });
      if (!assignUser) {
        return res.status(400).json({
          success: false,
          message: "Assign không tồn tại",
        });
      }
      updateFields.assign = req.body.assign;
      updatesContent.push(`Assign: ${req.body.assign}`);
    }

    if (req.body.duedate) {
      updateFields.duedate = req.body.duedate;
      updatesContent.push(`Due Date: ${req.body.duedate}`);
    }

    if (req.body.estimate) {
      updateFields.estimate = req.body.estimate;
      updatesContent.push(`Estimate: ${req.body.estimate}`);
    }

    if (req.body.spend) {
      updateFields.spend = req.body.spend;
      updatesContent.push(`Spend: ${req.body.spend}`);
    }

    if (req.body.status) {
      updateFields.status = req.body.status;
      updatesContent.push(`Status: ${req.body.status}`);
    }

    if (req.body.tags) {
      updateFields.tags = req.body.tags;
      updatesContent.push(`Tags: ${req.body.tags}`);
    }

    if (req.body.comment) {
      updateFields.comment = req.body.comment;
      updatesContent.push(`Comment: ${req.body.comment}`);
    }

    if (updatesContent.length > 0) {
      updateFields.$push = {
        updates: { content: updatesContent.join("; ") },
      };
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User không tồn tại" });
    }

    const updatedTask = await Task.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedTask) {
      return res
        .status(400)
        .json({ success: false, message: "Task không tồn tại" });
    }

    res.json({
      success: true,
      message: "Task đã được cập nhật",
      task: updatedTask,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/task/delete/{id}:
 *  delete:
 *    summary: Xóa 1 task (chỉ dùng để dọn DB)
 *    tags: [Tasks]
 *    security:
 *      - bearerAuth: []
 *    description: Xóa 1 task theo Id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của task
 *    responses:
 *      200:
 *        description: Xóa task thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xóa task thành công
 *      400:
 *        description: Id không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Id không tồn tại
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
// @route DELETE api/task/delete/:id
// @desc Xóa 1 task
// @access Private
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  try {
    const deleteTask = await Task.findByIdAndDelete(id);
    if (!deleteTask) {
      return res
        .status(400)
        .json({ success: false, message: "Id không tồn tại" });
    }

    res.status(200).json({ success: true, message: "Xóa task thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
