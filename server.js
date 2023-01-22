const express = require("express");
const middleware = require("./utils/middleware.js");

const { ENV } = process.env;

const app = express();

app.use(ENV === "DEV" ? middleware.requestLogger : () => {});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;
