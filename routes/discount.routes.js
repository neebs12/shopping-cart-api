const express = require("express");
const { fetchTicketsByCartId } = require("../db/dbfunctions/ticket.js");
const { fetchDiscountsByCartId } = require("../db/dbfunctions/discount.js");
const {
  determineEligibleDiscountsByTickets,
  filterByExisingDiscountsForCartId,
} = require("./helpers/discount.js");

const router = express.Router();

router.get("/", async (req, res) => {
  const cartId = res.locals.cartId;

  // calculate eligible discounts
  const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

  // filter by existing discounts
  const filteredDiscounts = await filterByExisingDiscountsForCartId(
    cartId,
    eligibleDiscounts
  );

  res.json({ discounts: filteredDiscounts });
});

module.exports = router;
