const { addTicketsByCartId } = require("../../db/dbfunctions/ticket.js");
const {
  fetchDiscountsByCartId,
  addDiscountsByCartId,
} = require("../../db/dbfunctions/discount.js");
const {
  determineEligibleDiscountsByTickets,
  invalidateDiscountForCartId,
} = require("./discount.js");

const { removeAllByTableName } = require("../../db/dbfunctions/generic.js");

const cartId = 200;
const otherCartId = 201;

const adultTicketEvent2 = {
  event_id: 2,
  type: "Adult",
  price: 20,
  seat_id: null,
  ga_area_id: 1,
};
const adultTicketEvent3 = {
  event_id: 3,
  type: "Adult",
  price: 25,
  seat_id: null,
  ga_area_id: 2,
};
const childTicketEvent2 = {
  event_id: 2,
  type: "Child",
  price: 15,
  seat_id: null,
  ga_area_id: 1,
};
const childTicketEvent3 = {
  event_id: 3,
  type: "Child",
  price: 20,
  seat_id: null,
  ga_area_id: 1,
};

const groupDiscountEvent2 = {
  type: "Group",
  event_id: 2,
  cart_id: cartId,
};
const groupDiscountEvent3 = {
  type: "Group",
  event_id: 3,
  cart_id: cartId,
};
const familyDiscountEvent2 = {
  type: "Family",
  event_id: 2,
  cart_id: cartId,
};
const familyDiscountEvent3 = {
  type: "Family",
  event_id: 3,
  cart_id: cartId,
};

const filterDiscounts = (discounts, { eventId = null, type = null }) => {
  return discounts.filter((discount) => {
    const eventMatch = eventId ? discount.event_id === eventId : true;
    // if type is not provided, default to true
    const typeMatch = type ? discount.type === type : true;
    return eventMatch && typeMatch;
  });
};

beforeEach(async () => {
  // remove all tickets
  // global.console.error = jest.fn();
  await removeAllByTableName("ticket");
  await removeAllByTableName("discount");
});

afterEach(async () => {});

// group discount calculation
describe("group discount calculation", () => {
  it("4A tickets - 1g", async () => {
    await addTicketsByCartId(cartId, Array(4).fill(adultTicketEvent2));

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discount
    expect(eligibleDiscounts.length).toBe(1);
    // 1 group discount
    expect(eligibleDiscounts[0].type).toBe("Group");
    // from event_id 2
    expect(eligibleDiscounts[0].event_id).toBe(2);
    // amount: 1
    expect(eligibleDiscounts[0].amount).toBe(1);
  });

  it("8A tickets, one event - 1g", async () => {
    await addTicketsByCartId(cartId, Array(8).fill(adultTicketEvent2));

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discount
    expect(eligibleDiscounts.length).toBe(1);
    // 1 group discount
    expect(eligibleDiscounts[0].type).toBe("Group");
    // from event_id 2
    expect(eligibleDiscounts[0].event_id).toBe(2);
    // amount: 1
    expect(eligibleDiscounts[0].amount).toBe(1);
  });

  it("(4/4)A - 2g", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(4).fill(adultTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const discountObjFor2 = filterDiscounts(eligibleDiscounts, {
      eventId: 2,
      type: "Group",
    })[0];
    const discountObjFor3 = filterDiscounts(eligibleDiscounts, {
      eventId: 3,
      type: "Group",
    })[0];

    // 2 discounts
    expect(eligibleDiscounts.length).toBe(2);
    // for event 2,
    // amount: 1
    expect(discountObjFor2.amount).toBe(1);

    // for event 3
    // amount: 1
    expect(discountObjFor3.amount).toBe(1);
  });

  // group discount only eligible for one of the two events
  it("(5/3)A - 1g", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(5).fill(adultTicketEvent2),
      ...Array(3).fill(adultTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const discountObjFor3 = filterDiscounts(eligibleDiscounts, {
      eventId: 3,
      type: "Group",
    })[0];

    // only 1 discount
    expect(eligibleDiscounts.length).toBe(1);

    // no discount for event 3
    expect(discountObjFor3).toBe(undefined);
  });

  // group discount unavailable for any of the events
  it("(3/3)A, in to two events - NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(3).fill(adultTicketEvent2),
      ...Array(3).fill(adultTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // no discount for 3 Adults - for Event 1, 3 Adults for Event 2
    expect(eligibleDiscounts.length).toBe(0);
  });
});

