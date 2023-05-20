const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const { compareDate } = require("../middleware/compareDate");
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
 * /api/statistic/task:
 *  get:
 *    summary: Thống kê tổng số task, số lượng task đã và chưa hoàn thành cùng với chi tiết task, kiểm tra task chưa hoàn thành trễ hạn (trường isLate)
 *    tags: [Statistics]
 *    security:
 *      - bearerAuth: []
 *    description: Thống kê tổng số task, số lượng task đã và chưa hoàn thành cùng với chi tiết task, kiểm tra task chưa hoàn thành trễ hạn (trường isLate)
 *    responses:
 *      200:
 *        description: Thống kê task thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Thống kê task thành công
 *                totalTasksCount:
 *                  default: 5
 *                doneTasksCount:
 *                  default: 1
 *                undoneTasksCount:
 *                  default: 4
 *                doneTasks:
 *                  default: [
 *                    {
 *                        "taskId": "6464b12e166434d25b7626e8",
 *                        "projectId": "6464b07f166434d25b7626d9",
 *                        "projectName": "TestStatusProject",
 *                        "title": "Task đầu tiên",
 *                        "duedate": "20/05/2023",
 *                        "status": "Done"
 *                    }
 *                  ]
 *                undoneTasks:
 *                  default: [
 *                    {
 *                        "taskId": "6444e934ade502f84253504e",
 *                        "projectId": "643416cd4a60456d281a5192",
 *                        "projectName": "MyProject",
 *                        "title": "Task1",
 *                        "duedate": "23/04/2023",
 *                        "status": "Doing",
 *                        "isLate": true
 *                    },
 *                    {
 *                        "taskId": "64455f793105cb6f4550435a",
 *                        "projectId": "6434449455e477a461272f9b",
 *                        "projectName": "MyProjec3+1",
 *                        "title": "Task1111",
 *                        "duedate": "23/04/2023",
 *                        "status": "Doing",
 *                        "isLate": true
 *                    },
 *                    {
 *                        "taskId": "64651bd002569886c9de0a69",
 *                        "projectId": "6464f03f84a8c1589f49a007",
 *                        "projectName": "Review1",
 *                        "title": "Task đầu tiên",
 *                        "duedate": "30/04/2023",
 *                        "status": "Todo",
 *                        "isLate": true
 *                    },
 *                    {
 *                        "taskId": "6465379326d28ec4c130fa79",
 *                        "projectId": "646535a626d28ec4c130fa55",
 *                        "projectName": "Review2",
 *                        "title": "Task đầu tiên",
 *                        "duedate": "30/04/2023",
 *                        "status": "Todo",
 *                        "isLate": true
 *                    }
 *                  ]
 *      400:
 *        description: User không tồn tại/Chưa có task được giao
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: User không tồn tại/Chưa có task được giao
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
// @route GET api/statistic/task
// @desc Thống kê các task đã và chưa hoàn thành của user hiện tại
// @access Private
router.get("/task", verifyToken, async (req, res) => {
  try {
    const [user, listTask] = await Promise.all([
      User.findById(req.userId),
      Task.find({ assign: req.userEmail }).populate({
        path: "projectId",
        select: "_id name",
      }),
    ]);

    // Kiểm tra user tồn tại
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User không tồn tại" });
    }

    // Kiểm tra tồn tại task được giao
    if (listTask.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Chưa có task được giao" });
    }

    // Lấy các trường cần thiết của task
    const filteredTasks = listTask.map((task) => {
      return {
        taskId: task._id,
        projectId: task.projectId._id,
        projectName: task.projectId.name,
        title: task.title,
        duedate: task.duedate,
        status: task.status,
      };
    });

    // Các task đã hoàn thành
    const doneTasks = filteredTasks.filter((task) => {
      return task.status === "Done";
    });

    // Các task chưa hoàn thành
    const undoneTasks = filteredTasks.filter((task) => {
      return task.status !== "Done";
    });

    // Kiểm tra các task chưa hoàn thành có trễ hạn không
    undoneTasks.forEach((object) => {
      if (compareDate(onlyDate, object.duedate) > 0) {
        object.isLate = true;
      } else {
        object.isLate = false;
      }
    });

    res.status(200).json({
      success: true,
      message: "Thống kê task thành công",
      totalTasksCount: filteredTasks.length,
      doneTasksCount: doneTasks.length,
      undoneTasksCount: filteredTasks.length - doneTasks.length,
      doneTasks: doneTasks,
      undoneTasks: undoneTasks,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// @route GET api/statistic/review
// @desc Thống kê các đánh giá và điểm của task, project
// @access Private
router.get("/review", verifyToken, async (req, res) => {
  try {
    const [user, tasks] = await Promise.all([
      User.findById(req.userId),
      Task.find({ assign: req.userEmail }).populate({
        path: "projectId",
        select: "_id name",
      }),
    ]);

    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Chưa có task được giao cho người dùng",
      });
    }

    // Lọc task theo projectId
    const filteredTasks = tasks
      .reverse()
      .filter((task) => task.projectId)
      .map((task) => ({
        projectId: task.projectId._id,
        projectName: task.projectId.name,
        taskId: task._id,
        title: task.title,
      }));

    const filteredReviewTasks = await Promise.all(
      filteredTasks.map(async (task) => {
        const review = await Review.findOne({ taskId: task.taskId });
        return review
          ? { ...task, review: review.review, score: review.score }
          : null;
      })
    );

    const tasksWithReview = filteredReviewTasks.filter((task) => task !== null);

    const projectIds = {};
    const filteredReviewProjects = await Promise.all(
      filteredTasks.map(async (task) => {
        const projectId = task.projectId;
        if (!projectIds[projectId]) {
          projectIds[projectId] = true;
          const review = await Review.findOne({ projectId });
          return review
            ? {
                projectId: task.projectId,
                projectName: task.projectName,
                review: review.review,
                score: review.score,
              }
            : null;
        }
        return null;
      })
    );

    const projectsWithReview = filteredReviewProjects.filter(
      (task) => task !== null
    );

    res.status(200).json({
      success: true,
      message: "Thống kê các đánh giá và điểm của task và project thành công",
      totalReviewTaskCount: tasksWithReview.length,
      totalReviewProjectCount: projectsWithReview.length,
      reviewTasks: tasksWithReview,
      reviewProjects: projectsWithReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
