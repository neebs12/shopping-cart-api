const connection = require("../connection");

function fetchByTableName(tableName, db = connection) {
  return db(tableName).select();
}

// remove all contents of a table
function removeAllByTableName(tableName, db = connection) {
  return db(tableName).del();
}

module.exports = {
  fetchByTableName,
  removeAllByTableName,
};
