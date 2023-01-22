const express = require("express");
const ticketTypesService = require("../data/ticket-types-service.js");
const ticketDB = require("../db/dbfunctions/ticket.js");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("hello", res.locals.cardId);
  res.send("Hello World! - from tickets!");
});

// add a ticket
router.post("/", async (req, res, next) => {
  try {
    const cartId = Number(res.locals.cartId);
    const { ticket } = req.body;
    const { type, event_id: eventId } = ticket;
    const { price } = await ticketTypesService.fetchTicketByTypeAndEventId(
      type,
      eventId
    );
    const content = await ticketDB.addTicketByCartId(cartId, {
      ...ticket,
      price,
    });
    res.json({ id: content });
  } catch (err) {
    next({ type: "client", message: err.message });
  }
});

module.exports = router;
