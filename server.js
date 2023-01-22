const express = require("express");
const middleware = require("./utils/middleware.js");
const logger = require("./utils/logger.js");

const cartRoutes = require("./routes/cart.routes.js");
const ticketRoutes = require("./routes/ticket.routes.js");

const cartDB = require("./db/dbfunctions/cart.js");
const { ENV } = process.env;

const app = express();

app.use(express.json());

app.use(
  ENV === "DEV" ? middleware.requestLogger : middleware.autoNextMiddleware
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Validate and extract cart id
app.all("/cart/:id*", middleware.validateCartId, middleware.extractCartId);

// Routes
app.use("/cart", cartRoutes);
app.use("/cart/:id/ticket", ticketRoutes);

app.all("*", middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
