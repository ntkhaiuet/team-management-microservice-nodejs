const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");

const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const formattedDate = require("../middleware/formatDate");

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
 *    summary: Tạo đánh giá
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo đánh giá
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              projectId:
 *                default: 646cf96851c0950a40e48068
 *              member:
 *                default: ntkhaiuet@gmail.com
 *              review:
 *                default: "Hoàn thành tốt"
 *              score:
 *                default: 9
 *    responses:
 *      200:
 *        description: Tạo đánh giá thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo đánh giá thành công
 *                review:
 *                  default: {
 *                    "projectId": "646cf96851c0950a40e48068",
 *                    "member": {
 *                      "full_name": "ntkhaiuet",
 *                      "email": "ntkhaiuet@gmail.com"
 *                    },
 *                    "reviewer": {
 *                      "full_name": "sheissocute",
 *                      "email": "sheissocute2001@gmail.com"
 *                    },
 *                    "review": "Hoàn thành tốt",
 *                    "score": 9,
 *                    "lastModifiedAt": "01:51:37 24/05/2023",
 *                    "_id": "646d0b4219e942ce3f0e81a4"
 *                  }
 *      400:
 *        description: Project không tồn tại/User không có quyền đánh giá/User được đánh giá không tồn tại hoặc là Reviewer/User không tồn tại/Review đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Project không tồn tại/User không có quyền đánh giá/User được đánh giá không tồn tại hoặc là Reviewer/User không tồn tại/Review đã tồn tại
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
  const { projectId, member, review, score } = req.body;

  try {
    const [project, user, checkReview, memberInfo] = await Promise.all([
      Project.findById(projectId),
      User.findById(req.userId),
      Review.findOne({
        projectId: projectId,
        "reviewer.email": req.userEmail,
        "member.email": member,
      }),
      User.findOne({ email: member }),
    ]);

    // Kiểm tra project tồn tại
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "Project không tồn tại" });
    }

    const users = project.users;

    // Kiểm tra quyền user
    const checkRole = users.some(
      (user) => user.email === req.userEmail && user.role === "Reviewer"
    );
    if (!checkRole) {
      return res
        .status(400)
        .json({ success: false, message: "User không có quyền đánh giá" });
    }

    // Kiểm tra user được đánh giá
    const checkMember = users.some(
      (user) =>
        user.email === member &&
        (user.role === "Member" || user.role === "Leader")
    );
    if (!checkMember) {
      return res.status(400).json({
        success: false,
        message: "User được đánh giá không tồn tại hoặc là Reviewer",
      });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User không tồn tại" });
    }

    // Kiểm tra review tồn tại
    if (checkReview) {
      return res
        .status(400)
        .json({ success: false, message: "Review đã tồn tại" });
    }

    const newReview = new Review({
      projectId: projectId,
      member: {
        full_name: memberInfo.full_name,
        email: member,
      },
      reviewer: {
        full_name: req.userFullName,
        email: req.userEmail,
      },
      review: review,
      score: score,
      lastModifiedAt: formattedDate,
    });

    newReview.save();

    res.status(200).json({
      success: true,
      message: "Tạo đánh giá thành công",
      review: newReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/review/list/{projectId}:
 *  get:
 *    summary: Nhận danh sách đánh giá của project
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Nhận danh sách đánh giá của project
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Nhận danh sách đánh giá thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Nhận danh sách đánh giá thành công
 *                review:
 *                  default: [
 *                    {
 *                      "member": {
 *                        "full_name": "ntkhaiuet",
 *                        "email": "ntkhaiuet@gmail.com"
 *                      },
 *                      "reviewer": {
 *                        "full_name": "sheissocute",
 *                        "email": "sheissocute2001@gmail.com"
 *                      },
 *                      "_id": "646d0b4219e942ce3f0e81a4",
 *                      "projectId": "646cf96851c0950a40e48068",
 *                      "review": "Hoàn thành tốt",
 *                      "score": 9,
 *                      "lastModifiedAt": "01:51:37 24/05/2023"
 *                    }
 *                  ]
 *      400:
 *        description: Project không tồn tại/User không tồn tại hoặc không thuộc project/Không tìm thấy đánh giá nào
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Project không tồn tại/User không tồn tại hoặc không thuộc project/Không tìm thấy đánh giá nào
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
// @route GET api/review/list/:projectId
// @desc Nhận danh sách đánh giá của project
// @access Private
router.get("/list/:projectId", verifyToken, async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const [project, user] = await Promise.all([
      Project.findById(projectId),
      User.findOne({ _id: req.userId, "projects.project": projectId }),
    ]);

    // Kiểm tra project tồn tại
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "Project không tồn tại" });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại hoặc không thuộc project",
      });
    }

    const review = await Review.find({ projectId: projectId });

    if (review.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy đánh giá nào",
      });
    }

    res.status(200).json({
      success: true,
      message: "Nhận danh sách đánh giá thành công",
      review: review,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/review/update/{id}:
 *  put:
 *    summary: Chỉnh sửa 1 đánh giá
 *    tags: [Reviews]
 *    security:
 *      - bearerAuth: []
 *    description: Chỉnh sửa 1 đánh giá
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của đánh giá
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
 *    responses:
 *      200:
 *        description: Chỉnh sửa đánh giá thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Chỉnh sửa đánh giá thành công
 *                review:
 *                  default: {
 *                    "member": {
 *                      "full_name": "ntkhaiuet",
 *                      "email": "ntkhaiuet@gmail.com"
 *                    },
 *                    "reviewer": {
 *                      "full_name": "sheissocute",
 *                      "email": "sheissocute2001@gmail.com"
 *                    },
 *                    "_id": "646d0b4219e942ce3f0e81a4",
 *                    "projectId": "646cf96851c0950a40e48068",
 *                    "review": "Hoàn thành rất tốt",
 *                    "score": 10,
 *                    "lastModifiedAt": "02:31:30 24/05/2023"
 *                  }
 *      400:
 *        description: Vui lòng nhập review hoặc score/Id của đánh giá không đúng/Project không tồn tại/User không có quyền chỉnh sửa đánh giá/User không tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập review hoặc score/Id của đánh giá không đúng/Project không tồn tại/User không có quyền chỉnh sửa đánh giá/User không tồn tại
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
// @route PUT api/review/update/:id
// @desc Chỉnh sửa 1 đánh giá
// @access Private
router.put("/update/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const { review, score } = req.body;

  if (!review || !score) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng nhập review hoặc score" });
  }

  try {
    const updateReview = await Review.findById(id);

    // Kiểm tra review tồn tại
    if (!updateReview) {
      return res
        .status(400)
        .json({ success: false, message: "Id của đánh giá không đúng" });
    }

    const [project, user] = await Promise.all([
      Project.findById(updateReview.projectId),
      User.findById(req.userId),
    ]);

    // Kiểm tra project tồn tại
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "Project không tồn tại" });
    }

    const users = project.users;

    // Kiểm tra quyền user
    const checkRole = users.some(
      (user) => user.email === req.userEmail && user.role === "Reviewer"
    );
    if (!checkRole) {
      return res.status(400).json({
        success: false,
        message: "User không có quyền chỉnh sửa đánh giá",
      });
    }

    // Kiểm tra user tồn tại
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User không tồn tại" });
    }

    // Cập nhật đánh giá
    updateReview.review = review;
    updateReview.score = score;
    updateReview.lastModifiedAt = formattedDate;

    updateReview.save();

    res.status(200).json({
      success: true,
      message: "Chỉnh sửa đánh giá thành công",
      review: updateReview,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