// family discount calculation
describe("family discount calculation", () => {
  it("1A 2C - NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(1).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    expect(eligibleDiscounts.length).toBe(0);
  });

  it("2A 1C - NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(1).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    expect(eligibleDiscounts.length).toBe(0);
  });

  it("2A 2C - 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discount
    expect(eligibleDiscounts.length).toBe(1);
    // 1 family discount
    expect(eligibleDiscounts[0].type).toBe("Family");
  });

  it("2A 3C - 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(3).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discount
    expect(eligibleDiscounts.length).toBe(1);
    // 1 family discount
    expect(eligibleDiscounts[0].type).toBe("Family");
  });

  it("2A, 10C - 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(10).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discount
    expect(eligibleDiscounts.length).toBe(1);
    // 1 family discount
    expect(eligibleDiscounts[0].type).toBe("Family");
  });

  it("(2/2)A (2/2)C, in two events - 2f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(2).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 2 discounts
    expect(eligibleDiscounts.length).toBe(2);
    // both are family discounts
    expect(eligibleDiscounts[0].type).toBe("Family");
    expect(eligibleDiscounts[1].type).toBe("Family");
  });

  it("(2/2)A, (3/3)C in two events - 2f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(3).fill(childTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(3).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 2 discounts
    expect(eligibleDiscounts.length).toBe(2);
    // both are family discounts
    expect(eligibleDiscounts[0].type).toBe("Family");
    expect(eligibleDiscounts[1].type).toBe("Family");
  });

  it("(2/2)A, (1/1)C in two events - NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(1).fill(childTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(1).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 0 discounts
    expect(eligibleDiscounts.length).toBe(0);
  });

  it("(2/2)A, (1/2) child in two events - 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(1).fill(childTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(2).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discounts
    expect(eligibleDiscounts.length).toBe(1);
    // 1 are family discounts
    expect(eligibleDiscounts[0].type).toBe("Family");
    // for event 3 only
    expect(eligibleDiscounts[0].event_id).toBe(3);
  });

  it("(1/2) adult, (2/2) child in two events - 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(1).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(2).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    // 1 discounts
    expect(eligibleDiscounts.length).toBe(1);
    // 1 are family discounts
    expect(eligibleDiscounts[0].type).toBe("Family");
    // for event 3 only
    expect(eligibleDiscounts[0].event_id).toBe(3);
  });
});

