const path = require("path");

module.exports = {
  default: {
    client: "sqlite3",
    connection: {
      filename: path.resolve(__dirname, "db.sqlite"),
    },
    useNullAsDefault: true,
  },
};
