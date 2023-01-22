/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("cart").del();
  await knex("cart").insert([{ id: 100 }, { id: 101 }, { id: 102 }]);
};