// group-family calculation
describe("Group Family Discount", () => {
  it("4A, 3C - 1g, 1f => apply a 1g, removes 1f eligibility, becomes NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(3).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    })[0];

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    })[0];

    // 2 discounts
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group, 1 family
    expect(groupDiscounts.amount).toBe(1);
    expect(familyDiscounts.amount).toBe(1);

    // add a group ticket to the db for event 2
    await addDiscountsByCartId(cartId, [groupDiscountEvent2]);

    const eligibleDiscounts2 = await determineEligibleDiscountsByTickets(
      cartId
    );

    // NO discount should be left. The family discount is also invalidated
    // that discount should be a family discount
    expect(eligibleDiscounts2.length).toBe(0);

    // add a family ticket to the db for event 2
    await addDiscountsByCartId(cartId, [familyDiscountEvent2]);

    const eligibleDiscounts3 = await determineEligibleDiscountsByTickets(
      cartId
    );

    // no discount left
    expect(eligibleDiscounts3.length).toBe(0);
  });

  it("4A, 4C - 1g, 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(4).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    })[0];

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    })[0];

    // 2 discount types
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group, 1 family
    expect(groupDiscounts.amount).toBe(1);
    expect(familyDiscounts.amount).toBe(1);
  });

  it("4A, 5C - 1g, 2f => applied 1f, now 2A 2C undiscounted so filter to 1f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(5).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    })[0];

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    })[0];

    // 2 discount types
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group, 2 family
    expect(groupDiscounts.amount).toBe(1);
    // eligible for family with 3 children and another for 2 children
    expect(familyDiscounts.amount).toBe(2);

    // invalidate one of the family discounts by writing to the db
    await addDiscountsByCartId(cartId, [familyDiscountEvent2]);

    const eligibleDiscounts2 = await determineEligibleDiscountsByTickets(
      cartId
    );

    const filteredFamilyDiscounts = filterDiscounts(eligibleDiscounts2, {
      type: "Family",
    });

    // 1 discount should be left
    expect(eligibleDiscounts2.length).toBe(1);
    expect(filteredFamilyDiscounts.length).toBe(1);
  });

  it("4A, 6C - 1g, 2f", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(6).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    })[0];

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    })[0];

    // 2 discount types
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group, 2 family
    expect(groupDiscounts.amount).toBe(1);
    expect(familyDiscounts.amount).toBe(2);
  });

  // cross events
  it("(4/4)A, (2/2)C across two events - 2g, 2f => 1g applied on event_id 2, 1f applied to event_id 3, no undiscounted tickets now eligible", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
      ...Array(4).fill(adultTicketEvent3),
      ...Array(2).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    });

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    });

    // 4 discount types
    expect(eligibleDiscounts.length).toBe(4);
    // 1 group, 1 family
    expect(groupDiscounts.length).toBe(2);
    expect(familyDiscounts.length).toBe(2);

    // write a group discount for event_id = 2 in the db
    // write a family discount for event_id = 3 in the db
    await addDiscountsByCartId(cartId, [
      groupDiscountEvent2,
      familyDiscountEvent3,
    ]);

    const eligibleDiscounts2 = await determineEligibleDiscountsByTickets(
      cartId
    );

    // no tickets eligible for discount
    expect(eligibleDiscounts2.length).toBe(0);
  });

  it("(3/4)A, (2/1)C across two events - 1g, 1f => applied non-related discount but still picked up as discounted - NA", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(3).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
      ...Array(4).fill(adultTicketEvent3),
      ...Array(1).fill(childTicketEvent3),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    });

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    });

    // 2 discount types
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group (for event 3), 1 family (for event 2)
    expect(groupDiscounts.length).toBe(1);
    expect(groupDiscounts[0].event_id).toBe(3);
    expect(familyDiscounts.length).toBe(1);
    expect(familyDiscounts[0].event_id).toBe(2);

    // discounts unaffected by discount which exists for other events
    await addDiscountsByCartId(cartId, [
      groupDiscountEvent2,
      familyDiscountEvent3,
    ]);

    const eligibleDiscounts2 = await determineEligibleDiscountsByTickets(
      cartId
    );

    expect(eligibleDiscounts2.length).toBe(0);
  });

  it("6A, 2C - 1g, 1f => apply 1f, 4A remaining - 1g", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(6).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const eligibleDiscounts = await determineEligibleDiscountsByTickets(cartId);

    const groupDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Group",
    });

    const familyDiscounts = filterDiscounts(eligibleDiscounts, {
      type: "Family",
    });

    // 2 discount types
    expect(eligibleDiscounts.length).toBe(2);
    // 1 group, 1 family
    expect(groupDiscounts.length).toBe(1);
    expect(familyDiscounts.length).toBe(1);

    // write a family discount for event_id = 2 in the db
    await addDiscountsByCartId(cartId, [familyDiscountEvent2]);

    const eligibleDiscounts2 = await determineEligibleDiscountsByTickets(
      cartId
    );

    const groupDiscounts2 = filterDiscounts(eligibleDiscounts2, {
      type: "Group",
    });

    // 1 discount should be left and its a group discount
    expect(eligibleDiscounts2.length).toBe(1);
    expect(groupDiscounts2.length).toBe(1);
  });
});

