const logger = require("./logger");
const cartDB = require("../db/dbfunctions/cart.js");

const requestLogger = (req, res, next) => {
  logger.info("Method: ", req.method);
  logger.info("Path: ", req.path);
  logger.info("Body: ", req.body || "No body");
  logger.info("---");
  next();
};

const autoNextMiddleware = (req, res, next) => {
  next();
};

const validateCartId = async (req, res, next) => {
  try {
    const cartId = Number(req.params.id);
    const content = await cartDB.fetchByCartId(cartId);
    if (content.length === 0) {
      throw new Error("Invalid Cart Id");
    }
    next();
  } catch (err) {
    next({ type: "client", message: err.message });
  }
};

const extractCartId = (req, res, next) => {
  // extracts the cart id to be used by following routes
  res.locals.cartId = req.params.id;
  next();
};

const unknownEndpoint = (req, res, next) => {
  next({ type: "client", message: "Unknown Endpoint" });
};

const errorHandler = (err, req, res, next) => {
  const { type, message } = err;
  logger.error(message);
  if (type === "internal") {
    res.status(500).json({ message });
  } else if (type === "client") {
    res.status(404).json({ message });
  }
};

module.exports = {
  autoNextMiddleware,
  requestLogger,
  validateCartId,
  extractCartId,
  unknownEndpoint,
  errorHandler,
};
