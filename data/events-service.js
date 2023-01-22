const eventsJSON = require("./events.json");

// mocked async (ie: external service)
// fetch event by id
const fetchEventById = async (id) => {
  const event = eventsJSON.find((event) => event.id === id);
  if (event.length === 0) {
    throw new Error(`Event of id:${id} not found`);
  } else {
    return event;
  }
};

module.exports = {
  fetchEventById,
};
