const connection = require("../connection");

function fetchByTableName(tableName, db = connection) {
  return db(tableName).select();
}

module.exports = {
  fetchByTableName,
};
