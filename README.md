# iTICKET Backend Technical Challenge

In our system we have a feature where discounts become available to a user based on the tickets in their cart.

We would like you to create an API that gives access to a basic shopping cart and discounts that can be applied to the cart.

We are here to help. Please ask questions and talk us through your thought process.

## Constraints
- Use a node.js framework of your choice (we use fastify).
- Use a database of your choice (any model).
- Use git version control.
- Write Unit tests etc where appropriate.

## Requirements
The API should allow the client to:
  - Add and remove tickets from the cart.
  - Get a list of discounts that can be applied to the cart in it's current state.
  - Apply a discount to the cart.
  - Not let the cart get into an invalid state.

## Discounts Combos
 - **Group Discount:** 4 or more Adults (10% discount)
 - **Family Discount:** 2 Adults and 2 to 3 Children (Set Price of $70)

___

## Queries
### General:
1. In `event.json`, there are two events. One is of type `allocated` and the `generalAdmission`. Do the `generalAdmission` events have *unlimited seating?* - ie: no restriction to amount of tickets sold?

2. When adding tickets to cart for `allocated` events, is it a requirement for a ticket to be associated with an `allocatedSeatId` when it is booked? 

3. There are two events listed with tickets only defined for one of the events (both ticket types have `"eventId": 1`). I will be adding two ticket types (Child and Adult) to the second event with *reasonably similar* prices. If this is an issue, please let me know.

### Cart Specific: 
1. Can a cart have tickets for more than one event at a time?

### Discount Specific (Group Discount): 
1. When there is a cart with 4 or more Adults and 1 Child, does the 10% discount apply to the whole cart? or just the adults? - see Cart A

2. Is the group discount *event-specific* or *event-agnostic*? IE: cart has 4 Adults, three are for event ONE, one for event TWO, does the group discount still apply to the whole cart? - see Cart B

### Discount Specific (Family Discount): 
1. Are family discounts *event-specific* or *event-agnostic*? IE: if a cart has 2 Adults and 3 Children, 1 Adult and 2 children are booked for event ONE, and 1 adult and 1  can be applied to two families (2 adults, 3 children each). - see Cart C

2. Can family discounts be applied more than once in a cart with sufficient tickets? - see cart D

### Discount Specific (Group and Family Discount Combination):
1. In a case where are cart is eligible for both group and family discount. Can both be applied? or is a cart restricted to one type of discount only? - see Cart E
