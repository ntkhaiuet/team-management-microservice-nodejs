const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth");

const { dateDiff } = require("../middleware/dateDiff");

const Project = require("../models/Project");
const User = require("../models/User");
const formattedDate = require("../middleware/formatDate");
const Folder = require("../models/Folder");


/**
 * @swagger
 * tags:
 *  name: Folders
 *  description: Quản lý API Folder
 */

/**
 * @swagger
 * /api/folder/create:
 *  post:
 *    summary: Tạo 1 folder mới
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: Tạo 1 folder mới
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              name:
 *                default: Foler_1
 *              project:
 *                default: 6434449455e477a461272f9b
 *              parentFolder:
 *                default: id parent folder
 *    responses:
 *      200:
 *        description: Tạo folder mới thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo folder mới thành công
 *                data:
 *                  default: {
 *                    "_id": "646883341be7524f31c9fd46",
 *                    "name": "Foler_4",
 *                    "projectId": "6434449455e477a461272f9b",
 *                    "parentFolder": null,
 *                    "path": "Foler_4",
 *                    "items": [],
 *                    "createdAt": "23:11:29 20/04/2023"
 *                  }
 *      400:
 *        description: Vui lòng nhập name, project/ProjectId không đúng/User không tồn tại hoặc không thuộc project/Name đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập name, project/ProjectId không đúng/User không tồn tại hoặc không thuộc project/Name đã tồn tại
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
// @route POST api/folder/create
// @desc Tạo 1 folder mới
// @access Private
router.post("/create", verifyToken, async (req, res) => {
  const {
    name,
    parentFolder,
    project,
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!name || !project) {
    return res.status(400).json({
      success: false,
      message:
        "Vui lòng nhập name, project",
    });
  }

  try {
    // Sử dụng Promise.all để thực hiện các tác vụ kiểm tra đồng thời
    const [existsFolder, checkProject, user] =
      await Promise.all([
        Folder.find( {projectId : project, name : name, parentFolder : parentFolder ?? null} ),
        Project.findById(project),
        User.findOne({ _id: req.userId, "projects.project": project }),
      ]);

    if (!checkProject) {
        return res
          .status(400)
          .json({ success: false, message: "ProjectId không đúng" });
      }

    if (existsFolder.length) {
      return res.status(400).json({
        success: false,
        message:
          "Tên folder đã tồn tại",
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại hoặc không thuộc project",
      });
    }

    const regex = /^[^\\/:*?"<>|]+$/;
    if (!regex.test(name)) {
      return res.status(400).json({
        success: false,
        message: "Tên folder không hợp lệ",
      });
    }

    let path = name;
    let depth = 1;
    if (parentFolder) {
      const parent = await Folder.findOne( {projectId : project, _id : parentFolder} )
      if (!parent) {
        return res.status(400).json({
          success: false,
          message:
            "Không tồn tại parent folder",
        });
      }
      if (parent.name == name) {
        return res.status(400).json({
          success: false,
          message:
            "Không được đặt tên trùng với folder cha",
        });
      }
      path = parent.path + "/" + name
      depth = parent.depth + 1
    }
    // Tạo folder mới
    const newFolder = new Folder({
      projectId: project,
      name: name,
      parentFolder : parentFolder,
      path: path,
      depth: depth
    });

    await newFolder.save();

    res.status(200).json({
      success: true,
      message: "Tạo folder mới thành công",
      data: {
        _id: newFolder._id,
        name: newFolder.name,
        projectId: newFolder.projectId,
        parentFolder: newFolder.parentFolder,
        path: newFolder.path,
        depth: newFolder.depth,
        items: [],
        createdAt: newFolder.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/folder/list/{projectId}:
 *  get:
 *    summary: Lấy danh sách folder của project
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: Lấy danh sách folder của project
 *    parameters:
 *      - in: path
 *        name: projectId
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của project
 *    responses:
 *      200:
 *        description: Lấy danh sách thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Tạo folder mới thành công
 *                data:
 *                  default: {
 *                    "_id": "646883341be7524f31c9fd46",
 *                    "name": "Foler_4",
 *                    "projectId": "6434449455e477a461272f9b",
 *                    "parentFolder": null,
 *                    "path": "Foler_4",
 *                    "items": [],
 *                    "createdAt": "23:11:29 20/04/2023"
 *                  }
 *      400:
 *        description: Vui lòng nhập name, project/ProjectId không đúng/User không tồn tại hoặc không thuộc project/Name đã tồn tại
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: Vui lòng nhập name, project/ProjectId không đúng/User không tồn tại hoặc không thuộc project/Name đã tồn tại
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
// @route GET api/folder/list/:projectId
// @desc Lấy danh sách folder của project
// @access Private
router.get("/list/:projectId", verifyToken, async (req, res) => {

  try {
    const projectId = req.params.projectId;
    // Sử dụng Promise.all để thực hiện các tác vụ kiểm tra đồng thời
    const [checkProject, user] =
      await Promise.all([
        Project.findById(projectId),
        User.findOne({ _id: req.userId, "projects.project": projectId }),
      ]);

    if (!checkProject) {
        return res
          .status(400)
          .json({ success: false, message: "ProjectId không đúng" });
      }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại hoặc không thuộc project",
      });
    }

    const listFolder = await Folder.find( {projectId : projectId} )

    res.status(200).json({
      success: true,
      message: "Lấy danh sách thành công",
      data: listFolder
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});


/**
 * @swagger
 * /api/folder/delete/{id}:
 *  delete:
 *    summary: Xóa 1 folder
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: Xóa 1 folder theo Id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của folder
 *    responses:
 *      200:
 *        description: Xóa folder thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xóa folder thành công
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
// @route DELETE api/folder/delete/:id
// @desc Xóa 1 folder
// @access Private
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  try {
    const deleteFolder = await Folder.findByIdAndDelete(id);
    if (!deleteFolder) {
      return res
        .status(400)
        .json({ success: false, message: "Id không tồn tại" });
    }

    res.status(200).json({ success: true, message: "Xóa folder thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/folder/update/{id}:
 *  put:
 *    summary: Update 1 folder
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: Đổi tên, di chuyển ra thành folder cha hoặc sang làm folder con của 1 folder khác
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của folder
 *    requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  default: Foler_Change
 *                parentFolder:
 *                  example: id parent folder, muốn là folder gốc thì parentFolder = 0
 *    responses:
 *      200:
 *        description: Thay đổi thông tin folder thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Thay đổi thông tin folder thành công
 *                data:
 *                  default: {
 *                    "_id": "646883341be7524f31c9fd46",
 *                    "name": "Foler_4",
 *                    "projectId": "6434449455e477a461272f9b",
 *                    "parentFolder": null,
 *                    "path": "Foler_4",
 *                    "items": [],
 *                    "createdAt": "23:11:29 20/04/2023"
 *                  }
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
// @route PUT api/folder/delete/:id
// @desc Thay đổi thông tin folder
// @access Private
router.put("/update/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const {
    name,
    parentFolder,
  } = req.body;
  try {
    const updateFields = {};
    let uploadFolder = await Folder.findById(id);
    if (!uploadFolder) {
      return res
        .status(400)
        .json({ success: false, message: "Id không tồn tại" });
    }
    let path = uploadFolder.path
    let nameFolder = uploadFolder.name
    const regex = /^[^\\/:*?"<>|]+$/;
    if (name) {
      if (!regex.test(name)) {
        return res.status(400).json({
          success: false,
          message: "Tên folder không hợp lệ",
        });
      }
      updateFields.name = name;
      nameFolder = name
      path = path.replace(uploadFolder.name, name)
      updateFields.path = path
    }
    
    if (typeof(parentFolder) !== "undefined") {
      if (parentFolder === 0) {
        updateFields.parentFolder = null
        updateFields.path = nameFolder
        updateFields.depth = 1
      } else {
        const oldParent = await Folder.findById(uploadFolder.parentFolder)
        const newParent = await Folder.findById(parentFolder)
        updateFields.parentFolder = parentFolder
        updateFields.depth = newParent.depth + 1
        if (newParent.name == nameFolder) {
          return res.status(400).json({
            success: false,
            message:
              "Không được đặt tên trùng với folder cha",
          });
        }
        if (oldParent) {
          path = path.replace(oldParent.name, newParent.name)
        } else {
          path = newParent.name + "/" + nameFolder
        }
        updateFields.path = path
      }
    }

    const existsFolder = await Folder.findOne({projectId : uploadFolder.projectId, name : updateFields.name, parentFolder : updateFields.parentFolder ?? null})
    if (existsFolder) {
      return res.status(400).json({
        success: false,
        message: "Đã có folder tương tự trong project",
      });
    }
    uploadFolder = Object.assign(uploadFolder, updateFields);
    await uploadFolder.save()

    res.status(200).json({
      success: true,
      message: "chỉnh sửa thông tin folder thành công",
      data: {
        _id: uploadFolder._id,
        name: uploadFolder.name,
        projectId: uploadFolder.projectId,
        parentFolder: uploadFolder.parentFolder,
        path: uploadFolder.path,
        depth: uploadFolder.depth,
        items: uploadFolder.items,
        createdAt: uploadFolder.createdAt,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

/**
 * @swagger
 * /api/folder/delete/{id}/{itemId}:
 *  delete:
 *    summary: Xóa 1 item tron folder
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: Xóa 1 folder theo Id
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của folder
 *      - in: path
 *        name: itemId
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của item
 * 
 *    responses:
 *      200:
 *        description: Xóa item thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: Xóa item thành công
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
// @route DELETE api/folder/delete/:id/:itemId
// @desc Xóa 1 item trong folder
// @access Private
router.delete("/delete/:id/:itemId", verifyToken, async (req, res) => {
  const id = req.params.id;
  const itemId = req.params.itemId;

  try {
    const folder = await Folder.findById(id);
    if (!folder) {
      return res
        .status(400)
        .json({ success: false, message: "Id Folder không tồn tại" });
    }

    // Tìm vị trí của phần tử trong mảng `items` dựa trên `itemId`
    const itemIndex = folder.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res
        .status(400)
        .json({ success: false, message: "Id Item không tồn tại" });
    }

    // Xóa phần tử khỏi mảng `items`
    folder.items.splice(itemIndex, 1);

    // Lưu cập nhật của `Folder`
    await folder.save();

    res.status(200).json({ success: true, message: "Xóa item thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});


module.exports = router;
