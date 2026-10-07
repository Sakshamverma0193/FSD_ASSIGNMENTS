const FoodOrder = require("./FoodOrder");

// Helper function to pause execution for clean sequential demonstration
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to wait until an order reaches a terminal state
function waitForOrderCompletion(order) {
  return new Promise((resolve) => {
    order.once("orderDelivered", () => resolve("delivered"));
    order.once("paymentFailed", () => resolve("payment_failed"));
    order.once("orderCancelled", () => resolve("cancelled"));
  });
}

// Banner helper for scenario headers
function printScenarioHeader(scenarioNumber, title, description) {
  console.log("\n" + "=".repeat(75));
  console.log(`SCENARIO ${scenarioNumber}: ${title.toUpperCase()}`);
  console.log(`Description: ${description}`);
  console.log("=".repeat(75));
}

async function runDemo() {
  console.log("\n" + "#".repeat(75));
  console.log("#" + " ".repeat(18) + "🍔 EVENT-DRIVEN FOOD ORDERING SYSTEM 🍕" + " ".repeat(16) + "#");
  console.log("#" + " ".repeat(14) + "Full-Stack Development (FSD) Assignment Demo" + " ".repeat(15) + "#");
  console.log("#".repeat(75));

  // -------------------------------------------------------------
  // Scenario 1: Standard Successful Lifecycle
  // -------------------------------------------------------------
  printScenarioHeader(
    1,
    "Successful Food Order",
    "Customer places an order, payment succeeds, kitchen prepares food, and it gets delivered."
  );

  const order1 = new FoodOrder(
    101,
    ["Cheeseburger", "Crispy French Fries", "Cold Soda"],
    25.50,
    true // paymentSuccessful = true
  );

  // Kick off the order lifecycle
  order1.startOrder();
  await waitForOrderCompletion(order1);
  await sleep(1000);

  // -------------------------------------------------------------
  // Scenario 2: Payment Failure
  // -------------------------------------------------------------
  printScenarioHeader(
    2,
    "Payment Failure Handling",
    "Customer places an order, but payment fails due to insufficient balance. Order stops immediately."
  );

  const order2 = new FoodOrder(
    102,
    ["Margherita Pizza", "Stuffed Garlic Bread"],
    18.00,
    false // paymentSuccessful = false
  );

  order2.startOrder();
  await waitForOrderCompletion(order2);
  await sleep(1000);

  // -------------------------------------------------------------
  // Scenario 3: Order Cancellation
  // -------------------------------------------------------------
  printScenarioHeader(
    3,
    "Customer Order Cancellation",
    "Customer places an order, but cancels it during payment/processing. Subsequent stages are aborted."
  );

  const order3 = new FoodOrder(
    103,
    ["Club Sandwich", "Hot Espresso Coffee"],
    12.00,
    true
  );

  order3.startOrder();

  // Simulate the customer deciding to cancel after 400ms (before payment/confirmation completes)
  setTimeout(() => {
    order3.cancelOrder("Customer changed mind / ordered by mistake");
  }, 400);

  await waitForOrderCompletion(order3);
  await sleep(1000);

  // -------------------------------------------------------------
  // Summary of Execution
  // -------------------------------------------------------------
  console.log("=".repeat(75));
  console.log("SIMULATION SUMMARY & LIFECYCLE VERIFICATION");
  console.log("=".repeat(75));
  console.log(`✓ Order 101 Final State: [${order1.status.toUpperCase()}] -> Reached delivery smoothly.`);
  console.log(`✓ Order 102 Final State: [${order2.status.toUpperCase()}] -> Halted safely after payment failure.`);
  console.log(`✓ Order 103 Final State: [${order3.status.toUpperCase()}] -> Halted safely upon customer cancellation.`);
  console.log("=".repeat(75));
  console.log("Demonstration completed successfully!\n");
}

// Run the application
runDemo().catch((err) => {
  console.error("An unexpected error occurred during execution:", err);
});
