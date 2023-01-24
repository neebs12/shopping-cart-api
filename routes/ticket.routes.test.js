const app = require("../server.js");
const supertest = require("supertest");
const request = supertest(app);

const { removeAllByTableName } = require("../db/dbfunctions/generic.js");
// const {
//   fetchDiscountsByCartId,
//   addDiscountsByCartId,
// } = require("../../db/dbfunctions/discount.js");

beforeEach(async () => {
  // remove all tickets
  await removeAllByTableName("ticket");
  await removeAllByTableName("discount");
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

// happy path ticket deletion
describe("happy path ticket deletion", () => {
  // delete ticket
  it("delete ticket", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const response = await request.delete(
      `/cart/${cartId}/ticket/${firstResponse.body.id}`
    );

    expect(response.statusCode).toBe(200);
  });

  // add a two different tickets to the cart and delete one of them
  it("delete one of two tickets", async () => {
    const cartId = 200;
    const ticket1 = {
      type: "Adult",
      event_id: 1,
      seat_id: 1,
      ga_area_id: null,
    };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket: ticket1 });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const ticket2 = {
      type: "Adult",
      event_id: 1,
      seat_id: 2,
      ga_area_id: null,
    };
    const secondResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket: ticket2 });

    expect(secondResponse.statusCode).toBe(200);

    const response = await request.delete(
      `/cart/${cartId}/ticket/${firstResponse.body.id}`
    );

    expect(response.statusCode).toBe(200);
  });
});

// sad path tikcet deletion
describe("sad path ticket deletion", () => {
  // delete non-existent ticket
  it("delete non-existent ticket", async () => {
    const cartId = 200;
    const response = await request.delete(`/cart/${cartId}/ticket/999`);

    expect(response.statusCode).toBe(400);
  });

  // deleting a ticket from another cart
  it("delete ticket from another cart", async () => {
    const cartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const firstResponse = await request
      .post(`/cart/${cartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);

    const anotherCartId = 201;
    const response = await request.delete(
      `/cart/${anotherCartId}/ticket/${firstResponse.body.id}`
    );

    expect(response.statusCode).toBe(400);

    // confirm is not deleted from the 200's cart
    const getResponse = await request.get(`/cart/${cartId}`);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.tickets.length).toBe(1);
  });

  // delete valid ticket from non-existent cart
  it("delete valid ticket from non-existent cart", async () => {
    const validCartId = 200;
    const ticket = { type: "Adult", event_id: 1, seat_id: 1, ga_area_id: null };
    const firstResponse = await request
      .post(`/cart/${validCartId}/ticket`)
      .send({ ticket });

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body).toHaveProperty("id");

    const invalidCartId = 999;
    console.log({ ticketId: firstResponse.body.id });
    const response = await request.delete(
      `/cart/${invalidCartId}/ticket/${firstResponse.body.id}`
    );

    expect(response.statusCode).toBe(400);
  });
});
