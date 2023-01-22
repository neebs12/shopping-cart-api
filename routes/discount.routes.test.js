const app = require("../server.js");
const supertest = require("supertest");
const request = supertest(app);

const { addTicketsByCartId } = require("../db/dbfunctions/ticket.js");
const { removeAllByTableName } = require("../db/dbfunctions/generic.js");

const cartId = 200;
const adultTicketEvent2 = {
  event_id: 2,
  type: "Adult",
  price: 20,
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
    await addTicketsByCartId(100, Array(4).fill({ ...adultTicketEvent2 }));

    const response = await request.get(`/cart/${cartId}/discount`);
    // cart 200 does not have it
    expect(response.body.discounts.length).toBe(0);
    // cart 100 should have it
    const response2 = await request.get(`/cart/100/discount`);
    expect(response2.body.discounts.length).toBe(1);
  });
});
