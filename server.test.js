const app = require("./server.js");
const supertest = require("supertest");
const request = supertest(app);

describe("general", () => {
  // test health from "/"
  it("GET /", async () => {
    const response = await request.get("/");
    expect(response.status).toBe(200);
  });

  // test unknown endpoint
  it("GET /unknown", async () => {
    const response = await request.get("/unknown");
    expect(response.status).toBe(400);
  });

  // valid cart but invalid urls after
  it("GET /cart/100/hello", async () => {
    const response = await request.get("/cart/100/hello");
    expect(response.status).toBe(400);
  });

  // test invalid cart id
  it("GET /cart/invalid", async () => {
    const response = await request.get("/cart/999");
    expect(response.status).toBe(400);
  });

  // test valid cart
  it("GET /cart/100", async () => {
    const response = await request.get("/cart/100");
    expect(response.status).toBe(200);
  });
});

describe("workflow on API", () => {
  it("add 4As, apply 1g, remove 1A, invalidate, see 0g", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 2, seat_id: null, ga_area_id: 1 };
    const promises = Array(4)
      .fill(null)
      .map(() => {
        return request.post(`/cart/${cartId}/ticket`).send({ ticket });
      });

    const responses = await Promise.allSettled(promises);
    const ticketIds = responses.map((response) => response.value.body.id);
    // check that all were successful, with status code 200
    responses.forEach((response) => {
      expect(response.status).toBe("fulfilled");
      expect(response.value.statusCode).toBe(200);
    });

    // check that 1 discounts are available for getting
    const inquireDiscount1 = await request.get(`/cart/${cartId}/discount`);
    expect(inquireDiscount1.statusCode).toBe(200);
    expect(inquireDiscount1.body.discounts.length).toBe(1);

    // apply 1g
    const applyResponse = await request
      .post(`/cart/${cartId}/discount`)
      .send({ type: "Group", event_id: 2 });
    // see that this was successful
    expect(applyResponse.statusCode).toBe(200);

    // check that no discounts are available for getting
    const inquireDiscount2 = await request.get(`/cart/${cartId}/discount`);
    expect(inquireDiscount2.statusCode).toBe(200);
    expect(inquireDiscount2.body.discounts.length).toBe(0);

    // delete a ticket to transform cart from 4A to 3A, to invalidate 1g
    const deleteResponse = await request.delete(
      `/cart/${cartId}/ticket/${ticketIds[0]}`
    );
    expect(deleteResponse.statusCode).toBe(200);

    // check that 0 discount is available for getting
    const inquireDiscount3 = await request.get(`/cart/${cartId}/discount`);
    expect(inquireDiscount3.statusCode).toBe(200);
    expect(inquireDiscount3.body.discounts.length).toBe(0);
  });
});
