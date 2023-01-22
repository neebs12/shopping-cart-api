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

function fetchTicketsByEventId(eventId, db = connection) {
  return db("ticket").select().where("event_id", eventId);
}

function fetchTicketsByCartIdAndEventIdAndType(
  cartId,
  eventId,
  type,
  db = connection
) {
  return db("ticket")
    .select()
    .where("cart_id", cartId)
    .andWhere("event_id", eventId)
    .andWhere("type", type);
}

function addTicketByCartId(cartId, ticket, db = connection) {
  return db("ticket")
    .insert({ ...ticket, cart_id: cartId })
    .then((ids) => ids[0]); // returns db id of the added ticket
}

function addTicketsByCartId(cartId, tickets, db = connection) {
  return db("ticket")
    .insert(
      tickets.map((ticket) => {
        return { ...ticket, cart_id: cartId };
      })
    )
    .then((ids) => ids); // returns the ids of the added tickets
}

function removeTicketByTicketId(ticketId, db = connection) {
  return db("ticket").where("id", ticketId).delete();
}

function removeTicketByCartId(cartId, db = connection) {
  return db("ticket").where("cart_id", cartId).delete();
}

function removeTicketByCartIdAndTicketId(cartId, ticketId, db = connection) {
  return db("ticket")
    .where("cart_id", cartId)
    .andWhere("id", ticketId)
    .delete();
}

module.exports = {
  fetchTicketsByCartId,
  fetchTicketsByCartIdAndEventId,
  fetchTicketsByEventId,
  fetchTicketsByCartIdAndEventIdAndType,
  addTicketByCartId,
  addTicketsByCartId,
  removeTicketByTicketId,
  removeTicketByCartId,
  removeTicketByCartIdAndTicketId,
};
