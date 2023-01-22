/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("ticket", (table) => {
    table.increments("id").primary();
    // FK, cart that ticket belongs to
    table.integer("cart_id").references("id").inTable("cart");
    // references a specific event (not a table)
    table.integer("event_id").notNullable();
    // type of ticket (e.g. Adult, Child)
    table.string("type").notNullable();
    // price of ticket, integer for simplicity, consider decimal()
    table.integer("price").notNullable();
    // seat number, can be null for general admission events
    table.integer("seat_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("ticket");
};
