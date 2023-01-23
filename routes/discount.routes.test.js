const app = require("../server.js");
const supertest = require("supertest");
const request = supertest(app);

const { addTicketsByCartId } = require("../db/dbfunctions/ticket.js");
const { removeAllByTableName } = require("../db/dbfunctions/generic.js");

const cartId = 200;
const otherCart = 201;
const adultTicketEvent2 = {
  event_id: 2,
  type: "Adult",
  price: 20,
  seat_id: null,
  ga_area_id: 1,
};
const childTicketEvent2 = {
  event_id: 2,
  type: "Child",
  price: 15,
  seat_id: null,
  ga_area_id: 1,
};

beforeEach(async () => {
  // remove all tickets
  await removeAllByTableName("ticket");
  await removeAllByTableName("discount");
});

afterEach(async () => {});

// get all discounts for a cart
describe("get all discounts for a cart", () => {
  it("get all discounts for a cart", async () => {
    const response = await request.get(`/cart/${cartId}/discount`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("discounts");
    expect(response.body.discounts.length).toBe(0);
  });

  it("a cart with 4As has 1G discount", async () => {
    await addTicketsByCartId(cartId, Array(4).fill(adultTicketEvent2));

    const response = await request.get(`/cart/${cartId}/discount`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("discounts");
    expect(response.body.discounts.length).toBe(1);
  });
  it("a different cart with 4As does not affect another cart", async () => {
    await addTicketsByCartId(
      otherCart,
      Array(4).fill({ ...adultTicketEvent2 })
    );

    const response = await request.get(`/cart/${cartId}/discount`);
    // cart 200 does not have it
    expect(response.body.discounts.length).toBe(0);
    // cart 100 should have it
    const response2 = await request.get(`/cart/${otherCart}/discount`);
    expect(response2.body.discounts.length).toBe(1);
  });
});

// add discount to cart
describe("add discount to cart", () => {
  it("...with no tickets", async () => {
    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(400);
    expect(adultResponse.body).toHaveProperty("message");
    expect(adultResponse.body.message).toBe("invalid discount");

    const childResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(childResponse.statusCode).toBe(400);
    expect(childResponse.body.message).toBe("invalid discount");
  });

  it("...with 4As", async () => {
    await addTicketsByCartId(cartId, Array(4).fill(adultTicketEvent2));

    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(200);
    expect(adultResponse.body).toHaveProperty("message");
    expect(adultResponse.body.message).toBe("discount applied");

    // family still none
    const childResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(childResponse.statusCode).toBe(400);
  });

  it("...with 4As in another cart", async () => {
    await addTicketsByCartId(
      otherCart,
      Array(4).fill({ ...adultTicketEvent2 })
    );

    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(400);
  });

  it("...with 4As and 2Cs but discounts by 1g (1f is auto invalidated)", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(200);

    // wait, this shoudldnt happen... if the four adults are discounted, there is not enough adults for a family discount
    const familyResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(familyResponse.statusCode).toBe(400);

    const adultResponse2 = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse2.statusCode).toBe(400);
  });

  it("...with 4As and 2Cs but discounts by 1f (1g is auto invalidated)", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const familyResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(familyResponse.statusCode).toBe(200);

    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(400);
  });

  it("...with 6As and 2Cs but discounts by 1f (1g is still available)", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(6).fill(adultTicketEvent2),
      ...Array(2).fill(childTicketEvent2),
    ]);

    const familyResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(familyResponse.statusCode).toBe(200);

    const adultResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Group" });
    expect(adultResponse.statusCode).toBe(200);
  });

  it("...with 4As and 5Cs but discounts by 1f (1f is still available)", async () => {
    await addTicketsByCartId(cartId, [
      ...Array(4).fill(adultTicketEvent2),
      ...Array(5).fill(childTicketEvent2),
    ]);

    const familyResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(familyResponse.statusCode).toBe(200);

    const familyResponse2 = await request
      .post(`/cart/${cartId}/discount`)
      .send({ event_id: 2, type: "Family" });
    expect(familyResponse2.statusCode).toBe(200);
  });
});
