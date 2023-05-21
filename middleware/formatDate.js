const moment = require("moment-timezone");

const now = moment().tz("Asia/Ho_Chi_Minh"); // Lấy giờ hiện tại theo múi giờ UTC+7

const formattedDate = now.format("HH:mm:ss DD/MM/YYYY"); // Định dạng ngày giờ

module.exports = formattedDate;
