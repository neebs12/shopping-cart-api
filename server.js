const express = require("express");
const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger.js");
const cartDB = require("./db/dbfunctions/cart.js");
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

// this is a catch all middleware to handle all routes that start with /cart/:id. This is to identify if the cart id is valid or not.
app.all("/cart/:id*", async (req, res, next) => {
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

app.all("*", (req, res, next) => {
  next({ type: "client", message: "Unknown Endpoint" });
});

app.use((err, req, res, next) => {
  const { type, message } = err;
  logger.error(message);
  if (type === "internal") {
    res.status(500).json({ message });
  } else if (type === "client") {
    res.status(404).json({ message });
  }
});

module.exports = app;
