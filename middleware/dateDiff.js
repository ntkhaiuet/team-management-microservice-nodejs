function dateDiff(dateStr1, dateStr2) {
  // Tạo một đối tượng ngày mới từ chuỗi đầu vào
  const date1 = new Date(
    dateStr1.split("/")[2], // Năm
    dateStr1.split("/")[1] - 1, // Tháng (giảm đi 1 vì đầu mục bắt đầu từ 0)
    dateStr1.split("/")[0] // Ngày
  );
  const date2 = new Date(
    dateStr2.split("/")[2], // Năm
    dateStr2.split("/")[1] - 1, // Tháng (giảm đi 1 vì đầu mục bắt đầu từ 0)
    dateStr2.split("/")[0] // Ngày
  );

  // Số mili giây trong một ngày
  const oneDay = 24 * 60 * 60 * 1000;

  // Khoảng cách giữa hai ngày tính theo số ngày
  const diffDays = Math.round(Math.abs((date2 - date1) / oneDay));

  return diffDays;
}

module.exports = {
  dateDiff,
};
