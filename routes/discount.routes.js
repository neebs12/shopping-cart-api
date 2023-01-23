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

router.post("/", async (req, res, next) => {
  try {
    const cartId = res.locals.cartId;
    const newDiscount = req.body;
    // need to validate the discount isDiscountValid(cartId, newDiscount)
    const isValid = await isDiscountValid(cartId, newDiscount);
    if (!isValid) {
      res.status(400).json({ message: "invalid discount" });
    } else {
      // add to db
      await addDiscountByCartIdAndEventIdAndType(
        cartId,
        newDiscount.event_id,
        newDiscount.type
      );
      res.json({ message: "discount applied" });
    }
  } catch (err) {
    next({ type: "internal", message: err.message });
  }
});

module.exports = router;
