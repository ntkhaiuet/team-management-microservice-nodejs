const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const { dateDiff } = require("../middleware/dateDiff");
const formatUnixTime = require("../middleware/formatUnixTime");

const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");
const Notification = require("../models/Notification");

/**
 * @swagger
 * tags:
 *  name: Notifications
 *  description: Quản lý API Notifications
 */

/**
 * @swagger
 * /api/notification/list:
 *  get:
 *    summary: Lấy list notification của user
 *    tags: [Notifications]
 *    security:
 *      - bearerAuth: []
 *    description: Lấy list notification của user
 *    responses:
 *      200:
 *        description: Lấy ra danh sách thành công
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
 *                  default: Lấy danh sách noti thành công
 *                data:
 *                  type: object
 *                  properties:
 *                    listNotification:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          _id:
 *                            type: string
 *                            default: "645f52610b1c537149660ee0"
 *                          projectId:
 *                            type: string
 *                            default: "64340d4cf69cad6d56eb26ce"
 *                          userId:
 *                            type: string
 *                            default: "643442332d3f6e66f09668fa"
 *                          taskId:
 *                            type: string
 *                            default: "64455f793105cb6f4550435a"
 *                          content:
 *                            type: string
 *                            default: "Ngoc đã assign task cho Ngoc"
 *                          status:
 *                            type: string
 *                            default: "Unread"
 *                          type:
 *                            type: string
 *                            default: "Assign"
 *                          createdAt:
 *                            type: string
 *                            default: "16:00:11 13/05/2023"
 *                    countUnread:
 *                      type: integer
 *                      default: 1
 *      400:
 *        description: Không tìm thấy người dùng hoặc người dùng không thuộc project/Không tìm thấy project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy người dùng hoặc người dùng không thuộc project/Không tìm thấy project
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

// @route GET api/notification/list
// @access Private
router.get("/list", verifyToken, async function (req, res) {
  try {
    let userNotifications = [];
    const userId = req.userId
    // Kiểm tra người dùng tồn tại
    const user = await User.findOne({
      _id: userId,
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Không tìm thấy người dùng",
      });
    }
    const commentTask = await Task.find({ commentUsers: req.userId })
    const taskIds = commentTask.map(task => task._id);
    const listNotifyAssign = await Notification.find({ taskId: { $in: taskIds }, type: 'Assign', userId: userId }).sort({ createdAt: -1 });
    // const listNotifyComment = await Notification.find({ taskId: { $in: taskIds }, type: 'Other', userId: { $ne: userId } }).sort({ createdAt: -1 });
    userNotifications = listNotifyAssign.concat(...listNotifyComment);
    userNotifications.forEach((notification) => {
      const unixTime = notification.createdAt
      const fomrattedTime = formatUnixTime(+unixTime);
      notification.createdAt = fomrattedTime
    });
    const unreadCount = userNotifications.filter(item => item.status === 'Unread').length;
    res.status(200).json({
      success: true,
      message: "Lấy danh sách noti thành công",
      data: {
        listNotification: userNotifications,
        countUnread : unreadCount
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/notification/read:
 *  put:
 *    summary: Đánh dấu đã đọc tất cả notification của user
 *    tags: [Notifications]
 *    security:
 *      - bearerAuth: []
 *    description: Đánh dấu đã đọc tất cả notification của user
 *    responses:
 *      200:
 *        description: Đánh dấu đã đọc tất cả notification của user thành công
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
 *                  default: Đánh dấu đã đọc tất cả notification của user thành công
 *      400:
 *        description: Không tìm thấy người dùng hoặc người dùng không thuộc project/Không tìm thấy project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy người dùng hoặc người dùng không thuộc project/Không tìm thấy project
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

// @route PUT api/notification/read
// @access Private
router.put("/read", verifyToken, async function (req, res) {
  try {
    let userNotifications = [];
    const userId = req.userId
    // Kiểm tra người dùng tồn tại
    const user = await User.findOne({
      _id: userId,
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Không tìm thấy người dùng",
      });
    }
    await Notification.updateMany(
      { userId: userId, status: "Unread" },
      { $set: { status: "Read" } }
    );
    res.status(200).json({
      success: true,
      message: "Thao tác thành công"
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
