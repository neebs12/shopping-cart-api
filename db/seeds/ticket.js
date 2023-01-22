/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("ticket").del();
  await knex("ticket").insert([
    {
      id: 1,
      cart_id: 100,
      event_id: 1,
      type: "Adult",
      price: 25,
      seat_id: 50,
      ga_area_id: null,
    },
    {
      id: 2,
      cart_id: 100,
      event_id: 1,
      type: "Adult",
      price: 25,
      seat_id: 49,
      ga_area_id: null,
    },
    {
      id: 3,
      cart_id: 100,
      event_id: 1,
      type: "Adult",
      price: 25,
      seat_id: 48,
      ga_area_id: null,
    },
    {
      id: 4,
      cart_id: 100,
      event_id: 1,
      type: "Adult",
      price: 25,
      seat_id: 47,
      ga_area_id: null,
    },
    {
      id: 5,
      cart_id: 101,
      event_id: 1,
      type: "Adult",
      price: 25,
      seat_id: 46,
      ga_area_id: null,
    },
    {
      id: 6,
      cart_id: 101,
      event_id: 2,
      type: "Adult",
      price: 25,
      seat_id: null,
      ga_area_id: 1,
    },
  ]);
};
