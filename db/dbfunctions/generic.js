const connection = require("../connection");

function getByTableName(tableName, db = connection) {
  return db(tableName).select();
}

module.exports = {
  getByTableName,
};
