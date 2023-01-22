const connection = require("../connection");

function fetchByCartId(cardId, db = connection) {
  return db("cart").select().where("id", cardId);
}

module.exports = {
  fetchByCartId,
};
