const {
  fetchTicketsByCartId,
  fetchTicketsByCartIdAndEventIdAndType,
} = require("../../db/dbfunctions/ticket.js");

const {
  fetchDiscountsByCartId,
  fetchDiscountsByCartIdAndEventIdAndType,
  removeDiscountById,
} = require("../../db/dbfunctions/discount.js");

/** determines eligible discounts given cart specific tickets
 * @param {number} cartId
 * @returns {object[]} eligibleDiscounts
 * @example
 * returns [{event_id: 1, type: "Family", amount: 2}, {event_id: 2, type: "Group", amount: 1}, ...]
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
    const totalAdultNum = await getTotalAdultNum(cartId, eventId);
    const totalChildNum = await getTotalChildNum(cartId, eventId);

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

/**
 * given a new discount, validate discount for cart
 * @param {number} cartId
 * @param {{type, event_id}} newDiscount
 * @returns {boolean} isValid
 */
const isDiscountValid = async (cartId, newDiscount) => {
  // get eligible discounts, get filtered results
  // compare filtered results with newDiscount,
  // return either true or false
  const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

  const { type, event_id } = newDiscount;
  // find against `fitleredDiscounts`
  const found = eligibleDiscounts.find(
    (discount) => discount.type === type && discount.event_id === event_id
  );

  if (found && found.amount > 0) {
    // is a valid value, if statement for .amount is redundant but for readability
    return true;
  } else {
    return false;
  }
};

/**
 * given a tickets in cart for cartId, **corrects** the amount of registered discounts accordingly
 * @param {number} cartId
 */
const invalidateDiscountForCartId = async (cartId) => {
  const discounts = await fetchDiscountsByCartId(cartId);
  const uniqueEventIds = Array.from(
    new Set(discounts.map((ticket) => ticket.event_id))
  );
  for (let eventId of uniqueEventIds) {
    // fetch all discounts for this eventId and cart
    const familyDiscounts = await fetchDiscountsByCartIdAndEventIdAndType(
      cartId,
      eventId,
      "Family"
    );
    const groupDiscounts = await fetchDiscountsByCartIdAndEventIdAndType(
      cartId,
      eventId,
      "Group"
    );

    const familyDiscountAmount = familyDiscounts.length;
    const groupDiscountAmount = groupDiscounts.length;

    // get total number of adult and child tickets
    const totalAdultNum = (
      await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Adult")
    ).length;
    const totalChildNum = (
      await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Child")
    ).length;

    // discount type: "Family"
    // calculate amount of family discounts eligible!
    const eligibleFamilyDiscountAmount = calculateFamilyDiscount(
      totalAdultNum,
      totalChildNum
    );

    // if at anytime, the amount of applied family discounts exceeds elgiible discounts, we need to remove the discount
    // each removal only guarantees one removal
    if (eligibleFamilyDiscountAmount < familyDiscountAmount) {
      // remove by the difference in the amount
      const difference = familyDiscountAmount - eligibleFamilyDiscountAmount;
      for (let i = 0; i < difference; i++) {
        const discountId = familyDiscounts[i].id;
        await removeDiscountById(discountId);
      }
    }

    // discount type: "Group"
    const eligibleGroupDiscountAmount = calculateGroupDiscount(totalAdultNum);
    // if at anytime, the amount of applied group discounts exceeds elgiible discounts, we need to remove the discount
    // each removal only guarantees one removal
    if (eligibleGroupDiscountAmount < groupDiscountAmount) {
      // remove by the difference in the amount
      const difference = groupDiscountAmount - eligibleGroupDiscountAmount;
      for (let i = 0; i < difference; i++) {
        const discountId = groupDiscounts[i].id;
        await removeDiscountById(discountId);
      }
    }
  }
};

module.exports = {
  determineEligibleDiscountsByTickets,
  isDiscountValid,
  invalidateDiscountForCartId,
};

// HELPER FUNCTIONS

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

// get total number of adult tickets in a cart for a given event... accounting for existing discounts
const getTotalAdultNum = async (cartId, eventId) => {
  const adultTicketNum = (
    await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Adult")
  ).length;
  let undiscountedAdultTicketNum = adultTicketNum;

  // determine if there has been any group discounts given cartId, eventId and type "Adult"
  const groupDiscountNum = (
    await fetchDiscountsByCartIdAndEventIdAndType(cartId, eventId, "Group")
  ).length;

  if (groupDiscountNum > 0) {
    // if there are any group discounts picked up by the query, all the adults have already been discounted, set to `0`
    undiscountedAdultTicketNum = 0;
  } else {
    // if there are no group discounts, then we need to check if there are any family discounts
    const familyDiscountNum = (
      await fetchDiscountsByCartIdAndEventIdAndType(cartId, eventId, "Family")
    ).length;

    if (familyDiscountNum > 0) {
      // if there are any family discounts, we need to subtract from remaining. Each family discount accounts for 2 adults
      undiscountedAdultTicketNum = adultTicketNum - familyDiscountNum * 2;
    }
  }
  return undiscountedAdultTicketNum;
};

// get total number of child tickets in a cart for a given event... accounting for existing discounts
const getTotalChildNum = async (cartId, eventId) => {
  const childTicketNum = (
    await fetchTicketsByCartIdAndEventIdAndType(cartId, eventId, "Child")
  ).length;
  let undiscountedChildTicketNum = childTicketNum;

  // determine if there has been any family discounts given cartId, eventId and type "Child"
  const familyDiscountNum = (
    await fetchDiscountsByCartIdAndEventIdAndType(cartId, eventId, "Family")
  ).length;

  if (familyDiscountNum > 0) {
    // if there are any family discounts picked up by the query, this number is `n`
    const discountedChildNum = familyDiscountNum * 3;
    undiscountedChildTicketNum = childTicketNum - discountedChildNum;
    // can be less than 0, set to 0, can occur when, if (childTicketNum % 3 === 2). IE: 4A, 5C, 2 family discounts
    undiscountedChildTicketNum =
      undiscountedChildTicketNum < 0 ? 0 : undiscountedChildTicketNum;
  }
  return undiscountedChildTicketNum;
};

// construct discount object to correct properties
const constructDiscountObject = (eventId, ticketType, amount) => {
  return {
    event_id: eventId,
    type: ticketType,
    amount: amount,
  };
};