// discount invalidation test
describe("discount invalidation tests", () => {
  it("3A w/ 1g, invalidate 1g", async () => {
    // add 3A
    await addTicketsByCartId(cartId, [...Array(3).fill(adultTicketEvent2)]);
    // force 1g
    await addDiscountsByCartId(cartId, [groupDiscountEvent2]);

    const groupDiscounts1 = await fetchDiscountsByCartId(cartId);

    // 1 discount should be expected in db
    expect(groupDiscounts1.length).toBe(1);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const groupDiscounts2 = await fetchDiscountsByCartId(cartId);
    // discount should have been removed from db
    expect(groupDiscounts2.length).toBe(0);
  });
  it("4A w/ 2g, invalidate 1g, 1 left", async () => {
    // add 4A
    await addTicketsByCartId(cartId, [...Array(4).fill(adultTicketEvent2)]);
    // force 100g
    await addDiscountsByCartId(cartId, [...Array(2).fill(groupDiscountEvent2)]);

    const groupDiscounts1 = await fetchDiscountsByCartId(cartId);

    // 100 discounts should be expected in db
    expect(groupDiscounts1.length).toBe(2);

    // invalidate 99 discounts
    await invalidateDiscountForCartId(cartId);

    const groupDiscounts2 = await fetchDiscountsByCartId(cartId);
    // 1 discount should be left in db
    expect(groupDiscounts2.length).toBe(1);
  });
  it("2A, 1C w/ 1f, 1g, invalidate both", async () => {
    // add 2A, 1C
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(1).fill(childTicketEvent2),
    ]);
    // force 1f, 1g
    await addDiscountsByCartId(cartId, [
      familyDiscountEvent2,
      groupDiscountEvent2,
    ]);

    const discounts1 = await fetchDiscountsByCartId(cartId);

    // 2 discounts should be expected in db
    expect(discounts1.length).toBe(2);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const discounts2 = await fetchDiscountsByCartId(cartId);
    // discount should have been removed from db
    expect(discounts2.length).toBe(0);
  });
  it("3A, 2C w/ 1f, 1g, invalidate 1g only", async () => {
    // add 3A, 2C
    await addTicketsByCartId(cartId, [
      ...Array(3).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);
    // force 1f, 1g
    await addDiscountsByCartId(cartId, [
      familyDiscountEvent2,
      groupDiscountEvent2,
    ]);

    const discounts1 = await fetchDiscountsByCartId(cartId);

    // 2 discounts should be expected in db
    expect(discounts1.length).toBe(2);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const discounts2 = await fetchDiscountsByCartId(cartId);
    // group discount should have been removed from db
    expect(discounts2.length).toBe(1);
    expect(discounts2[0].type).toBe("Family");
  });
  it("4A, 6C w/ 3f, 2g, invalidate 1f, 1g only", async () => {
    // add 4A, 6C
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(6).fill(childTicketEvent2),
    ]);
    // force 3f, 2g
    await addDiscountsByCartId(cartId, [
      ...Array(3).fill(familyDiscountEvent2),
      ...Array(2).fill(groupDiscountEvent2),
    ]);

    const discounts1 = await fetchDiscountsByCartId(cartId);

    // 5 discounts should be expected in db
    expect(discounts1.length).toBe(5);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const discounts2 = await fetchDiscountsByCartId(cartId);
    // 3 discounts should be left in db
    expect(discounts2.length).toBe(3);
    // 1 group, 2 family
    expect(discounts2.filter((d) => d.type === "Group").length).toBe(1);
    expect(discounts2.filter((d) => d.type === "Family").length).toBe(2);
  });
  it("4A w/ 1g, no invalidation", async () => {
    // add 4A
    await addTicketsByCartId(cartId, [...Array(4).fill(adultTicketEvent2)]);
    // force 1g
    await addDiscountsByCartId(cartId, [groupDiscountEvent2]);

    const groupDiscounts1 = await fetchDiscountsByCartId(cartId);

    // 1 discount should be expected in db
    expect(groupDiscounts1.length).toBe(1);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const groupDiscounts2 = await fetchDiscountsByCartId(cartId);
    // discount should be ignored
    expect(groupDiscounts2.length).toBe(1);
  });
  it("4A, 2C w/ 1g, 1f, no invalidation", async () => {
    // add 4A, 2C
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);
    // force 1g, 1f
    await addDiscountsByCartId(cartId, [
      groupDiscountEvent2,
      familyDiscountEvent2,
    ]);

    const discounts1 = await fetchDiscountsByCartId(cartId);

    // 2 discounts should be expected in db
    expect(discounts1.length).toBe(2);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    const discounts2 = await fetchDiscountsByCartId(cartId);
    // discount should be ignored
    expect(discounts2.length).toBe(2);
  });
  it("3A, w/ 1g in another cart, no invalidation for our cart", async () => {
    // add 3A
    await addTicketsByCartId(otherCartId, [
      ...Array(3).fill(adultTicketEvent2),
    ]);
    // force 1g
    await addDiscountsByCartId(otherCartId, [groupDiscountEvent2]);

    const groupDiscounts1 = await fetchDiscountsByCartId(otherCartId);

    // 1 discount should be expected in db
    expect(groupDiscounts1.length).toBe(1);

    // invalidate the discount for cartId (not other cart)
    await invalidateDiscountForCartId(cartId);

    const groupDiscounts2 = await fetchDiscountsByCartId(otherCartId);
    // discount should be ignored
    expect(groupDiscounts2.length).toBe(1);
  });
});

