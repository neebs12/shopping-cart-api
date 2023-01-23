const {
  fetchTicketsByCartId,
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

// get total number of adult tickets in a cart for a given event
// need to account for existing discounts
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
    // can be less than 0, if (childTicketNum % 3 === 2). IE: 4A, 5C, 2 family discounts
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

    const totalAdultNum = await getTotalAdultNum(cartId, eventId);
    const totalChildNum = await getTotalChildNum(cartId, eventId);
    // console.log({ totalAdultNum, totalChildNum, eventId });

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

const invalidateDiscountForCartId = async (cartId) => {
  // so the tickets are already deleted and the collection has been modified.
  // given the new collection of tickets determine if the current collection of discounts are still valid
  // if it is not valid, we need to remove those discounts until the collection of tickets is valid again
  // - fetch all the discounts for the cart
  // - get all the unique event_ids for the cart `uniqueEventIds`
  // - iterate over `uniqueEventIds` to get the amount of "Group" and "Family" type discounts to get `groupDiscountAmount` and `familyDiscountAmount`
  // - get the total number of "Adult" and "Child" tickets for each event_id
  //   - NOT accounting for exisiting discounts! `adultNum` `childNum`
  // - use `eligibleFamilyDiscount` = `calculateEligibleFamilyDiscount(adultNum, childNum)`
  // - if there are any discrepancy between `eligibleFamilyDiscount` and `familyDiscountAmount` (ie: `eligibleFamilyDiscount` < `familyDiscountAmount`), then we need to remove the family discount! (so we need to fetch an id and remove that by that id)
  // - use `eligibleGroupDiscount` = `calculateEligibleGroupDiscount(adultNum)`
  // - if there are any discrepancy between `eligibleGroupDiscount` and `groupDiscountAmount` (ie: `eligibleGroupDiscount` < `groupDiscountAmount`), then we need to remove the group discount! (so we need to fetch an id and remove that by that id)
  // at this point, the discounts are valid again
};

module.exports = {
  invalidateAnyDiscountsForCartId,
  determineEligibleDiscountsByTickets,
  isDiscountValid,
};
