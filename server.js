const express = require("express");
const middleware = require("./utils/middleware.js");
const ticketDB = require("./db/dbfunctions/ticket.js");

const { ENV } = process.env;

const app = express();

app.use(ENV === "DEV" ? middleware.requestLogger : () => {});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/cart/:id", async (req, res) => {
  const cartId = Number(req.params.id);
  const content = await ticketDB.fetchTicketsByCartId(cartId);
  res.json(content);
});

module.exports = app;