describe("cross event invalidation tests", () => {
  it("(3/4)A w/ (1/1)g, invalidate 1/0g", async () => {
    // add 3A
    await addTicketsByCartId(cartId, [
      ...Array(3).fill(adultTicketEvent2),
      ...Array(4).fill(adultTicketEvent3),
    ]);
    // force 1g for both events
    await addDiscountsByCartId(cartId, [
      groupDiscountEvent2,
      groupDiscountEvent3,
    ]);

    const groupDiscounts1 = await fetchDiscountsByCartId(cartId);

    // 1 discount should be expected in db
    expect(groupDiscounts1.length).toBe(2);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    // only one group discount should remain, and that should be for event 3
    const groupDiscounts2 = await fetchDiscountsByCartId(cartId);
    expect(groupDiscounts2.length).toBe(1);
    expect(groupDiscounts2[0].event_id).toBe(3);
  });

  it("(2/2)A, (1/2) w/ (1/1)f, invalidate 1/0f", async () => {
    // add 2A, 2C
    await addTicketsByCartId(cartId, [
      ...Array(2).fill(adultTicketEvent2),
      ...Array(2).fill(adultTicketEvent3),
      ...Array(1).fill(childTicketEvent2),
      ...Array(2).fill(childTicketEvent3),
    ]);
    // force 1f for both events
    await addDiscountsByCartId(cartId, [
      familyDiscountEvent2,
      familyDiscountEvent3,
    ]);

    const familyDiscounts1 = await fetchDiscountsByCartId(cartId);

    // 1 discount should be expected in db
    expect(familyDiscounts1.length).toBe(2);

    // invalidate the discount
    await invalidateDiscountForCartId(cartId);

    // only one group discount should remain, and that should be for event 3
    const familyDiscounts2 = await fetchDiscountsByCartId(cartId);
    expect(familyDiscounts2.length).toBe(1);
    expect(familyDiscounts2[0].event_id).toBe(3);
  });
});
