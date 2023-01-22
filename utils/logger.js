const info = (...msg) => {
  console.log(">", ...msg);
};

const error = (...msg) => {
  console.error("❌", ...msg);
};

module.exports = {
  info,
  error,
};
