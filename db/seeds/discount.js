/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("discount").del();
  await knex("discount").insert([
    { id: 1, type: "Group", event_id: 1, cart_id: 100 },
  ]);
};
