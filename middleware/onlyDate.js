const moment = require("moment-timezone");

// Lấy giờ hiện tại theo múi giờ UTC+7
const now = moment().tz("Asia/Ho_Chi_Minh");

// Lấy các giá trị của ngày và chuyển sang định dạng 2 chữ số nếu chỉ có 1 chữ số
const day = now.format("DD");
const month = now.format("MM");
const year = now.format("YYYY");

// Chuyển sang định dạng DD/MM/YYYY
const onlyDate = `${day}/${month}/${year}`;

module.exports = onlyDate;
