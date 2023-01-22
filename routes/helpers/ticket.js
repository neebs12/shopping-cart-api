const ticketTypesService = require("../../data/ticket-types-service.js");
const ticketDB = require("../../db/dbfunctions/ticket.js");

const addTicket = async (cartId, ticket) => {
  const { type, event_id: eventId } = ticket;
  const reponse = await ticketTypesService.fetchTicketByTypeAndEventId(
    type,
    eventId
  );
  const { price } = reponse;
  const content = await ticketDB.addTicketByCartId(cartId, {
    ...ticket,
    price,
  });
  return content;
};

const validateTicketPropertiesByEventType = (ticket, eventType) => {
  const { seat_id: seatId, ga_area_id: gaAreaId } = ticket;
  if (eventType === "allocated") {
    if (typeof seatId !== "number") {
      throw new Error("seatId must be a number");
    }
    if (gaAreaId !== null) {
      throw new Error("gaAreaId must be null");
    }
  } else if (eventType === "generalAdmission") {
    if (seatId !== null) {
      throw new Error("seatId must be null");
    }
    if (typeof gaAreaId !== "number") {
      throw new Error("gaAreaId must be a number");
    }
  }
};

const checkBookingLimitForCart = (cartTicketsForEvent, bookingLimit) => {
  const numTickets = cartTicketsForEvent.length;
  // addition of one more ticket for this event for this cart will exceed booking limit
  if (numTickets + 1 > bookingLimit) {
    throw new Error("booking limit reached");
  }
};

const checkGlobalLimitForGAEvent = (globalTicketsForEvent) => {
  const GLOBAL_LIMIT = 50;
  const numTickets = globalTicketsForEvent.length;
  // addition of one more ticket for this event for this cart will exceed booking limit
  if (numTickets + 1 > GLOBAL_LIMIT) {
    throw new Error("global limit reached");
  }
};

const checkGAAreaAvailablilityforGAEvent = (gaAreaId, gaAreaIds) => {
  if (!gaAreaIds.includes(gaAreaId)) {
    throw new Error("gaAreaId not available");
  }
};

const checkSeatAvailabilityForAllocatedEvent = (
  seatId,
  allocatedSeatIds,
  globalTicketsForEvent
) => {
  // checks if ticket's seatId exists in the event's allocatedSeatIds
  if (!allocatedSeatIds.includes(seatId)) {
    throw new Error("seatId not valid");
  }

  const bookedTickets = globalTicketsForEvent.map((ticket) => {
    return ticket.seat_id;
  });

  // console.log({ seatId, allocatedSeatIds, availableTickets });
  if (bookedTickets.includes(seatId)) {
    throw new Error("seatId already taken");
  }
};

module.exports = {
  addTicket,
  validateTicketPropertiesByEventType,
  checkBookingLimitForCart,
  checkGlobalLimitForGAEvent,
  checkGAAreaAvailablilityforGAEvent,
  checkSeatAvailabilityForAllocatedEvent,
};
