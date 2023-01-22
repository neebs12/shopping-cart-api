const express = require("express");
const {
  addTicket,
  validateTicketPropertiesByEventType,
  checkBookingLimitForCart,
  checkGAAreaAvailablilityforGAEvent,
  checkGlobalLimitForGAEvent,
  checkSeatAvailabilityForAllocatedEvent,
} = require("./helpers/ticket.js");
const eventsService = require("../data/events-service.js");
const ticketDB = require("../db/dbfunctions/ticket.js");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("hello", res.locals.cardId);
  res.send("Hello World! - from tickets!");
});

// add a ticket
/*
- When adding a ticket we must consider: 
  - if the cart has reached the bookingLimit for the event assc to the ticket
  - if the ticket is asc to an event of type "allocated", we must check if there are enough tickets left
  - if the ticket is asc to an event of type "allocated", the seat_id must be checked for validity AND availability
    - validity: the seat_id must be a valid seat_id for the event
    - availability: for a ticket to be available, we need to fetch all existing tickets and see if the seat_id is already taken
  - if the ticket is asc to an event of type != "allocated", the seat_id must be null, otherwise, return is an invalid ticket!

process: 
  INPUT: {type, event_id: eventId, seat_id: seatId(optional)} and cartID
  0) [x] initial information 
    - get related specific event and related ticket from cart
    - const event = eventService.fetchEventById(eventId) 
    - const cartTicketsForEvent = ticketDB.fetchTicketsByCartIdAndEventId(cartId, eventId)
    - const globalTicketsForEvent = ticketDB.fetchTicketsByEventId(eventId)
  0.1) [x] check if properties are valid
    - if assc eventType is "allocated", seatId must be number, gaAreaId must be null
    - if assc eventType is "generalAdmission", seatId must be null, gaAreaId must be number
  1) [x] address booking limit! 
    - based on cartId, fetch all tickets this cart already has for the SPECIFIC event!
    - if cartTicketsForEvent.length === event.bookingLimit, cannot add anymore tickets for event, then throw error
    - addresses if this cart can add more tickets for itself
  2) [x] "generalAdmission" and globalLimit
    - if event.type === "generalAdmission", then we need to check if the global limit has been reached
    - if globalTicketsForEvent.length === event.globalLimit(which is 50), cannot add anymore tickets for event, then throw error
  3) [x] "generalAdmission" and gaAreaId availabilty
    - get allocated gaAreaIds const gaAreaIds = event.gaAreaIds,
    - check if the gaAreaId is in the gaAreaIds, if not, throw error
  4) [x] "allocated" and seatID availabilty
    - get allocated seat ids const allocatedSeatIds = event.allocatedSeatIds,
    - we want to find out which allocated seats are still available (we get a smaller collection) - const availableSeatIds = allocatedSeatIds.filter(seatId => !globalTicketsForEvent.some(ticket => ticket.seat_id === seatId))
    - see if the seatId is in the availableSeatIds, if not, throw error
    - this addresses if a seat is available across all carts (prevents double booking)

  Later... now valid, the ticket can be added to the cart, therefore fetch price of the ticket. add it to the object to be added to the db!

  Then... return the created id from the added ticket!
*/
router.post("/", async (req, res, next) => {
  try {
    // extract relevant info from
    // request
    const cartId = Number(res.locals.cartId);
    const { ticket } = req.body;
    const {
      type: ticketType,
      event_id: eventId,
      seat_id: seatId,
      ga_area_id: gaAreaId,
    } = ticket;
    // find relevant info from,
    // event service, event{}
    const event = await eventsService.fetchEventById(eventId);
    const {
      type: eventType,
      bookingLimit,
      gaAreaIds,
      allocatedSeatIds,
    } = event;
    // ticket service, ticket[]
    const cartTicketsForEvent = await ticketDB.fetchTicketsByCartIdAndEventId(
      cartId,
      eventId
    );
    const globalTicketsForEvent = await ticketDB.fetchTicketsByEventId(eventId);

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

    // valid ticket! now add to cart!
    const content = await addTicket(cartId, ticket);
    res.json({ id: content });
  } catch (err) {
    next({ type: "client", message: err.message });
  }
});

module.exports = router;
