const app = require("./server.js");
const supertest = require("supertest");
const request = supertest(app);

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
