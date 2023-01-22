const logger = (...msg) => {
  console.log(">", ...msg);
};

const requestLogger = (req, _res, next) => {
  logger("Method: ", req.method);
  logger("Path: ", req.path);
  logger("Body: ", req.body);
  logger("---");
  next();
};

module.exports = {
  requestLogger,
};
