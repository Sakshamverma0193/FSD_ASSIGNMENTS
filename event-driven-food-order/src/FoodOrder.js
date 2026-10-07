const EventEmitter = require("events");

// Helper to format timestamps for terminal logs
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

class FoodOrder extends EventEmitter {
  constructor(orderId, items, amount, paymentSuccessful = true) {
    super();

    // Order state and properties
    this.orderId = orderId;
    this.items = Array.isArray(items) ? items : [items];
    this.amount = amount;
    this.paymentSuccessful = paymentSuccessful;
    this.status = "created";
    this.cancelled = false;
    this.currentTimer = null;

    // Register all event listeners for the order lifecycle
    this.setupListeners();
  }

  // Format log messages with timestamp and order ID
  log(event, message) {
    console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] EVENT: ${event.padEnd(16)} | ${message}`);
  }

  // Setup event listeners that define the order workflow
  setupListeners() {
    // Stage 1: Order Placed -> Process Payment
    this.on("orderPlaced", () => {
      this.status = "payment_pending";
      this.log("orderPlaced", `Order placed for [${this.items.join(", ")}] (Total: $${this.amount.toFixed(2)})`);
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Processing payment...`);

      // Simulating payment processing instead of calling a real payment gateway
      this.currentTimer = setTimeout(() => {
        // If the customer cancelled while we were waiting, don't continue the order
        if (this.cancelled) return;

        if (this.paymentSuccessful) {
          this.status = "paid";
          // Payment succeeded, move to next stage
          this.emit("paymentCompleted");
        } else {
          // Payment failed, so there is no reason to send this order to the kitchen
          this.status = "payment_failed";
          this.emit("paymentFailed", "Insufficient funds or card declined");
        }
      }, 1000);
    });

    // Stage 2: Payment Completed -> Restaurant Confirmation
    this.on("paymentCompleted", () => {
      if (this.cancelled) return;

      this.log("paymentCompleted", `Payment of $${this.amount.toFixed(2)} received successfully.`);
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Sending order details to the restaurant...`);

      // Using a timer here to mimic real-world asynchronous processing
      this.currentTimer = setTimeout(() => {
        if (this.cancelled) return;

        this.status = "confirmed";
        this.emit("orderConfirmed");
      }, 600);
    });

    // Stage 3: Order Confirmed -> Kitchen Food Preparation
    this.on("orderConfirmed", () => {
      if (this.cancelled) return;

      this.log("orderConfirmed", "Restaurant accepted and confirmed the order.");
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Kitchen started preparing items...`);
      this.status = "preparing";

      // Preparation takes a bit longer in the kitchen
      this.currentTimer = setTimeout(() => {
        if (this.cancelled) return;

        this.status = "ready";
        this.emit("foodPrepared");
      }, 1500);
    });

    // Stage 4: Food Prepared -> Quality Check & Packaging
    this.on("foodPrepared", () => {
      if (this.cancelled) return;

      this.log("foodPrepared", "Food is freshly cooked and packed.");
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Assigning delivery partner...`);

      // Short delay for assigning delivery partner and dispatching
      this.currentTimer = setTimeout(() => {
        if (this.cancelled) return;

        this.status = "out_for_delivery";
        this.emit("orderReady");
      }, 600);
    });

    // Stage 5: Order Ready -> Out for Delivery
    this.on("orderReady", () => {
      if (this.cancelled) return;

      this.log("orderReady", "Order picked up by delivery partner.");
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Rider is on the way to the customer address...`);

      // Rider transit time
      this.currentTimer = setTimeout(() => {
        if (this.cancelled) return;

        this.status = "delivered";
        this.emit("orderDelivered");
      }, 1500);
    });

    // Stage 6: Order Delivered -> Final Success
    this.on("orderDelivered", () => {
      this.log("orderDelivered", "Order handed over to customer.");
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] >>> ORDER COMPLETED SUCCESSFULLY! Enjoy your meal! <<<\n`);
    });

    // Error Control Event: Payment Failed
    this.on("paymentFailed", (reason) => {
      this.log("paymentFailed", `Payment failed (${reason}). Order halted.`);
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] >>> ORDER TERMINATED: Please retry with a valid payment method. <<<\n`);
    });

    // Error Control Event: Order Cancelled
    this.on("orderCancelled", (reason) => {
      // Clear any pending async timer to stop future actions immediately
      if (this.currentTimer) {
        clearTimeout(this.currentTimer);
        this.currentTimer = null;
      }
      this.log("orderCancelled", `Order cancelled (${reason}). Processing halted.`);
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] >>> ORDER CANCELLED: Refund initiated if applicable. <<<\n`);
    });
  }

  // Method to start the order lifecycle
  startOrder() {
    this.status = "placed";
    this.emit("orderPlaced");
  }

  // Method to allow cancellation at any valid stage
  cancelOrder(reason = "Customer requested cancellation") {
    // Cannot cancel if already delivered, failed, or already cancelled
    if (this.status === "delivered") {
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Cannot cancel: Order has already been delivered.`);
      return false;
    }
    if (this.status === "cancelled" || this.cancelled) {
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Order is already cancelled.`);
      return false;
    }
    if (this.status === "payment_failed") {
      console.log(`[${getTimestamp()}] [ORDER ${this.orderId}] Cannot cancel: Order already failed at payment.`);
      return false;
    }

    this.cancelled = true;
    this.status = "cancelled";
    this.emit("orderCancelled", reason);
    return true;
  }
}

module.exports = FoodOrder;
