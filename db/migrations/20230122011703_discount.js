/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("discount", (table) => {
    table.increments("id").primary();
    // type of discount (e.g. Group, Family)
    table.string("type").notNullable();
    // references a specific event (not a table)
    table.integer("event_id").notNullable();
    // FK, cart that ticket belongs to
    table.integer("cart_id").references("id").inTable("cart");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("discount");
};
