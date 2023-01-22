const connection = require("../connection");

function fetchDiscountsByCartId(cartId, db = connection) {
  return db("discount").select().where("cart_id", cartId);
}

function fetchDiscountsByCartIdAndEventId(cartId, eventId, db = connection) {
  return db("discount")
    .select()
    .where("cart_id", cartId)
    .where("event_id", eventId);
}

function fetchDiscountsByCartIdAndEventIdAndType(
  cartId,
  eventId,
  discountType,
  db = connection
) {
  return db("discount")
    .select()
    .where("cart_id", cartId)
    .where("event_id", eventId)
    .where("type", discountType);
}

// returns the id of the inserted row
function addDiscountByCartIdAndEventIdAndType(
  cartId,
  eventId,
  discountType,
  db = connection
) {
  return db("discount")
    .insert({
      cart_id: cartId,
      event_id: eventId,
      type: discountType,
    })
    .then((ids) => ids[0]);
}

// adds discounts by discount objects
function addDiscountsByCartId(cartId, discounts, db = connection) {
  return db("discount")
    .insert(
      discounts.map((discount) => {
        return { ...discount, cart_id: cartId };
      })
    )
    .then((ids) => ids); // returns the ids of the added tickets
}

// returns the number of rows deleted
function removeDiscountById(discountId, db = connection) {
  return db("discount").where("id", discountId).del();
}

// returns the number of rows deleted
function removeDiscountByCartIdAndEventIdAndType(
  cartId,
  eventId,
  discountType,
  db = connection
) {
  return db("discount")
    .where("cart_id", cartId)
    .where("event_id", eventId)
    .where("type", discountType)
    .del();
}

module.exports = {
  fetchDiscountsByCartId,
  fetchDiscountsByCartIdAndEventId,
  fetchDiscountsByCartIdAndEventIdAndType,
  addDiscountByCartIdAndEventIdAndType,
  addDiscountsByCartId,
  removeDiscountById,
  removeDiscountByCartIdAndEventIdAndType,
};
