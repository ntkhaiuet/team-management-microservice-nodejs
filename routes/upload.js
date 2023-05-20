const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const router = express.Router();
const verifyToken = require("../middleware/auth");

const { dateDiff } = require("../middleware/dateDiff");

const Project = require("../models/Project");
const User = require("../models/User");
const formattedDate = require("../middleware/formatDate");
const Folder = require("../models/Folder");

// Khởi tạo AWS S3 client
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION
});

// Cấu hình multer để lưu trữ tệp ảnh vào S3
const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET,
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: function (req, file, cb) {
        cb(null, Date.now().toString() + '-' + file.originalname);
      }
    }),
    fileFilter: function (req, file, cb) {
        const allowedFileTypes = [
          'image/jpeg',
          'image/png',
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/zip',
          'application/x-rar-compressed',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'video/mp4'
        ];
        if (allowedFileTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type.'));
        }
      },
    limits: { fileSize: 30 * 1024 * 1024 } // Giới hạn kích thước tệp tin (30MB)
  });

/**
 * @swagger
 * /api/upload/{folderId}:
 *  post:
 *    summary: upload tài liệu lên 1 folder
 *    tags: [Folders]
 *    security:
 *      - bearerAuth: []
 *    description: upload tài liệu lên 1 folder
 *    parameters:
 *      - in: path
 *        name: folderId
 *        schema:
 *          type: string
 *        required: true
 *        description: Id của folder
 *    requestBody:
 *      required: true
 *      content:
 *        multipart/form-data:
 *          schema:
 *            type: object
 *            properties:
 *              files:
 *                type: string
 *                format: binary
 *    responses:
 *      200:
 *        description: Upload thành công
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: true
 *                message:
 *                  default: upload thành công
 *      400:
 *        description: project/ProjectId không đúng/User không tồn tại hoặc không thuộc project
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success:
 *                  default: false
 *                message:
 *                  default: project/ProjectId không đúng/User không tồn tại hoặc không thuộc project
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
// @route POST api/upload/:folderId
// @desc Upload tài liệu lên folder
// @access Private
router.post('/:folderId', upload.array('files', 10), verifyToken, async (req, res) => {
  const folderId = req.params.folderId;
  try {
    let uploadFolder = await Folder.findById(folderId);
    if (!uploadFolder) {
      return res
        .status(400)
        .json({ success: false, message: "Id không tồn tại" });
    }
    const user = await User.findOne( {_id : req.userId, "projects.project": uploadFolder.projectId } )
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User không tồn tại hoặc không thuộc project",
      });
    }
    let items = [];
    if (req.files && req.files.length > 0) {
      const urls = req.files.map(file => file.location);
      urls.forEach(url => {
        const item = {
          url: url,
          author: user.full_name
        };
        items.push(item);
      });
    } else {
      res.status(400).json({ error: 'No files provided' });
    }

    if (items.length > 0) {
      uploadFolder.items.push(...items);
    }
    
    await uploadFolder.save();
    res.status(200).json({ success: true, message: "Upload file thành công" });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
  });
  

module.exports = router;
