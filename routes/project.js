const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const User = require("../models/User");
const Project = require("../models/Project");
const ProjectInvite = require("../models/ProjectInvite");

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
 *        plan:
 *          type: object
 *          properties:
 *            topic:
 *              type: String
 *            target:
 *              type: String
 *            timeline:
 *              type: Array
 *              items:
 *                type: object
 *                properties:
 *                  stage:
 *                    type: String
 *                    unique: true
 *                  note:
 *                    type: String
 *                  deadline:
 *                    type: String
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
 *        invite:
 *          type: Array
 *          items:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              role:
 *                type: string
 *                enum: ["Leader", "Reviewer", "Member"]
 *                default: "Member"
 *        createdAt:
 *          type: String
 *      example:
 *        _id: 6422436f9574d6d0650f0059
 *        name: Project cua Khai
 *        status: Processing
 *        plan: {
 *          "topic": "Team-Management",
 *          "target": "Build a website to support team work management",
 *          "timeline": [
 *            {
 *              "stage": "Start",
 *              "note": "Start project",
 *              "deadline": "01/01/2023",
 *              "_id": "64256555160f141a0235d7ba"
 *            },
 *            {
 *              "stage": "Report Week 1",
 *              "note": "Online",
 *              "deadline": "08/01/2023",
 *              "_id": "642555a106832b6c7442918f"
 *            }
 *          ]
 *        }
 *        users: [{user: "64106a4a65047e0dff8ecc81", role: "Leader"}]
 *        invite: [
 *          {
 *            "email": "example@gmail.com",
 *            "role": "Member",
 *            "_id": "642bfd9c2a7e6432547910ce"
 *          },
 *          {
 *            "email": "example11@gmail.com",
 *            "role": "Member",
 *            "_id": "642dade1213644752b9d89d9"
 *          }
 *        ]
 *        createdAt: 10:56:27 29/03/2023
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
 *    summary: Tạo project mới (Người tạo project là Leader)
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo project mới (name là bắt buộc, description và listUserInvite có thể không cần truyền)
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                default: MyProject
 *              description:
 *                default: Mô tả
 *              listUserInvite:
 *                default: [{email: "example1@gmail.com", role: "Member"}, {email: "example2@gmail.com", role: "Reviewer"}]
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
// @route POST api/project/create
// @desc Test 1 project mới
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const { name, description } = req.body;
  let listUserInvite = req.body.listUserInvite || [];
  let roleUserCreator = "Leader";

  //   Xác thực cơ bản
  if (!name) {
    return res
      .status(400)
      .json({ succes: false, message: "Vui lòng nhập name" });
  }

  try {
    // Kiểm tra người dùng tồn tại và lấy các project của người dùng
    const user = await User.findById(req.userId).populate("projects.project");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra project tên project mới và project đã có của người dùng
    const isProjectExist = user.projects.some(
      (project) => project.project.name === name
    );

    if (isProjectExist) {
      return res
        .status(400)
        .json({ success: false, message: "Project đã tồn tại" });
    }

    // Tạo project mới
    const project = new Project({
      name,
      description: description || "",
      status: "Processing",
      users: [{ user: req.userId, role: roleUserCreator }],
    });

    // Thêm project vào tập các project của người dùng
    user.projects.push({ project: project._id, role: roleUserCreator });
    await user.save();

    // Begin: Mời các user vào project
    // Tạo 1 bản ghi trong bảng projectinvites
    let projectInvite = new ProjectInvite({
      projectId: project._id,
      users: [],
    });

    // Thêm user vào tập các user được mời của project
    listUserInvite.forEach(async (element) => {
      projectInvite.users.push({ email: element.email, role: element.role });
      project.invite.push({ email: element.email, role: element.role });
    });

    await Promise.all([projectInvite.save(), project.save()]);
    // End: Mời các user vào project

    res.status(200).json({ success: true, message: "Tạo project thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/edit/{id}:
 *  put:
 *    summary: Cập nhật thông tin project (truyền ít nhất 1 trong 3 trường name, description, status)
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật thông tin project (truyền ít nhất 1 trong 3 trường name, description, status) (dành cho Leader)
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
 *              description:
 *                type: String
 *                default: Description
 *              status:
 *                type: String
 *                default: Completed
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
 *                      "plan": {
 *                        "topic": "Team-Management",
 *                        "target": "Build a website to support team work management",
 *                        "timeline": [
 *                          {
 *                            "stage": "Start",
 *                            "note": "Start project",
 *                            "deadline": "01/01/2023",
 *                            "_id": "64256555160f141a0235d7ba"
 *                          },
 *                          {
 *                            "stage": "Report Week 1",
 *                            "note": "Online",
 *                            "deadline": "08/01/2023",
 *                            "_id": "642555a106832b6c7442918f"
 *                          }
 *                        ]
 *                      },
 *                      "_id": "6424429abb58c59bbec2be57",
 *                      "name": "Project cua Khai edit",
 *                      "status": "Processing",
 *                      "users": [
 *                        {
 *                          "user": "64106a4a65047e0dff8ecc81",
 *                          "role": "Leader",
 *                          "_id": "6424429abb58c59bbec2be58"
 *                        }
 *                      ],
 *                      "createdAt": "20:51:16 29/03/2023",
 *                      "invite": [
 *                        {
 *                          "email": "example@gmail.com",
 *                          "role": "Member",
 *                          "_id": "642bfd9c2a7e6432547910ce"
 *                        },
 *                        {
 *                          "email": "example11@gmail.com",
 *                          "role": "Member",
 *                          "_id": "642dade1213644752b9d89d9"
 *                        }
 *                      ],
 *                      "description": "Description"
 *                    }
 *      400:
 *        description: Vui lòng nhập name, description và status/ProjectId không đúng hoặc người dùng không có quyền chỉnh sửa project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập name, description và status/ProjectId không đúng hoặc người dùng không có quyền chỉnh sửa project
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
// @route PUT api/project/edit/:id
// @desc Cập nhật thông tin project
// @access Private
router.put("/edit/:id", verifyToken, async (req, res) => {
  const { name, description, status } = req.body;
  const projectId = req.params.id;

  // Kiểm tra dữ liệu đầu vào và lưu vào object
  const updateProject = {
    name: name ? name : undefined,
    description: description ? description : undefined,
    status: status ? status : undefined,
  };

  // Lọc các biến đầu vào không được truyền
  const filterUpdateProject = Object.entries(updateProject).reduce(
    (acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    },
    {}
  );

  console.log(filterUpdateProject);

  // Nếu tất cả các biến đầu vào đều không được truyền
  if (Object.keys(filterUpdateProject).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập name, description và status",
    });
  }

  try {
    // Cập nhật tên, mô tả của project có _id là projectId, người dùng hiện tại là Leader của project đó
    const updateProject = await Project.findOneAndUpdate(
      {
        _id: projectId,
        "users.user": req.userId,
        "users.role": "Leader",
      },
      filterUpdateProject,
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
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/list:
 *  get:
 *    summary: Lấy list project của người dùng
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
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
 *                  default: Lấy danh sách thành công
 *                data:
 *                  default:
 *                    [
 *                      {
 *                        "project": {
 *                          "plan": {
 *                            "topic": "Team-Management",
 *                            "target": "Build a website to support team work management",
 *                            "timeline": [
 *                              {
 *                                "stage": "Start",
 *                                "note": "Start project",
 *                                "deadline": "01/01/2023",
 *                                "_id": "64256555160f141a0235d7ba"
 *                              },
 *                              {
 *                                "stage": "Report Week 1",
 *                                "note": "Online",
 *                                "deadline": "08/01/2023",
 *                                "_id": "642555a106832b6c7442918f"
 *                              }
 *                            ]
 *                         },
 *                          "_id": "6424429abb58c59bbec2be57",
 *                          "name": "Project cua Khai edit",
 *                          "status": "Processing",
 *                          "users": [
 *                            {
 *                              "user": "64106a4a65047e0dff8ecc81",
 *                              "role": "Leader",
 *                              "_id": "6424429abb58c59bbec2be58"
 *                            }
 *                          ],
 *                          "createdAt": "20:51:16 29/03/2023",
 *                          "invite": [
 *                            {
 *                              "email": "example@gmail.com",
 *                              "role": "Member",
 *                              "_id": "642bfd9c2a7e6432547910ce"
 *                            },
 *                            {
 *                              "email": "example11@gmail.com",
 *                              "role": "Member",
 *                              "_id": "642dade1213644752b9d89d9"
 *                            }
 *                          ],
 *                          "description": "Description"
 *                        },
 *                        "role": "Leader",
 *                        "_id": "6424429abb58c59bbec2be59"
 *                      },
 *                      {
 *                        "project": {
 *                          "plan": {
 *                            "timeline": []
 *                          },
 *                          "_id": "642be042920f6fa78e9be1bb",
 *                          "name": "Project cua Sheissocute",
 *                          "status": "Processing",
 *                          "users": [
 *                            {
 *                              "user": "642bdfa7920f6fa78e9be1b2",
 *                              "role": "Leader",
 *                              "_id": "642be042920f6fa78e9be1bc"
 *                            },
 *                            {
 *                              "user": "64106a4a65047e0dff8ecc81",
 *                              "role": "Member",
 *                              "_id": "642e66b5b30dd95f1995b1d2"
 *                            }
 *                          ],
 *                          "createdAt": "15:17:55 04/04/2023",
 *                          "invite": [
 *                            {
 *                              "email": "example@gmail.com",
 *                              "role": "Member",
 *                              "_id": "642bfd9f2a7e6432547910d8"
 *                            }
 *                          ],
 *                          "description": "Description"
 *                        },
 *                        "role": "Member",
 *                        "_id": "642e66b5b30dd95f1995b1d1"
 *                      },
 *                    ]
 *      400:
 *        description: Không tìm thấy người dùng
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Không tìm thấy người dùng
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
// @route GET api/project/list
// @desc Lấy list project của người dùng
// @access Private
router.get("/list", verifyToken, async function (req, res) {
  try {
    // Kiểm tra người dùng tồn tại và lấy các project của người dùng
    const user = await User.findById(req.userId).populate("projects.project");
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Lưu các project vào hằng projects
    const projects = user.projects;

    res.json({
      success: true,
      message: "Lấy danh sách thành công",
      data: projects,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/{projectId}:
 *  get:
 *    summary: Lấy thông tin của 1 project
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Lấy thông tin của 1 project
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Lấy thông tin project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Lấy thông tin project thành công
 *                project:
 *                  default:
 *                    {
 *                      "plan": {
 *                        "topic": "Team-Management",
 *                        "target": "Build a website to support team work management",
 *                        "timeline": [
 *                          {
 *                            "stage": "Start",
 *                            "note": "Start project",
 *                            "deadline": "01/01/2023",
 *                            "_id": "64256555160f141a0235d7ba"
 *                          },
 *                          {
 *                            "stage": "Report Week 1",
 *                            "note": "Online",
 *                            "deadline": "08/01/2023",
 *                            "_id": "642555a106832b6c7442918f"
 *                          }
 *                        ]
 *                      },
 *                      "_id": "6424429abb58c59bbec2be57",
 *                      "name": "Project cua Khai",
 *                      "status": "Processing",
 *                      "users": [
 *                        {
 *                          "user": "64106a4a65047e0dff8ecc81",
 *                          "role": "Leader",
 *                          "_id": "6424429abb58c59bbec2be58"
 *                        }
 *                      ],
 *                      "createdAt": "20:51:16 29/03/2023",
 *                      "invite": [
 *                        {
 *                          "email": "example@gmail.com",
 *                          "role": "Member",
 *                          "_id": "642bfd9c2a7e6432547910ce"
 *                        },
 *                        {
 *                          "email": "example11@gmail.com",
 *                          "role": "Member",
 *                          "_id": "642dade1213644752b9d89d9"
 *                        }
 *                      ]
 *                    }
 *      400:
 *        description: Project không tồn tại/Người dùng không là thành viên của project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Project không tồn tại/Người dùng không là thành viên của project
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
// @route GET api/project/:projectId
// @desc Lấy thông tin của 1 project của người dùng hiện tại
// @access Private
router.get("/:projectId", verifyToken, async function (req, res) {
  const projectId = req.params.projectId;

  try {
    const project = await Project.findOne({
      _id: projectId,
      "users.user": req.userId,
    });
    // Kiểm tra project tồn tại
    if (!project) {
      return res.status(400).json({
        success: false,
        message:
          "Project không tồn tại/Người dùng không là thành viên của project",
      });
    }

    res.json({
      success: true,
      message: "Lấy thông tin project thành công",
      project: project,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/delete/{id}:
 *  delete:
 *    summary: Xóa 1 project
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Xóa 1 project theo _id của project
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
 *    responses:
 *      200:
 *        description: Xóa project thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xóa project thành công
 *      400:
 *        description: ProjectId không đúng hoặc người dùng không có quyền xóa project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: ProjectId không đúng hoặc người dùng không có quyền xóa project
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
// @route DELETE api/project/delete/:id
// @desc Xóa 1 project
// @access Private
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const projectId = req.params.id;

  try {
    // Xóa project có _id là projectId, yêu cầu người dùng hiện tại là Leader của project đó
    const deleteProject = await Project.findOneAndDelete({
      _id: projectId,
      "users.user": req.userId,
      "users.role": "Leader",
    });

    // Nếu xóa không thành công
    if (!deleteProject) {
      return res.status(400).json({
        success: false,
        message:
          "ProjectId không đúng hoặc người dùng không có quyền xóa project",
      });
    }

    // Xóa project trong collection users
    const user = await User.findById(req.userId);
    let index = user.projects.findIndex(
      (project) => project.project === projectId
    );
    user.projects.splice(index, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Xóa project thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/{id}/invite:
 *  put:
 *    summary: Mời thành viên tham gia vào project
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Mời thành viên tham gia vào project, chỉ Leader mới có quyền mời thành viên tham gia vào project
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
 *              email:
 *                type: String
 *                default: example@gmail.com
 *              role:
 *                type: String
 *                default: Member
 *    responses:
 *      200:
 *        description: Đã gửi lời mời cho thành viên vào dự án
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Đã gửi lời mời cho thành viên vào dự án
 *      400:
 *        description: Vui lòng nhập địa chỉ email và role/Chỉ leader mới có thể mời thành viên vào dự án/Địa chỉ email này đã được mời vào dự án
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập địa chỉ email và role/Chỉ leader mới có thể mời thành viên vào dự án/Địa chỉ email này đã được mời vào dự án
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
// @route PUT api/project/:id/invite
// @desc Mời thành viên tham gia vào project
// @access Private
router.put("/:id/invite", verifyToken, async (req, res) => {
  const { email, role } = req.body;
  const projectId = req.params.id;
  const _ = require("lodash");

  try {
    // Xác thực cơ bản
    if (!email || !role) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập địa chỉ email và role",
      });
    }

    const project = await Project.findById(projectId);
    // check thành viên đã có trong dự án hay chưa
    const userInvite = await User.findOne({ email: email });
    if (userInvite && _.find(project.users, { user: userInvite._id })) {
      return res.status(400).json({
        success: false,
        message: "Thành viên này đã có trong dự án",
      });
    }
    // check role của người mời
    const user = await User.findById(req.userId);
    const userRole = _.find(project.users, { user: user._id });
    if (!(userRole && userRole.role === "Leader")) {
      return res.status(400).json({
        success: false,
        message: "Chỉ leader mới có thể mời thành viên vào dự án",
      });
    }

    let projectInvite = await ProjectInvite.findOne({ projectId: projectId });
    if (!projectInvite) {
      // Tạo 1 bản ghi trong bảng projectinvites
      projectInvite = new ProjectInvite({
        projectId: projectId,
        users: [{ email: email, role: role }],
      });
    } else {
      const checkEmail = _.find(projectInvite.users, { email: email });
      if (checkEmail) {
        return res.status(400).json({
          success: false,
          message: "Địa chỉ email này đã được mời vào dự án",
        });
      }
      projectInvite.users.push({ email: email, role: role });
    }

    // Thêm project vào tập các project của người dùng
    project.invite.push({ email: email, role: role });

    await projectInvite.save();
    await project.save();

    res.status(200).json({
      success: true,
      message: "Đã gửi lời mời cho thành viên vào dự án",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
