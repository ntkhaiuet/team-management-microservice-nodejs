const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const User = require("../models/User");
const Project = require("../models/Project");

/**
 * @swagger
 * tags:
 *  name: Planning
 *  description: Quản lý API Planning
 */

/**
 * @swagger
 * /api/planning/create/{id}:
 *  post:
 *    summary: Lập kế hoạch cho project (Lần đầu lập kế hoạch client cần gửi topic và target, những lần thêm timeline sau không cần gửi topic và target nữa, nếu vẫn gửi cũng k có vấn đề gì)
 *    tags: [Planning]
 *    security:
 *      - bearerAuth: []
 *    description: Lập kế hoạch cho project (Lần đầu lập kế hoạch client cần gửi topic và target, những lần thêm timeline sau không cần gửi topic và target nữa, nếu vẫn gửi cũng k có vấn đề gì)
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
 *              topic:
 *                type: String
 *                default: Team-Management
 *              target:
 *                type: String
 *                default: Build a website to support team work management
 *              stage:
 *                type: String
 *                default: Start
 *              note:
 *                type: String
 *                default: Start project
 *              deadline:
 *                type: String
 *                default: 01/01/2023
 *    responses:
 *      200:
 *        description: Lập kế hoạch cho project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Lập kế hoạch cho project thành công
 *                plan:
 *                  default:
 *                      {
 *                          "topic": "Team-Management",
 *                          "target": "Build a website to support team work management",
 *                          "timeline": [
 *                              {
 *                                  "stage": "Start",
 *                                  "note": "Start project",
 *                                  "deadline": "01/01/2023",
 *                                  "_id": "64254efdc89898ddd967e1fa"
 *                              }
 *                          ]
 *                      }
 *      400:
 *        description: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền lập kế hoạch cho project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền lập kế hoạch cho project
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
// @route POST api/planning/create/:id
// @desc Lập kế hoạch cho project
// @access Private
router.post("/create/:id", verifyToken, async (req, res) => {
  const { topic, target, stage, note, deadline } = req.body;
  const projectId = req.params.id;

  //   Xác thực cơ bản
  if (!stage || !deadline) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  // Lưu thông tin của timeline vào biến
  const timelineData = {
    stage: stage,
    note: note,
    deadline: deadline,
  };

  try {
    // Tìm project có _id là projectId, người dùng hiện tại là Leader của project đó
    const planningProject = await Project.findOne({
      _id: projectId,
      "users.user": req.userId,
      "users.role": "Leader",
    });

    // Nếu không thành công
    if (!planningProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền lập kế hoạch cho project",
      });
    }

    // Nếu chưa từng tạo plan thì tạo trường plan trong project
    if (topic && target) {
      let timeline = planningProject.plan.timeline || [];
      timeline.push(timelineData);
      const plan = {
        topic: topic,
        target: target,
        timeline: timeline,
      };
      planningProject.plan = plan;
    }
    // Nếu đã tạo plan trước đó
    else {
      planningProject.plan.timeline.push(timelineData);
    }
    await planningProject.save();

    res.status(200).json({
      success: true,
      message: "Lập kế hoạch cho project thành công",
      plan: planningProject.plan,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/planning/read/{id}:
 *  get:
 *    summary: Nhận thông tin về kế hoạch của project
 *    tags: [Planning]
 *    security:
 *      - bearerAuth: []
 *    description: Nhận thông tin về kế hoạch của project
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Nhận thông tin về kế hoạch của project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Nhận thông tin về kế hoạch của project thành công
 *                plan:
 *                  default:
 *                      {
 *                          "topic": "Team-Management",
 *                          "target": "Build a website to support team work management",
 *                          "timeline": [
 *                            {
 *                              "stage": "Start",
 *                              "note": "Start project",
 *                              "deadline": "01/01/2023",
 *                              "_id": "6425557606832b6c7442918a"
 *                            },
 *                            {
 *                              "stage": "Report Week 1",
 *                              "note": "Online",
 *                              "deadline": "08/01/2023",
 *                              "_id": "642555a106832b6c7442918f"
 *                            }
 *                          ]
 *                        }
 *      400:
 *        description: ProjectId không đúng hoặc người dùng không có quyền nhận thông tin về kế hoạch của project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: ProjectId không đúng hoặc người dùng không có quyền nhận thông tin về kế hoạch của project
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
// @route GET api/planning/read/:id
// @desc Nhận thông tin về kế hoạch của project
// @access Private
router.get("/read/:id", verifyToken, async (req, res) => {
  const projectId = req.params.id;

  try {
    // Tìm project có _id là projectId, người dùng hiện tại là Leader của project đó
    const planningProject = await Project.findOne({
      _id: projectId,
      "users.user": req.userId,
      "users.role": "Leader",
    });

    // Nếu không thành công
    if (!planningProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền nhận thông tin về kế hoạch của project",
      });
    }

    // Sắp xếp timeline theo thứ tự tăng dần của deadline
    planningProject.plan.timeline.sort(function (a, b) {
      var dateA = new Date(a.deadline),
        dateB = new Date(b.deadline);
      return dateA - dateB;
    });
    await planningProject.save();

    res.status(200).json({
      success: true,
      message: "Nhận thông tin về kế hoạch của project thành công",
      plan: planningProject.plan,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/planning/update/{id}:
 *  put:
 *    summary: Cập nhật kế hoạch cho project, nếu không thay đổi stage thì không cần gửi newStage hoặc gửi newStage = oldStage
 *    tags: [Planning]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật kế hoạch cho project, nếu không thay đổi stage thì không cần gửi newStage hoặc gửi newStage = oldStage
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
 *              topic:
 *                type: String
 *                default: Team-Management
 *              target:
 *                type: String
 *                default: Build a website to support team work management
 *              oldStage:
 *                type: String
 *                default: Start
 *              newStage:
 *                type: String
 *                default: ReportWeek1
 *              note:
 *                type: String
 *                default: Online
 *              deadline:
 *                type: String
 *                default: 01/01/2023
 *    responses:
 *      200:
 *        description: Cập nhật kế hoạch cho project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Cập nhật kế hoạch cho project thành công
 *                plan:
 *                  default:
 *                      {
 *                          "topic": "Team-Management",
 *                          "target": "Build a website to support team work management",
 *                          "timeline": [
 *                              {
 *                                  "stage": "ReportWeek1",
 *                                  "note": "Online",
 *                                  "deadline": "01/01/2023",
 *                                  "_id": "64254efdc89898ddd967e1fa"
 *                              }
 *                          ]
 *                      }
 *      400:
 *        description: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền cập nhật kế hoạch cho project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền cập nhật kế hoạch cho project
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
// @route PUT api/planning/update/:id
// @desc Cập nhật kế hoạch cho project
// @access Private
router.put("/update/:id", verifyToken, async (req, res) => {
  const { topic, target, oldStage, note, deadline } = req.body;
  let newStage = req.body.newStage;
  const projectId = req.params.id;

  //   Xác thực cơ bản
  if (!topic || !target || !oldStage || !deadline) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Tìm project có _id là projectId, người dùng hiện tại là Leader của project đó
    const planningProject = await Project.findOne({
      _id: projectId,
      "users.user": req.userId,
      "users.role": "Leader",
    });

    // Nếu không thành công
    if (!planningProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền cập nhật kế hoạch cho project",
      });
    }

    //   Khi không thay đổi stage
    if (oldStage === newStage || !newStage) {
      newStage = oldStage;
    }

    // Lấy vị trí của oldStage trong mảng timeline
    let indexTimeline = planningProject.plan.timeline.findIndex(
      (element) => element.stage === oldStage
    );

    // Cập nhật thông tin plan mới vào project
    planningProject.plan.topic = topic;
    planningProject.plan.target = target;
    planningProject.plan.timeline[indexTimeline] = {
      stage: newStage,
      note: note,
      deadline: deadline,
    };
    await planningProject.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật kế hoạch cho project thành công",
      plan: planningProject.plan,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/planning/delete/{id}:
 *  delete:
 *    summary: Xóa 1 timeline có stage được truyền vào trong kế hoạch của project
 *    tags: [Planning]
 *    security:
 *      - bearerAuth: []
 *    description: Xóa 1 timeline có stage được truyền vào trong kế hoạch của project
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
 *              stage:
 *                type: String
 *                default: Start
 *    responses:
 *      200:
 *        description: Xóa timeline có stage là stage truyền vào trong kế hoạch của project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xóa timeline có stage là stage truyền vào trong kế hoạch của project thành công
 *                plan:
 *                  default: plan sau khi đã xóa timeline có stage là stage được truyền vào
 *      400:
 *        description: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền xóa 1 timeline trong kế hoạch của project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Thiếu trường bắt buộc/ProjectId không đúng hoặc người dùng không có quyền xóa 1 timeline trong kế hoạch của project
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
// @route DELETE api/planning/delete/:id
// @desc Xóa 1 timeline có stage được truyền vào trong kế hoạch của project
// @access Private
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const stage = req.body.stage;
  const projectId = req.params.id;

  //   Xác thực cơ bản
  if (!stage) {
    return res
      .status(400)
      .json({ succes: false, message: "Thiếu trường bắt buộc" });
  }

  try {
    // Tìm project có _id là projectId, người dùng hiện tại là Leader của project đó
    const planningProject = await Project.findOne({
      _id: projectId,
      "users.user": req.userId,
      "users.role": "Leader",
    });

    // Nếu không thành công
    if (!planningProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền xóa 1 timeline trong kế hoạch của project",
      });
    }

    // Lấy vị trí của oldStage trong mảng timeline
    let indexTimeline = planningProject.plan.timeline.findIndex(
      (element) => element.stage === stage
    );

    // Xóa timeline có stage là stage được gửi từ client
    planningProject.plan.timeline.splice(indexTimeline, 1);
    await planningProject.save();

    res.status(200).json({
      success: true,
      message:
        "Xóa timeline có stage là stage truyền vào trong kế hoạch của project thành công",
      plan: planningProject.plan,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
