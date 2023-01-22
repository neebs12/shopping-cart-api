const connection = require("../connection");

function fetchTicketsByCartId(cartId, db = connection) {
  return db("ticket").select().where("cart_id", cartId);
}

function addTicketByCartId(ticket, cartId, db = connection) {
  return db("ticket")
    .insert({ ...ticket, cart_id: cartId })
    .then((ids) => ids[0]); // returns db id of the added ticket
}

function removeTicketByTicketId(ticketId, db = connection) {
  return db("ticket").where("id", ticketId).delete();
}

module.exports = {
  fetchTicketsByCartId,
  addTicketByCartId,
  removeTicketByTicketId,
};
