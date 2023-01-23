const express = require("express");
const {
  addDiscountByCartIdAndEventIdAndType,
} = require("../db/dbfunctions/discount.js");
const {
  determineEligibleDiscountsByTickets,
  isDiscountValid,
} = require("./helpers/discount.js");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const cartId = res.locals.cartId;

    // calculate eligible discounts
    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);
    res.json({ discounts: eligibleDiscounts });
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

  // filter by existing discounts
  const filteredDiscounts = await filterByExisingDiscountsForCartId(
    cartId,
    eligibleDiscounts
  );

  res.json({ discounts: filteredDiscounts });
});

module.exports = router;
