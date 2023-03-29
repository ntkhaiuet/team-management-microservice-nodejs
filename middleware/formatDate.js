// Lấy ngày giờ hiện tại
const now = new Date(Date.now());

// Lấy các giá trị của ngày giờ và chuyển sang định dạng 2 chữ số nếu chỉ có 1 chữ số
const hours = String(now.getHours()).padStart(2, "0");
const minutes = String(now.getMinutes()).padStart(2, "0");
const seconds = String(now.getSeconds()).padStart(2, "0");
const day = String(now.getDate()).padStart(2, "0");
const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0, cộng thêm 1 để tính tháng từ 1 đến 12
const year = now.getFullYear();

// Chuyển sang định dạng HH:MM:SS DD/MM/YYYY
const formattedDate = `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;

module.exports = formattedDate;
