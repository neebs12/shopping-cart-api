const app = require("../server.js");
const supertest = require("supertest");
const request = supertest(app);

const { removeAllByTableName } = require("../db/dbfunctions/generic.js");
// const { removeTicketByCartId } = require("../db/dbfunctions/ticket.js");

beforeEach(async () => {
  // remove all tickets
  await removeAllByTableName("ticket");
});

afterEach(async () => {});

// happy path test ticket addition
describe("happy path ticket addition", () => {
  it("general admission ticket addition", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 2, seat_id: null, ga_area_id: 1 };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(200);
    // expect the body to have an id property
    expect(response.body).toHaveProperty("id");
  });

  it("general admission ticket double addition", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 2, seat_id: null, ga_area_id: 2 };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const secondResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    // expect the body to have an id property
    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toHaveProperty("id");
  });

  it("allocated ticket addition", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(200);
    // expect the body to have an id property
    expect(response.body).toHaveProperty("id");
  });

  // a cart can have more than one event
  it("allocated ticket addition to cart with other event", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const secondTicket = {
      type: "Adult",
      event_id: 2,
      seat_id: null,
      ga_area_id: 1,
    };
    const secondResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket: secondTicket });

    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body).toHaveProperty("id");
  });
});

// sad path test ticket addition
describe("sad path ticket addition", () => {
  it("invalid seat_id (non existent seat)", async () => {
    const cartId = 200;
    const ticket = {
      type: "Adult",
      event_id: 1,
      seat_id: 999,
      ga_area_id: null,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  it("invalid ga_area_id (non existent ga area)", async () => {
    const cartId = 200;
    const ticket = {
      type: "Adult",
      event_id: 2,
      seat_id: null,
      ga_area_id: 999,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  it("invalid event_id", async () => {
    const cartId = 200;
    const ticket = {
      type: "Adult",
      event_id: 999,
      seat_id: null,
      ga_area_id: 1,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  it("invalid ticket type", async () => {
    const cartId = 200;
    const ticket = {
      type: "sdfsdfsdfsd",
      event_id: 1,
      seat_id: 1,
      ga_area_id: null,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  // seat_id not null for general admission event
  it("incorrect seat_id not null for general admission event", async () => {
    const cartId = 200;
    const ticket = {
      type: "Adult",
      event_id: 2,
      seat_id: 1,
      ga_area_id: 1,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  // ga_area_id not null for allocated event
  it("incorrect ga_area_id not null for allocated event", async () => {
    const cartId = 200;
    const ticket = {
      type: "Adult",
      event_id: 1,
      seat_id: 1,
      ga_area_id: 1,
    };
    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  // check against booking limit of 15 tickets for each event
  it("booking limit of 15 tickets for each cart", async () => {
    const cartId = 201;
    const ticket = { type: "Adult", event_id: 2, seat_id: null, ga_area_id: 1 };
    for (let i = 0; i < 15; i++) {
      const response = await request
        .post(`/cart/${cartId}/ticket`)
        .send({ ticket });
      expect(response.statusCode).toBe(200);
    }

    const response = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  // check against global limit of 50 tickets er ga event
  it("global limit of 50 tickets per ga event", async () => {
    const cartIds = [200, 201, 202, 203];
    const ticket = { type: "Adult", event_id: 2, seat_id: null, ga_area_id: 1 };
    for (let i = 0; i < 50; i++) {
      const response = await request
        .post(`/cart/${cartIds[i % cartIds.length]}/ticket`)
        .send({ ticket });
      expect(response.statusCode).toBe(200);
    }

    const response = await request
      .post(`/cart/${cartIds[0]}/ticket`)
      .send({ ticket });

    expect(response.statusCode).toBe(400);
  });

  // add ticket to the with the same seat_id twice for allocted event
  it("allocated ticket seat_id double addition", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const secondResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    // cannot add on second ticket with existing seat_id
    expect(secondResponse.statusCode).toBe(400);
  });
});
