const {
  fetchTicketByTypeAndEventId,
} = require("../../data/ticket-types-service.js");
const {
  addTicketByCartId,
  fetchTicketsByEventId,
  fetchTicketsByCartIdAndEventId,
} = require("../../db/dbfunctions/ticket.js");
const { fetchEventById } = require("../../data/events-service.js");

/**
 * adds a ticket to the database in addition to price
 * @param {number} cartId
 * @param {cartId, eventId, type, price, seat_id, ga_area_id} ticket
 * @returns {number} content (id)
 */
const addTicket = async (cartId, ticket) => {
  const { type, event_id: eventId } = ticket;
  // do a service call to fetch price info to be stored in our db
  const reponse = await fetchTicketByTypeAndEventId(type, eventId);
  const { price } = reponse;
  const content = await addTicketByCartId(cartId, {
    ...ticket,
    price,
  });
  return content;
};

/*
process: 
  0.1) check if the properties are valid
    - if assc eventType is "allocated", seatId must be number, gaAreaId must be null
    - if assc eventType is "generalAdmission", seatId must be null, gaAreaId must be number
  1) address booking limit! 
    - based on cartId, fetch all tickets this cart already has for the SPECIFIC event!
    - if cartTicketsForEvent.length === event.bookingLimit, cannot add anymore tickets for event, then throw error
    - addresses if this cart can add more tickets for itself
  2) "generalAdmission" and globalLimit
    - if event.type === "generalAdmission", then we need to check if the global limit has been reached
    - if globalTicketsForEvent.length === event.globalLimit(which is 50), cannot add anymore tickets for event, then throw error
  3) "generalAdmission" and gaAreaId availabilty
    - get allocated gaAreaIds const gaAreaIds = event.gaAreaIds,
    - check if the gaAreaId is in the gaAreaIds, if not, throw error
  4) "allocated" and seatID availabilty
    - get allocated seat ids const allocatedSeatIds = event.allocatedSeatIds,
    - we want to find out which allocated seats are still available (we get a smaller collection)
*/

/**
 * adds a ticket to the database in addition to price
 * @param {number} cartId
 * @param {cartId, eventId, type, price, seat_id, ga_area_id} ticket
 * @returns {number} content (id)
 */
const isTicketValid = async (cartId, ticket) => {
  try {
    // extract information for ticket and event
    const {
      type: ticketType,
      event_id: eventId,
      seat_id: seatId,
      ga_area_id: gaAreaId,
    } = ticket;

    const event = await fetchEventById(eventId);
    const {
      type: eventType,
      bookingLimit,
      gaAreaIds,
      allocatedSeatIds,
    } = event;

    const cartTicketsForEvent = await fetchTicketsByCartIdAndEventId(
      cartId,
      eventId
    );
    const globalTicketsForEvent = await fetchTicketsByEventId(eventId);

    // see 0.1, validates seatId and gaAreaId
    validateTicketPropertiesByEventType(ticket, eventType);

    // see 1
    checkBookingLimitForCart(cartTicketsForEvent, bookingLimit);

    if ("generalAdmission" === eventType) {
      // see 2
      checkGlobalLimitForGAEvent(globalTicketsForEvent);
      // see 3
      checkGAAreaAvailablilityforGAEvent(gaAreaId, gaAreaIds);
    } else if ("allocated" === eventType) {
      // see 4
      checkSeatAvailabilityForAllocatedEvent(
        seatId,
        allocatedSeatIds,
        globalTicketsForEvent
      );
    }

    return { isOK: true, message: "..." };
  } catch (err) {
    return { isOK: false, message: err.message };
  }
};

module.exports = {
  addTicket,
  isTicketValid,
};

// Helper functions
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

  if (bookedTickets.includes(seatId)) {
    throw new Error("seatId already taken");
  }
};
