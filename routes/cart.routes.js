const express = require("express");

const ticketDB = require("../db/dbfunctions/ticket.js");

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const cartId = Number(req.params.id);
    const content = await ticketDB.fetchTicketsByCartId(cartId);
    res.json(content);
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

module.exports = router;
