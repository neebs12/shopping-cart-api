const express = require("express");
const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger.js");
const ticketDB = require("./db/dbfunctions/ticket.js");

const { ENV } = process.env;

const app = express();

app.use(
  ENV === "DEV"
    ? middleware.requestLogger
    : (req, res, next) => {
        next();
      }
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/cart/:id", async (req, res, next) => {
  try {
    const cartId = Number(req.params.id);
    const content = await ticketDB.fetchTicketsByCartId(cartId);
    res.json(content);
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

app.use((err, req, res, next) => {
  const { type, message } = err;
  if (type === "internal") {
    logger.error(message);
    res.status(500).json("Something went wrong");
  }
});

module.exports = app;
