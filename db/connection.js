const knex = require("knex");
const config = require("./knexfile");
const env = "default";
const connection = knex(config[env]);

module.exports = connection;
