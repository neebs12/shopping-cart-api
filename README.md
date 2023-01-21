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
2. Are there any restrictions to the amount of tickets a cart can have apart from the `bookingLimits` imposed by the events themselves? 

### Discount Specific (Group Discount): 
1. When there is a cart with 4 or more Adults and 1 Child, does the 10% discount apply to the whole cart? or just the adults? - see Cart A

![image](https://user-images.githubusercontent.com/51255216/213882307-8c11d27e-5b2b-46c5-957d-f44839be2311.png)

2. Is the group discount *event-specific* or *event-agnostic*? If I have 4 Adults spread in to multiple events, does the group discount apply? - see Cart B

![image](https://user-images.githubusercontent.com/51255216/213882311-f75fad0c-110b-4f1e-b4a3-820635dab95c.png)

### Discount Specific (Family Discount): 
1. Are family discounts *event-specific* or *event-agnostic*? If I have a family spread through multiple events, does the family discount still apply? - see Cart C

![image](https://user-images.githubusercontent.com/51255216/213882316-4e69e086-b7ea-4de0-8436-ecacc1d0cc0c.png)

2. Can family discounts be applied more than once in a cart with sufficient tickets? - see cart D

![image](https://user-images.githubusercontent.com/51255216/213882327-b56f737f-d200-48d4-a03e-b9bed7031645.png)

### Discount Specific (Group and Family Discount Combination):
1. In a case where are cart is eligible for both group and family discount. Can both be applied? or is a cart restricted to one type of discount only? - see Cart E

![image](https://user-images.githubusercontent.com/51255216/213882337-e472b4a2-ece7-4077-a678-1fe2df2e7be8.png)

 
