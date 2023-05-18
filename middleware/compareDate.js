function compareDate(dateString1, dateString2) {
  const date1 = new Date(dateString1.split("/").reverse().join("-"));
  const date2 = new Date(dateString2.split("/").reverse().join("-"));

  if (date1 < date2) {
    return -1;
  } else if (date1 > date2) {
    return 1;
  } else {
    return 0;
  }
}

module.exports = {
  compareDate,
};
