function formatUnixTime(unixTime) {
    const date = new Date(unixTime);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng bắt đầu từ 0, cộng thêm 1 để tính tháng từ 1 đến 12
    const year = date.getFullYear();
  
    const formattedDate = `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  
    return formattedDate;
  }
  
  module.exports = formatUnixTime;
  