const ticketTypesJSON = require("./ticket-types.json");

// mocked async (ie: external service)
// fetch ticket by type and event_id
const fetchTicketByTypeAndEventId = async (type, eventId) => {
  const ticket = ticketTypesJSON.find(
    (ticket) => ticket.type === type && ticket.eventId === eventId
  );

  if (!ticket) {
    throw new Error(`Ticket of type:${type} and id:${eventId} not found`);
  } else {
    return ticket;
  }
};

module.exports = {
  fetchTicketByTypeAndEventId,
};
