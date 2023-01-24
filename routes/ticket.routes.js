const express = require("express");
const { addTicket, isTicketValid } = require("./helpers/ticket.js");
const { invalidateDiscountForCartId } = require("./helpers/discount.js");
const {
  removeTicketByCartIdAndTicketId,
} = require("../db/dbfunctions/ticket.js");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("hello", res.locals.cardId);
  res.send("Hello World! - from tickets!");
});

/**
 * add a ticket
 * - validate the ticket first
 * - add the ticket to the database
 */
router.post("/", async (req, res, next) => {
  try {
    const cartId = Number(res.locals.cartId);
    const ticket = req.body.ticket;
    const isValidObj = await isTicketValid(cartId, ticket);

    if (isValidObj.isOK === true) {
      // valid ticket! now add to cart!
      const content = await addTicket(cartId, ticket);
      res.json({ id: content });
    } else {
      next({ type: "client", message: isValidObj.message });
    }
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

/**
 * delete a ticket from the cart
 * - ticket has to exist first
 * - ticket has to be in the cart, we can have this info on the number of affected rows when deleting. If `0`, then no deletion took place
 * - once deleted, invalidate any tickets that may have existed before this ticket
 */
router.delete("/:ticket_id", async (req, res, next) => {
  try {
    const ticketId = Number(req.params.ticket_id);
    const cartId = Number(res.locals.cartId);
    const numTicketsDeleted = await removeTicketByCartIdAndTicketId(
      cartId,
      ticketId
    );

    if (numTicketsDeleted === 0) {
      next({
        type: "client",
        message: `Ticket of cart:${cartId} and ticket:${ticketId} does not exist`,
      });
    } else {
      await invalidateDiscountForCartId(cartId);
      res.json({ message: "ticket deleted" });
    }
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

module.exports = router;
