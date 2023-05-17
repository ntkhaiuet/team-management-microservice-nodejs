const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

/**
 * @swagger
 * tags:
 *  name: Reviews
 *  description: Quản lý API Review
 */

/**
 * @swagger
 * /api/review/create:
 *  post:
 *    summary: Tạo 1 review (review là bắt buộc, score có thể không, truyền taskId nếu đánh giá task, truyền projectId nếu đánh giá project)
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo 1 review (review là bắt buộc, score có thể không, truyền taskId nếu đánh giá task, truyền projectId nếu đánh giá project)
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              review:
 *                default: "Hoàn thành tốt"
 *              score:
 *                default: 9
 *              projectId:
 *                default: 64340d4cf69cad6d56eb26ce
 *              taskId:
 *                default: 64340d4cf69cad6d56eb26ce
 *    responses:
 *      200:
 *        description: Tạo review thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo review thành công
 *                review:
 *                  default: {
 *                    "projectId": 64340d4cf69cad6d56eb26ce,
 *                    "taskId": null,
 *                    "review": "Hoàn thành tốt",
 *                    "score": 9,
 *                    "createdAt": "01:27:38 18/05/2023"
 *                  }
 *      400:
 *        description: Vui lòng nhập review và projectId hoặc taskId/Vui lòng chỉ nhập 1 trong 2 trường projectId, taskId/User không tồn tại/Task không tồn tại/Review đã tồn tại/Project không tồn tại/Người dùng không có quyền đánh giá
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập review và projectId hoặc taskId/Vui lòng chỉ nhập 1 trong 2 trường projectId, taskId/User không tồn tại/Task không tồn tại/Review đã tồn tại/Project không tồn tại/Người dùng không có quyền đánh giá
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
// @route POST api/review/create
// @desc Tạo đánh giá
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const { review, score, projectId, taskId } = req.body;

  //   Kiểm tra review và projectId/taskId tồn tại
  if (!review || (!projectId && !taskId)) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập review và projectId hoặc taskId",
    });
  }

  // Kiểm tra xem có nhập cả projectId và taskId không
  if (projectId && taskId) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng chỉ nhập 1 trong 2 trường projectId, taskId",
    });
  }

  try {
    let projectIdByTask;

    // Lấy projectId nếu là đánh giá task
    if (taskId) {
      const [task, checkReview] = await Promise.all([
        Task.findById(taskId),
        Review.findOne({ taskId: taskId }),
      ]);
      if (!task) {
        return res.status(400).json({
          success: false,
          message: "Task không tồn tại",
        });
      }
      projectIdByTask = task.projectId;

      // Kiểm tra task được đánh giá chưa
      if (checkReview) {
        return res.status(400).json({
          success: false,
          message: "Review đã tồn tại",
        });
      }
    }

    if (projectId) {
      const checkReview = await Review.findOne({ projectId: projectId });
      // Kiểm tra task được đánh giá chưa
      if (checkReview) {
        return res.status(400).json({
          success: false,
          message: "Review đã tồn tại",
        });
      }
    }

    const [user, project] = await Promise.all([
      User.findById(req.userId),
      Project.findById(projectId || projectIdByTask),
    ]);

    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    // Kiểm tra project tồn tại
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project không tồn tại",
      });
    }

    //   Kiểm tra người dùng có phải reviewer không
    const isReviewer = project.users.find((user) => {
      return user.email === req.userEmail && user.role === "Reviewer";
    });
    if (!isReviewer) {
      return res.status(400).json({
        success: false,
        message: "Người dùng không có quyền đánh giá",
      });
    }

    // Tạo bản ghi review
    let newReview;
    if (projectId) {
      newReview = new Review({
        projectId: projectId,
        review: review,
        score: score || null,
      });
    } else {
      newReview = new Review({
        taskId: taskId,
        review: review,
        score: score || null,
      });
    }
    newReview.save();

    res.status(200).json({
      success: true,
      message: "Tạo review thành công",
      review: newReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/review/read/{taskorprojectid}:
 *  get:
 *    summary: Nhận thông tin đánh giá (truyền vào taskId hoặc projectId)
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Nhận thông tin đánh giá (truyền vào taskId hoặc projectId)
 *    parameters:
 *      - in: path
 *        name: taskorprojectid
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của task hoặc ID của project
 *    responses:
 *      200:
 *        description: Nhận thông tin review thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Nhận thông tin review thành công
 *                review:
 *                  default: {
 *                    "projectId": "6464f03f84a8c1589f49a007",
 *                    "taskId": null,
 *                    "review": "Hoàn thành tốt",
 *                    "score": 9,
 *                    "createdAt": "22:26:26 17/05/2023"
 *                  }
 *      400:
 *        description: User không tồn tại hoặc user không thuộc project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: User không tồn tại hoặc user không thuộc project
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
// @route GET api/review/read/:taskorprojectid
// @desc Nhận thông tin đánh giá
// @access Private
router.get("/read/:taskorprojectid", verifyToken, async (req, res) => {
  const taskOrProjectId = req.params.taskorprojectid;

  try {
    let projectIdByTask;
    // Kiểm tra taskOrProjectId xem có phải id của task không
    const task = await Task.findById(taskOrProjectId);
    if (task) {
      projectIdByTask = task.projectId;
    }

    // Kiểm tra user tồn tại và thuộc project
    const user = await User.findOne({
      _id: req.userId,
      "projects.project": projectIdByTask || taskOrProjectId,
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại hoặc user không thuộc project",
      });
    }

    let review;
    if (projectIdByTask) {
      review = await Review.findOne({ taskId: taskOrProjectId });
    } else {
      review = await Review.findOne({ projectId: taskOrProjectId });
    }

    res.status(200).json({
      success: true,
      message: "Nhận thông tin review thành công",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/review/update/{taskorprojectid}:
 *  put:
 *    summary: Cập nhật thông tin đánh giá
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật thông tin đánh giá
 *    parameters:
 *      - in: path
 *        name: taskorprojectid
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của task hoặc ID của project
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              review:
 *                default: Sửa nội dung review
 *              score:
 *                default: 10
 *    responses:
 *      200:
 *        description: Chỉnh sửa thông tin review thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Chỉnh sửa thông tin review thành công
 *      400:
 *        description: Vui lòng nhập review hoặc score/User không tồn tại/Người dùng không có quyền chỉnh sửa đánh giá
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập review hoặc score/User không tồn tại/Người dùng không có quyền chỉnh sửa đánh giá
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
// @route PUT api/review/update/:taskorprojectid
// @desc Cập nhật thông tin đánh giá
// @access Private
router.put("/update/:taskorprojectid", verifyToken, async (req, res) => {
  const taskOrProjectId = req.params.taskorprojectid;
  const { review, score } = req.body;

  let updateFields = {};

  if (review) {
    updateFields.review = review;
  }

  if (score) {
    updateFields.score = score;
  }

  //   Kiểm tra review/score tồn tại
  if (!review && !score) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập review hoặc score",
    });
  }

  try {
    let projectIdByTask;

    const [task, user] = await Promise.all([
      Task.findById(taskOrProjectId),
      User.findById(req.userId),
    ]);

    // Kiểm tra taskOrProjectId xem có phải id của task không
    if (task) {
      projectIdByTask = task.projectId;
    }

    // Kiểm tra user tồn tại và là Reviewer của project
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại",
      });
    }

    //   Kiểm tra người dùng có phải reviewer không
    const isReviewer = user.projects.find((element) => {
      return (
        element.project == (projectIdByTask.toString() || taskOrProjectId) &&
        element.role === "Reviewer"
      );
    });
    if (!isReviewer) {
      return res.status(400).json({
        success: false,
        message: "Người dùng không có quyền chỉnh sửa đánh giá",
      });
    }

    let updateReview;
    if (projectIdByTask) {
      updateReview = await Review.findOneAndUpdate(
        { taskId: taskOrProjectId },
        updateFields,
        { new: true }
      );
    } else {
      updateReview = await Review.findOneAndUpdate(
        { projectId: taskOrProjectId },
        updateFields,
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Chỉnh sửa thông tin review thành công",
      review: updateReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
