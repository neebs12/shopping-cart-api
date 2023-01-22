const connection = require("../connection");

function fetchTicketsByCartId(cartId, db = connection) {
  return db("ticket").select().where("cart_id", cartId);
}

function fetchTicketsByCartIdAndEventId(cartId, eventId, db = connection) {
  return db("ticket")
    .select()
    .where("cart_id", cartId)
    .andWhere("event_id", eventId);
}

function fetchTicketsByEventId(cartId, eventId, db = connection) {
  return db("ticket").select().where("event_id", eventId);
}

function addTicketByCartId(cartId, ticket, db = connection) {
  return db("ticket")
    .insert({ ...ticket, cart_id: cartId })
    .then((ids) => ids[0]); // returns db id of the added ticket
}

function removeTicketByTicketId(ticketId, db = connection) {
  return db("ticket").where("id", ticketId).delete();
}

module.exports = {
  fetchTicketsByCartId,
  fetchTicketsByCartIdAndEventId,
  fetchTicketsByEventId,
  addTicketByCartId,
  removeTicketByTicketId,
};
