const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const { compareDate } = require("../middleware/compareDate");
const { dateDiff } = require("../middleware/dateDiff");
const onlyDate = require("../middleware/onlyDate");

const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

/**
 * @swagger
 * tags:
 *  name: Statistics
 *  description: Quản lý API Statistic
 */

/**
 * @swagger
 * /api/statistic/stagetime/{projectId}:
 *  get:
 *    summary: Thống kê thời gian stage
 *    tags: [Statistics]
 *    security:
 *      - bearerAuth: []
 *    description: Thống kê thời gian stage
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Thống kê thời gian stage thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Thống kê thời gian stage thành công
 *                project_id:
 *                  default: 646b734ad32b3108fb75b43e
 *                project_name:
 *                  default: TestStageTime
 *                stageTimeInfo:
 *                  default: [
 *                    {
 *                        "stage": "Week1",
 *                        "expected": 7,
 *                        "actual": 8
 *                    },
 *                    {
 *                        "stage": "Week2",
 *                        "expected": 7,
 *                        "actual": 6
 *                    },
 *                    {
 *                        "stage": "Week3",
 *                        "expected": 7,
 *                        "actual": null
 *                    }
 *                  ]
 *      400:
 *        description: Project không tồn tại hoặc user không thuộc project/User không tồn tại/Project chưa có stage
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Project không tồn tại hoặc user không thuộc project/User không tồn tại/Project chưa có stage
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
// @route GET api/statistic/stagetime/:projectId
// @desc Thống kê thời gian stage
// @access Private
router.get("/stagetime/:projectId", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const [project, user] = await Promise.all([
      Project.findOne({ _id: projectId, "users.email": req.userEmail }),
      User.findById(req.userId),
    ]);

    // Kiểm tra project tồn tại
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project không tồn tại hoặc user không thuộc project",
      });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    if (project.plan.timeline.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Project chưa có stage",
      });
    }

    // Tạo mảng chứa thông tin thời gian stage để làm biểu đồ
    const stageTimeInfo = project.plan.timeline.map((stage) => {
      let actual = null;
      if (stage.actual) {
        if (compareDate(stage.deadline, stage.actual) > 0) {
          actual =
            stage.percentOfProject.weight -
            dateDiff(stage.deadline, stage.actual);
        } else {
          actual =
            stage.percentOfProject.weight +
            dateDiff(stage.deadline, stage.actual);
        }
      }
      return {
        stage: stage.stage,
        expected: stage.percentOfProject.weight,
        actual: actual,
      };
    });

    res.status(200).json({
      success: true,
      message: "Thống kê thời gian stage thành công",
      project_id: projectId,
      project_name: project.name,
      stageTimeInfo: stageTimeInfo,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/statistic/taskofstage/{projectId}:
 *  get:
 *    summary: Thống kê tỉ lệ phần trăm của task và stage trong project
 *    tags: [Statistics]
 *    security:
 *      - bearerAuth: []
 *    description: Thống kê tỉ lệ phần trăm của task và stage trong project
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Thống kê % của task và stage trong project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Thống kê % của task và stage trong project thành công
 *                stages:
 *                  default: [
 *                    {
 *                        "stage": "Week1",
 *                        "weight": 7
 *                    },
 *                    {
 *                        "stage": "Week2",
 *                        "weight": 7
 *                    },
 *                    {
 *                        "stage": "Week3",
 *                        "weight": 7
 *                    }
 *                  ]
 *                tasks:
 *                  default: [
 *                    {
 *                        "title": "Task 1",
 *                        "stage": "Week1",
 *                        "percent": 8.33
 *                    },
 *                    {
 *                        "title": "Task 2",
 *                        "stage": "Week1",
 *                        "percent": 25
 *                    },
 *                    {
 *                        "title": "Task 3",
 *                        "stage": "Week2",
 *                        "percent": 33.33
 *                    },
 *                    {
 *                        "title": "Task 4",
 *                        "stage": "Week3",
 *                        "percent": 9.7
 *                    },
 *                    {
 *                        "title": "Task 5",
 *                        "stage": "Week3",
 *                        "percent": 10.91
 *                    },
 *                    {
 *                        "title": "Task 6",
 *                        "stage": "Week3",
 *                        "percent": 12.73
 *                    }
 *                  ]
 *      400:
 *        description: Project không tồn tại hoặc user không thuộc project/User không tồn tại/Project chưa có stage
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Project không tồn tại hoặc user không thuộc project/User không tồn tại/Project chưa có stage
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
// @route GET api/statistic/taskofstage/:projectId
// @desc Thống kê tổng số task, số task hoàn thành và chưa hoàn thành của stage
// @access Private
router.get("/taskofstage/:projectId", verifyToken, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const [project, user] = await Promise.all([
      Project.findOne({ _id: projectId, "users.email": req.userEmail }),
      User.findById(req.userId),
    ]);

    // Kiểm tra project tồn tại
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project không tồn tại hoặc user không thuộc project",
      });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    if (project.plan.timeline.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Project chưa có stage",
      });
    }

    // Tạo mảng lưu số task đã và chưa hoàn thành của stage
    let taskOfStage = [];

    // Tạo mảng lưu tổng số task của stage
    const totalTaskOfStage = await Promise.all(
      project.plan.timeline.map(async (stage, index) => {
        const tasks = await Task.find({
          projectId: projectId,
          stage: stage.stage,
        });

        // Lưu số task đã và chưa hoàn thành vào mảng taskOfStage theo vị trí hiện tại
        const doneTasks = tasks.filter((task) => task.status === "Done");
        taskOfStage[index] = {
          stage: stage.stage,
          doneTaskCount: doneTasks.length,
          undoneTaskCount: tasks.length - doneTasks.length,
        };

        return {
          stage: stage.stage,
          totalTaskCount: tasks.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      message:
        "Thống kê tổng số task, số task hoàn thành và chưa hoàn thành của stage thành công",
      totalTask: totalTaskOfStage,
      doneAndUndoneTask: taskOfStage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
