const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const User = require("../models/User");
const Project = require("../models/Project");
const ProjectInvite = require("../models/ProjectInvite");
const Task = require("../models/Task");
const Notification = require("../models/Notification");

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
 *        description:
 *          type: String
 *        status:
 *          type: String
 *          enum: [Processing, Completed]
 *        users:
 *          type: Array
 *          items:
 *            type: object
 *            properties:
 *              email:
 *                type: string
 *              role:
 *                type: string
 *                enum: ["Leader", "Reviewer", "Member"]
 *        createdAt:
 *          type: String
 *      example:
 *        _id: 6422436f9574d6d0650f0059
 *        name: Project cua Khai
 *        description: Mô tả
 *        status: Processing
 *        users: [{email: "ntkhaiuet@gmail.com", role: "Member"}]
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
 *    description: Tạo project mới (name là bắt buộc, description, duedate và listUserInvite có thể không cần truyền)
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
 *              duedate:
 *                default: 01/06/2023
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
 *                project_id:
 *                  default: 6432490b39efd8d33bd9d23b
 *      400:
 *        description: Vui lòng nhập name/Vui lòng mời các người dùng khác nhau/Người dùng được mời không tồn tại (Thêm trường usersInviteNotFound trả về mảng các object trong listUserInvite không tồn tại)/Không tìm thấy người dùng/Project đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập name/Vui lòng mời các người dùng khác nhau/Người dùng được mời không tồn tại (Thêm trường usersInviteNotFound trả về mảng các object trong listUserInvite không tồn tại)/Không tìm thấy người dùng/Project đã tồn tại
 *                usersInviteNotFound:
 *                  default: [
 *                    {
 *                      "email": "example1@gmail.com",
 *                      "role": "Member"
 *                    },
 *                    {
 *                      "email": "example2@gmail.com",
 *                      "role": "Reviewer"
 *                    }
 *                  ]
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
// @desc Tạo 1 project mới
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const { name, description, duedate } = req.body;
  let listUserInvite = req.body.listUserInvite || [];
  let roleUserCreator = "Leader";

  //   Xác thực cơ bản
  if (!name) {
    return res
      .status(400)
      .json({ succes: false, message: "Vui lòng nhập name" });
  }

  // Kiểm tra mảng listUserInvite không trùng lặp
  function hasDuplicateEmails(users) {
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        if (users[i].email === users[j].email) {
          return true;
        }
      }
    }

    return false;
  }

  const hasDuplicates = hasDuplicateEmails(listUserInvite);
  if (hasDuplicates) {
    return res.status(400).json({
      succes: false,
      message: "Vui lòng mời các người dùng khác nhau",
    });
  }

  try {
    // Kiểm tra các người dùng được mời tồn tại
    const existingUsers = await User.find({
      email: { $in: listUserInvite.map((user) => user.email) },
      email_verified: true,
    });

    const usersInviteNotFound = listUserInvite.filter(
      (user) =>
        !existingUsers.some((existingUser) => existingUser.email === user.email)
    );

    if (usersInviteNotFound.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Người dùng được mời không tồn tại",
        usersInviteNotFound: usersInviteNotFound,
      });
    }

    // Kiểm tra người dùng tồn tại và lấy các project của người dùng
    const user = await User.findById(req.userId).populate("projects.project");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra project tên project mới và project đã có của người dùng
    const isProjectExist =
      user.projects &&
      user.projects.some(
        (project) => project.project && project.project.name === name
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
      duedate: duedate || null,
      users: [
        {
          email: req.userEmail,
          role: roleUserCreator,
        },
      ],
    });

    // Thêm project vào tập các project của người dùng
    user.projects.push({ project: project._id, role: roleUserCreator });

    // Tạo 1 bản ghi trong bảng projectinvites
    let projectInvite = new ProjectInvite({
      project: project._id,
      users: [],
    });

    // Thêm user vào tập các user được mời của project
    listUserInvite.forEach(async (element) => {
      projectInvite.users.push({
        email: element.email,
        role: element.role,
        status: "Waiting",
      });
      const userInvite = await User.findOne({ email:element.email })
      const notification = new Notification({
        projectId: project._id,
        userId: userInvite.id,
        content: user.full_name + " đã mời bạn vào project " + project.name,
        type: "Invite",
      });
      await notification.save();
    }); 

    await Promise.all([user.save(), projectInvite.save(), project.save()]);

    res.status(200).json({
      success: true,
      message: "Tạo project thành công",
      project_id: project._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/edit/{id}:
 *  put:
 *    summary: Cập nhật thông tin project
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Cập nhật thông tin project (dành cho Leader)
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
 *                default: MyProject
 *              description:
 *                default: Description
 *              status:
 *                default: Completed
 *              duedate:
 *                default: 02/06/2023
 *              user:
 *                default: {"email": "ntkhaiuet@gmail.com", "role": "Leader"}
 *              teammate:
 *                default: [{"email": sheissocute2001@gmail.com, "role": "Member", "status": "Joined"}, {"email": 19020331@vnu.edu.vn, "role": "Member", "status": "Waiting"}]
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
 *                project_id:
 *                  default: 6432d4134b4a0c0558df66da
 *                project_name:
 *                  default: MyProject6
 *                project_description:
 *                  default: Mô tả
 *                project_status:
 *                  default: Processing
 *                project_duedate:
 *                  default: 02/06/2023
 *                project_progress:
 *                  default: 0
 *                project_createdAt:
 *                  default: 22:03:58 09/04/2023
 *                user:
 *                  default: {
 *                    "email": "ntkhaiuet@gmail.com",
 *                    "role": "Leader",
 *                    "status": "Joined"
 *                  }
 *                teammate:
 *                  default: [
 *                    {
 *                      "email": "example1@gmail.com",
 *                      "role": "Member",
 *                      "status": "Waiting"
 *                    },
 *                    {
 *                      "email": "example2@gmail.com",
 *                      "role": "Reviewer",
 *                      "status": "Waiting"
 *                    }
 *                  ]
 *      400:
 *        description: Vui lòng nhập name hoặc description hoặc status hoặc duedate hoặc user hoặc teammate/Project phải có 1 leader là thành viên đã tham gia nhóm/Tên project đã tồn tại/Người dùng trong user hoặc teammate không tồn tại/ProjectId không đúng hoặc người dùng không có quyền
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập name hoặc description hoặc status hoặc duedate hoặc user hoặc teammate/Project phải có 1 leader là thành viên đã tham gia nhóm/Tên project đã tồn tại/Người dùng trong user hoặc teammate không tồn tại/ProjectId không đúng hoặc người dùng không có quyền
 *                usersNotFound:
 *                  default: [
 *                    {
 *                      "email": "example1@gmail.com",
 *                      "role": "Member",
 *                      "status": "Waiting"
 *                    },
 *                    {
 *                      "email": "example2@gmail.com",
 *                      "role": "Reviewer",
 *                      "status": "Waiting"
 *                    }
 *                  ]
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
  const { name, description, status, duedate, user, teammate } = req.body;
  const projectId = req.params.id;

  // Kiểm tra các trường bắt buộc
  if (!name && !description && !status && !duedate && !user && !teammate) {
    return res.status(400).json({
      success: false,
      message:
        "Vui lòng nhập name hoặc description hoặc status hoặc duedate hoặc user hoặc teammate",
    });
  }

  // Kiểm tra users sau khi sửa có tồn tại Leader không
  if (user && user.role !== "Leader") {
    var isExistLeader = false;

    for (let i = 0; i < teammate.length; i++) {
      if (teammate[i].role === "Leader" && teammate[i].status === "Joined") {
        isExistLeader = true;
        break;
      }
    }

    if (!isExistLeader) {
      return res.status(400).json({
        success: false,
        message: "Project phải có 1 leader là thành viên đã tham gia nhóm",
      });
    }
  }

  try {
    // Kiểm tra project tồn tại
    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(400)
        .json({ success: false, message: "ProjectId không tồn tại" });
    }
    // Kiểm tra name project là duy nhất với mỗi user
    if (project.name !== name) {
      const checkNameProject = await Project.findOne({ name: name });
      if (checkNameProject) {
        return res
          .status(400)
          .json({ success: false, message: "Tên project đã tồn tại" });
      }
    }

    // Dữ liệu cần cập nhật
    let conditionUpdateProject = {};
    if (user && teammate) {
      // Kiểm tra user và teammate tồn tại
      const tempUser = { email: user.email, role: user.role, status: "Joined" };
      const tempTeammate = teammate.slice();
      tempTeammate.push(tempUser);

      const existingUsers = await User.find({
        email: { $in: tempTeammate.map((user) => user.email) },
        email_verified: true,
      });

      const usersNotFound = tempTeammate.filter(
        (user) =>
          !existingUsers.some(
            (existingUser) => existingUser.email === user.email
          )
      );

      if (usersNotFound.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Người dùng trong user hoặc teammate không tồn tại",
          usersNotFound: usersNotFound,
        });
      }

      // Lọc các users đã join project
      const projectUsers = [];
      for (let i = 0; i < teammate.length; i++) {
        if (teammate[i].status === "Joined") {
          projectUsers.push({
            email: teammate[i].email,
            role: teammate[i].role,
          });
        } else {
          const userInvite = await User.findOne({email : teammate[i].email})
          const userAction = await User.findById(req.userId)
          const notification = new Notification({
            projectId: projectId,
            userId: userInvite.id,
            content: userAction.full_name + " đã mời bạn vào project " + project.name,
            type: "Invite",
          });
          await notification.save();
        }
      }
      projectUsers.push(user);
      conditionUpdateProject.users = projectUsers;
    }

    if (name) {
      conditionUpdateProject.name = name;
    }
    if (description) {
      conditionUpdateProject.description = description;
    }
    if (status) {
      conditionUpdateProject.status = status;
    }
    if (duedate) {
      conditionUpdateProject.duedate = duedate;
    }

    // Cập nhật name, description, status, user, teammate của project có _id là projectId, người dùng hiện tại là Leader của project đó
    const updateProject = await Project.findOneAndUpdate(
      {
        _id: projectId,
        "users.user": req.userId,
        "users.role": "Leader",
      },
      conditionUpdateProject,
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

    // Cập nhật users trong projectinvites
    const updateProjectInvites = await ProjectInvite.findOneAndUpdate(
      {
        project: projectId,
      },
      {
        users: teammate,
      },
      {
        new: true,
      }
    );

    // Nếu cập nhật không thành công
    if (!updateProjectInvites) {
      return res.status(400).json({
        success: false,
        message: "ProjectId không đúng",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin project thành công",
      project_id: updateProject._id,
      project_name: updateProject.name,
      project_description: updateProject.description,
      project_status: updateProject.status,
      projejct_duedate: updateProject.duedate,
      projejct_progress: updateProject.progress,
      project_createdAt: updateProject.createdAt,
      user,
      teammate,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/list:
 *  post:
 *    summary: Lấy list project của người dùng
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Lấy list project của người dùng
 *    requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                default: MyProject
 *              role:
 *                default: Leader
 *              status:
 *                default: Processing
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
 *                projects:
 *                  default: [
 *                    {
 *                      "id": "64340d4cf69cad6d56eb26ce",
 *                      "name": "MyProjec3",
 *                      "description": "Mô tả",
 *                      "status": "Processing",
 *                      "duedate": "01/06/2023",
 *                      "progress": "0.9",
 *                      "user": {
 *                        "email": "ntkhaiuet@gmail.com",
 *                        "role": "Leader"
 *                      }
 *                    },
 *                    {
 *                      "id": "64340fa55abd3c60a38e3dd9",
 *                      "name": "MyProjec4",
 *                      "description": "Mô tả",
 *                      "status": "Completed",
 *                      "duedate": "02/06/2023",
 *                      "progress": "1",
 *                      "user": {
 *                        "email": "ntkhaiuet@gmail.com",
 *                        "role": "Leader"
 *                      }
 *                    }
 *                  ]
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
// @route POST api/project/list
// @desc Lấy list project của người dùng
// @access Private
router.post("/list", verifyToken, async function (req, res) {
  const { name, role, status } = req.body;

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
    let filteredProjects = await Promise.all(
      projects.map(async (projectWithUser) => {
        // Lấy user hiện tại
        const currentUser = projectWithUser.project.users.find(
          (users) => users.email === user.email
        );
        return {
          id: projectWithUser.project.id,
          name: projectWithUser.project.name,
          description: projectWithUser.project.description,
          status: projectWithUser.project.status,
          duedate: projectWithUser.project.duedate,
          progress: projectWithUser.project.progress,
          user: {
            email: currentUser.email,
            role: currentUser.role,
          },
        };
      })
    );

    // Lọc kết quả theo query
    if (name) {
      filteredProjects = filteredProjects.filter((project) =>
        project.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (role) {
      filteredProjects = filteredProjects.filter((project) =>
        project.user.role.toLowerCase().includes(role.toLowerCase())
      );
    }
    if (status) {
      filteredProjects = filteredProjects.filter((project) =>
        project.status.toLowerCase().includes(status.toLowerCase())
      );
    }

    res.json({
      success: true,
      message: "Lấy danh sách thành công",
      projects: filteredProjects,
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
 *                project_id:
 *                  default: 6432d4134b4a0c0558df66da
 *                project_name:
 *                  default: MyProject6
 *                project_description:
 *                  default: Mô tả
 *                project_status:
 *                  default: Processing
 *                project_duedate:
 *                  default: 0.5
 *                project_progress:
 *                  default: 0
 *                project_createdAt:
 *                  default: 22:03:58 09/04/2023
 *                user:
 *                  default: {
 *                    "email": "ntkhaiuet@gmail.com",
 *                    "role": "Leader",
 *                    "status": "Joined"
 *                  }
 *                teammate:
 *                  default: [
 *                    {
 *                      "email": "sheissocute2001@gmail.com",
 *                      "role": "Member",
 *                      "status": "Joined",
 *                      "detail": {
 *                        "full_name": "sheissocute",
 *                        "dob": null,
 *                        "phone_number": null,
 *                        "gender": null
 *                      }
 *                    },
 *                    {
 *                      "email": "sheissocute2001@gmail.com",
 *                      "role": "Member",
 *                      "status": "Joined",
 *                      "detail": {
 *                        "full_name": "sheissocute",
 *                        "dob": null,
 *                        "phone_number": null,
 *                        "gender": null
 *                      }
 *                    }
 *                  ]
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

    const projectInvite = await ProjectInvite.findOne({ project: projectId });
    // Kiểm tra projectInvite tồn tại
    if (!projectInvite) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy projectInvite",
      });
    }

    // Tạo mảng lưu thông tin các user
    var listUser = project.users.map(function (user) {
      return { email: user.email, role: user.role, status: "Joined" };
    });

    // Mảng lưu thông tin các user được mời
    const listInvite = projectInvite.users;

    // Gộp 2 mảng không trùng lặp
    const list = listUser.concat(listInvite);
    const listUnique = list.reduce((accumulator, current) => {
      if (!accumulator.find((element) => element.email === current.email)) {
        accumulator.push(current);
      }
      return accumulator;
    }, []);

    // Tìm user trong mảng listUnique
    const index = listUnique.findIndex(
      (element) => element.email == req.userEmail
    );
    const userInfo = listUnique[index];
    // Xóa userInfo trong mảng
    listUnique.splice(index, 1);

    // Thêm trường detail trong teammate
    const promises = listUnique.map((item) => {
      return User.findOne({ email: item.email });
    });

    const usersInTeammate = await Promise.all(promises);

    const listUniqueWithDetails = listUnique.map((item, index) => {
      const userByEmail = usersInTeammate[index];
      return {
        email: item.email,
        role: item.role,
        status: item.status,
        detail: {
          full_name: userByEmail.full_name,
          dob: userByEmail.dob,
          phone_number: userByEmail.phone_number,
          gender: userByEmail.gender,
        },
      };
    });

    res.json({
      success: true,
      message: "Lấy thông tin project thành công",
      project_id: project._id,
      project_name: project.name,
      project_description: project.description,
      project_status: project.status,
      project_duedate: project.duedate,
      project_progress: project.progress,
      project_createdAt: project.createdAt,
      user: userInfo,
      teammate: listUniqueWithDetails,
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
      (project) => project.project == projectId
    );
    user.projects.splice(index, 1);
    await user.save();

    // Xóa project trong collection projectinvites
    await ProjectInvite.findOneAndDelete({ project: projectId });

    // Xóa task trong project
    await Task.deleteMany({ projectId: projectId });

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
 *        description: Vui lòng nhập địa chỉ email và role/Thành viên này đã có trong dự án/Chỉ leader mới có thể mời thành viên vào dự án/Địa chỉ email này đã được mời vào dự án
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập địa chỉ email và role/Thành viên này đã có trong dự án/Chỉ leader mới có thể mời thành viên vào dự án/Địa chỉ email này đã được mời vào dự án
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
    if (_.find(project.users, { email: email })) {
      return res.status(400).json({
        success: false,
        message: "Thành viên này đã có trong dự án",
      });
    }
    // check role của người mời
    const userRole = _.find(project.users, { email: req.userEmail });
    if (!(userRole && userRole.role === "Leader")) {
      return res.status(400).json({
        success: false,
        message: "Chỉ leader mới có thể mời thành viên vào dự án",
      });
    }

    let projectInvite = await ProjectInvite.findOne({ project: projectId });

    const checkEmail = _.find(projectInvite.users, { email: email });
    if (checkEmail) {
      return res.status(400).json({
        success: false,
        message: "Địa chỉ email này đã được mời vào dự án",
      });
    }
    const userInvite = await User.findOne({ email: email })
    const user = await User.findById(req.userId)
    if (userInvite.id !== req.userId) {
      const notification = new Notification({
        projectId: projectId,
        userId: userInvite.id,
        content:
        user.full_name + " đã mời bạn vào project " + project.name,
        type: "Invite",
      });
      await notification.save()
    }
    projectInvite.users.push({ email: email, role: role, status: "Waiting" });

    await projectInvite.save();

    res.status(200).json({
      success: true,
      message: "Đã gửi lời mời cho thành viên vào dự án",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/project/{id}/task/list:
 *  get:
 *    summary: Lấy list task của project
 *    tags: [Projects]
 *    security:
 *      - bearerAuth: []
 *    description: Lấy list task của project
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: ID của project
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
 *                  default: Danh sách task đã được nhóm và sắp xếp
 *                data:
 *                  default: {
 *                    "todo": [
 *                      {
 *                        "_id": "644557cbcd05fe990d904ffe",
 *                        "projectId": "64340d4cf69cad6d56eb26ce",
 *                        "title": "Task đầu tiên",
 *                        "description": "Mô tả task",
 *                        "creator": "ntkhaiuet@gmail.com",
 *                        "assign": "ntkhaiuet@gmail.com",
 *                        "duedate": "30/04/2023",
 *                        "estimate": "4 Hours",
 *                        "status": "Todo",
 *                        "tags": [
 *                          "#Tags1",
 *                          "#Tags2"
 *                        ],
 *                        "createdAt": "23:06:58 23/04/2023",
 *                        "updates": []
 *                      },
 *                      {
 *                        "_id": "64455f793105cb6f4550435a",
 *                        "stage": "Week1",
 *                        "projectId": "64340d4cf69cad6d56eb26ce",
 *                        "title": "Task đầu tiên q1",
 *                        "description": "Mô tả task",
 *                        "creator": "ngoc080701@gmail.com",
 *                        "assign": "ngoc080701@gmail.com",
 *                        "duedate": "30/04/2023",
 *                        "estimate": "4 Hours",
 *                        "status": "Todo",
 *                        "tags": [
 *                          "#Tags1",
 *                          "#Tags2"
 *                        ],
 *                        "createdAt": "23:39:12 23/04/2023",
 *                        "updates": [],
 *                        "order": 0
 *                      }
 *                    ],
 *                    "doing": [],
 *                    "done": [],
 *                    "review": []
 *                  }
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
// @route GET api/project/:id/task/list
// @access Private
router.get("/:id/task/list", verifyToken, async function (req, res) {
  const projectId = req.params.id;

  try {
    // Kiểm tra người dùng tồn tại và lấy các project của người dùng
    const user = await User.findOne({
      _id: req.userId,
      "projects.project": projectId,
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Không tìm thấy người dùng hoặc người dùng không thuộc project",
      });
    }
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy project",
      });
    }
    const listTask = await Task.find({ projectId: projectId }).sort({
      createdAt: 1,
    }); // Sắp xếp theo createdAt tăng dần
    const todo = [];
    const doing = [];
    const done = [];
    const review = [];

    // Phân loại các task vào các mảng tương ứng dựa trên trạng thái
    listTask.forEach((task) => {
      if (task.status === "Todo") {
        todo.push(task);
      } else if (task.status === "Doing") {
        doing.push(task);
      } else if (task.status === "Done") {
        done.push(task);
      } else if (task.status === "Review") {
        review.push(task);
      }
    });

    // Trả về dữ liệu theo định dạng yêu cầu
    const result = {
      todo: todo,
      doing: doing,
      done: done,
      review: review,
    };

    res.status(200).json({
      success: true,
      message: "Danh sách task đã được nhóm và sắp xếp",
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
