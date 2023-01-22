const {
  fetchTicketsByCartId,
  fetchTicketsByCartIdAndEventId,
  fetchTicketsByCartIdAndEventIdAndType,
} = require("../../db/dbfunctions/ticket.js");

const {
  fetchDiscountsByCartIdAndEventIdAndType,
} = require("../../db/dbfunctions/discount.js");

// invalidate discounts for cart
const invalidateAnyDiscountsForCartId = async (cartId) => {};

// if there are 4<= adult tickets, then there is ONE group discount
const calculateGroupDiscount = (numOfAdultTickets) => {
  if (numOfAdultTickets >= 4) {
    return 1;
  }
  return 0;
};

// applies number of family discounts given 2A + (2C || 3C)
const calculateFamilyDiscount = (numOfAdultTickets, numOfChildTickets) => {
  const adultPairNum = Math.floor(numOfAdultTickets / 2);
  const childTrioNum = Math.floor(numOfChildTickets / 3);
  const leftoverChildNum = numOfChildTickets - childTrioNum * 3;
  const childNum = childTrioNum + (leftoverChildNum === 2 ? 1 : 0);
  const discountAmount = Math.min(adultPairNum, childNum);

  return discountAmount;
};

// construct discount object to correct properties
const constructDiscountObject = (eventId, ticketType, amount) => {
  return {
    event_id: eventId,
    type: ticketType,
    amount: amount,
  };
};

/** determines eligible discounts given cart specific tickets
 * @param {number} cartId
 * @returns {object[]} eligibleDiscounts
 * @example
 * // returns [{event_id: 1, type: "Family", amount: 2}, {event_id: 2, type: "Group", amount: 1}, ...]
 * */
const determineEligibleDiscountsByTickets = async (cartId) => {
  const tickets = await fetchTicketsByCartId(cartId);
  const uniqueEventIds = Array.from(
    new Set(tickets.map((ticket) => ticket.event_id))
  );

  const eligibleDiscounts = [];
  // iterate over uniqueEventIds and Ticket Types
  for (let eventId of uniqueEventIds) {
    // get counts of each ticket type

    const totalAdultNum = (
      await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Adult")
    ).length;

    const totalChildNum = (
      await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Child")
    ).length;

    // determine eligible discounts
    const groupDiscountAmount = calculateGroupDiscount(totalAdultNum);
    const familyDiscountAmount = calculateFamilyDiscount(
      totalAdultNum,
      totalChildNum
    );

    // construct discount object, not applicable if amount is 0 or less
    if (groupDiscountAmount > 0) {
      eligibleDiscounts.push(
        constructDiscountObject(eventId, "Group", groupDiscountAmount)
      );
    }

    if (familyDiscountAmount > 0) {
      eligibleDiscounts.push(
        constructDiscountObject(eventId, "Family", familyDiscountAmount)
      );
    }
  }

  return eligibleDiscounts;
};

/**given calculated discounts for cart, filter given any already applied discounts
 * @param {number} cartId
 * @param {object[]} eligibleDiscounts
 * @returns {object[]} filteredDiscounts
 * @example
 * // returns [{event_id: 1, type: "Family", amount: 1}, {event_id: 2, type: "Group", amount: 1}, ...]
 * */
const filterByExisingDiscountsForCartId = async (cartId, eligibleDiscounts) => {
  const filteredDiscounts = [];

  for (let discount of eligibleDiscounts) {
    const existingDiscounts = await fetchDiscountsByCartIdAndEventIdAndType(
      cartId,
      discount.event_id,
      discount.type
    );

    const newAmount = discount.amount - existingDiscounts.length;

    // if new amount is more than 0, then we add the discount to filteredDiscounts
    if (newAmount > 0) {
      filteredDiscounts.push({ ...discount, amount: newAmount });
    }
  }
  return filteredDiscounts;
};

module.exports = {
  invalidateAnyDiscountsForCartId,
  determineEligibleDiscountsByTickets,
  filterByExisingDiscountsForCartId,
};
